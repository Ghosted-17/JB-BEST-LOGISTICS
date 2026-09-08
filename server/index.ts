import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { config } from './config';
import { connectDatabase } from './db';
import { ActivityLog, Notification, Payment, PickupJob, Shipment, User, type DeliveryOption, type Role, type ShipmentStatus } from './models';
import { allowRoles, issueToken, publicUser, requireAuth, type AuthRequest } from './auth';
import { calculateQuote, isAfterDropoffCutoff } from './pricing';

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: config.clientOrigin, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));

const asyncRoute = (handler: express.RequestHandler): express.RequestHandler => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

const createTrackingId = async () => {
  for (;;) {
    const candidate = crypto.randomInt(1, 10).toString() + Array.from({ length: 19 }, () => crypto.randomInt(0, 10)).join('');
    if (!(await Shipment.exists({ trackingId: candidate }))) return candidate;
  }
};

const logActivity = (req: AuthRequest, action: string, resource: string, resourceId?: string, metadata?: unknown) =>
  ActivityLog.create({ actorId: req.user?._id, action, resource, resourceId, ip: req.ip, metadata });

app.get('/health', (_req, res) => res.json({ ok: true, service: 'jb-best-logistics-api' }));

app.post('/api/auth/register', asyncRoute(async (req, res) => {
  const { email, password, name, phone } = req.body as Record<string, string>;
  if (!email || !password || !name || password.length < 8) return res.status(400).json({ error: 'Name, email, and an 8-character password are required' });
  const exists = await User.exists({ email: email.toLowerCase() });
  if (exists) return res.status(409).json({ error: 'An account with this email already exists' });
  const user = await User.create({ email: email.toLowerCase(), passwordHash: await bcrypt.hash(password, 12), name, phone, role: 'customer' });
  return res.status(201).json({ user: publicUser(user), token: issueToken(user) });
}));

app.post('/api/auth/login', asyncRoute(async (req, res) => {
  const { email, password } = req.body as Record<string, string>;
  const user = await User.findOne({ email: email?.toLowerCase() }).select('+passwordHash');
  if (!user || user.status !== 'active' || !(await bcrypt.compare(password || '', user.passwordHash))) return res.status(401).json({ error: 'Invalid email or password' });
  await logActivity(req as AuthRequest, 'login', 'user', user.id);
  return res.json({ user: publicUser(user), token: issueToken(user) });
}));

app.get('/api/auth/me', requireAuth, (req: AuthRequest, res) => res.json({ user: publicUser(req.user!) }));

app.post('/api/quotes', asyncRoute(async (req, res) => {
  const { length, width, height, weight, deliveryOption, transport, international } = req.body;
  if (![length, width, height, weight].every((value) => Number.isFinite(Number(value)))) return res.status(400).json({ error: 'Package dimensions and weight are required' });
  return res.json(calculateQuote({ length: Number(length), width: Number(width), height: Number(height), weight: Number(weight), deliveryOption: deliveryOption as DeliveryOption, transport, international: Boolean(international) }));
}));

app.post('/api/shipments', requireAuth, allowRoles('customer', 'warehouse', 'admin'), asyncRoute(async (req: AuthRequest, res) => {
  const { sender, receiver, package: packageDetails, deliveryOption, transport, international = false } = req.body;
  if (!sender || !receiver || !packageDetails || !deliveryOption || !transport) return res.status(400).json({ error: 'Sender, receiver, package, delivery option, and transport are required' });
  const quote = calculateQuote({ ...packageDetails, deliveryOption, transport, international });
  if (quote.cutoffPassed && deliveryOption === 'same_day') return res.status(422).json({ error: 'Same-day drop-off cutoff is 5:30 PM local time' });
  const trackingId = await createTrackingId();
  const shipment = await Shipment.create({
    trackingId,
    customerId: req.user!._id,
    sender,
    receiver,
    package: { ...packageDetails, suggestedPackaging: quote.suggestedPackaging },
    deliveryOption,
    transport,
    status: 'booked',
    total: quote.total,
    currency: quote.currency,
    events: [{ status: 'booked', note: 'Shipment booking created', actorId: req.user!._id.toString() }],
  });
  await logActivity(req, 'create', 'shipment', shipment.id, { trackingId });
  await Notification.create({ userId: req.user!._id, shipmentId: shipment._id, channel: 'in_app', title: 'Shipment booked', body: `Tracking ID ${trackingId} is ready.` });
  return res.status(201).json({ shipment, quote, trackingId });
}));

app.get('/api/shipments', requireAuth, asyncRoute(async (req: AuthRequest, res) => {
  const filter = req.user!.role === 'customer' ? { customerId: req.user!._id } : {};
  return res.json({ shipments: await Shipment.find(filter).sort({ createdAt: -1 }).limit(100) });
}));

app.get('/api/shipments/track/:trackingId', asyncRoute(async (req, res) => {
  const shipment = await Shipment.findOne({ trackingId: req.params.trackingId }).select('-customerId');
  if (!shipment) return res.status(404).json({ error: 'Tracking ID not found' });
  return res.json({ shipment });
}));

app.get('/api/shipments/:id/qr', requireAuth, asyncRoute(async (req: AuthRequest, res) => {
  const shipment = await Shipment.findById(req.params.id);
  if (!shipment || (req.user!.role === 'customer' && shipment.customerId.toString() !== req.user!._id.toString())) return res.status(404).json({ error: 'Shipment not found' });
  const dataUrl = await QRCode.toDataURL(`${config.clientOrigin}/track/${shipment.trackingId}`, { errorCorrectionLevel: 'M', margin: 1, width: 320 });
  return res.json({ trackingId: shipment.trackingId, dataUrl });
}));

app.patch('/api/shipments/:id/status', requireAuth, allowRoles('rider', 'warehouse', 'admin'), asyncRoute(async (req: AuthRequest, res) => {
  const { status, note, location } = req.body as { status: ShipmentStatus; note?: string; location?: string };
  const allowed: ShipmentStatus[] = ['assigned', 'picked_up', 'at_warehouse', 'in_transit', 'out_for_delivery', 'delivered', 'exception', 'cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid shipment status' });
  const shipment = await Shipment.findByIdAndUpdate(req.params.id, { status, ...(status === 'delivered' ? { deliveredAt: new Date() } : {}), $push: { events: { status, note: note || `Status updated to ${status}`, location, actorId: req.user!._id.toString() } } }, { new: true });
  if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
  await logActivity(req, 'status_update', 'shipment', shipment.id, { status });
  await Notification.create({ userId: shipment.customerId, shipmentId: shipment._id, channel: 'in_app', title: 'Shipment update', body: `Shipment ${shipment.trackingId} is now ${status.replaceAll('_', ' ')}.` });
  return res.json({ shipment });
}));

app.post('/api/shipments/:id/assign-rider', requireAuth, allowRoles('admin', 'warehouse'), asyncRoute(async (req: AuthRequest, res) => {
  const { riderId, scheduledAt } = req.body as { riderId: string; scheduledAt: string };
  const rider = await User.findOne({ _id: riderId, role: 'rider', status: 'active' });
  if (!rider) return res.status(400).json({ error: 'Active rider not found' });
  const shipment = await Shipment.findByIdAndUpdate(req.params.id, { assignedRiderId: rider._id, status: 'assigned' }, { new: true });
  if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
  const job = await PickupJob.create({ shipmentId: shipment._id, riderId: rider._id, scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(), status: 'assigned' });
  await logActivity(req, 'assign', 'pickup_job', job.id, { shipmentId: shipment.id, riderId });
  return res.json({ shipment, job });
}));

app.post('/api/payments', requireAuth, allowRoles('customer', 'warehouse', 'admin'), asyncRoute(async (req: AuthRequest, res) => {
  const { shipmentId, method, amount, installmentNumber, installmentCount } = req.body as { shipmentId: string; method: 'cash' | 'installment' | 'paystack'; amount: number; installmentNumber?: number; installmentCount?: number };
  if (!shipmentId || !['cash', 'installment', 'paystack'].includes(method) || !Number.isFinite(Number(amount))) return res.status(400).json({ error: 'Shipment, payment method, and amount are required' });
  const shipment = await Shipment.findById(shipmentId);
  if (!shipment || (req.user!.role === 'customer' && shipment.customerId.toString() !== req.user!._id.toString())) return res.status(404).json({ error: 'Shipment not found' });
  const reference = `JB-${crypto.randomBytes(10).toString('hex')}`;
  const payment = await Payment.create({ shipmentId: shipment._id, customerId: shipment.customerId, method, amount: Number(amount), installmentNumber, installmentCount, reference, status: method === 'cash' ? 'pending' : 'pending' });
  if (method === 'paystack') {
    if (!config.paystackSecret) return res.status(503).json({ error: 'Paystack is not configured' });
    const paystack = await fetch('https://api.paystack.co/transaction/initialize', { method: 'POST', headers: { Authorization: `Bearer ${config.paystackSecret}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: req.user!.email, amount: Math.round(Number(amount) * 100), reference, callback_url: `${config.clientOrigin}/payments/complete` }) });
    const result = await paystack.json() as { status?: boolean; message?: string; data?: unknown };
    if (!paystack.ok || !result.status) return res.status(502).json({ error: result.message || 'Unable to initialize Paystack payment' });
    return res.status(201).json({ payment, checkout: result.data });
  }
  return res.status(201).json({ payment });
}));

app.get('/api/jobs', requireAuth, allowRoles('rider', 'warehouse', 'admin'), asyncRoute(async (req: AuthRequest, res) => {
  const filter = req.user!.role === 'rider' ? { riderId: req.user!._id } : {};
  return res.json({ jobs: await PickupJob.find(filter).populate('shipmentId').sort({ scheduledAt: 1 }).limit(100) });
}));

app.get('/api/notifications', requireAuth, asyncRoute(async (req: AuthRequest, res) => {
  return res.json({ notifications: await Notification.find().where('userId').equals(req.user!._id).sort({ createdAt: -1 }).limit(50) });
}));

app.get('/api/reports/summary', requireAuth, allowRoles('admin', 'warehouse'), asyncRoute(async (_req, res) => {
  const [byStatus, revenue] = await Promise.all([
    Shipment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Shipment.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
  ]);
  return res.json({ generatedAt: new Date().toISOString(), byStatus, paidRevenue: revenue[0]?.total || 0 });
}));

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  if (error instanceof mongoose.Error.ValidationError) return res.status(400).json({ error: 'Validation failed', details: Object.values(error.errors).map((item) => item.message) });
  return res.status(500).json({ error: 'Internal server error' });
});

if (process.env.NODE_ENV !== 'test') {
  connectDatabase().then(() => app.listen(config.port, () => console.log(`JB & Best API listening on port ${config.port}`))).catch((error) => {
    console.error('Unable to connect to MongoDB', error);
    process.exit(1);
  });
}

export default app;
