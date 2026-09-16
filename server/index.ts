import express from 'express';
import multer from 'multer';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { config } from './config';
import { connectDatabase } from './db';
import { ActivityLog, Appointment, Branch, IdempotencyKey, Notification, PasswordResetToken, Payment, PickupJob, Shipment, User, type DeliveryOption, type Role, type ShipmentStatus } from './models';
import { allowRoles, issueToken, publicUser, requireAuth, type AuthRequest } from './auth';
import { calculateQuote, isAfterDropoffCutoff } from './pricing';
import { adminPasswordResetSchema, adminUserCreateSchema, adminUserUpdateSchema, appointmentSchema, branchCreateSchema, carrierAssignmentSchema, forgotPasswordSchema, loginSchema, parseBody, parsePagination, paymentSchema, profileUpdateSchema, quoteSchema, registerSchema, resetPasswordSchema, shipmentSchema } from './validation';
import { uploadPrivateProfilePhoto } from './storage';

const app = express();
const profileUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_req, file, callback) => callback(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) });
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: config.clientOrigin, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));

const asyncRoute = (handler: express.RequestHandler): express.RequestHandler => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

const createShipmentIdentifier = async (field: 'orderId' | 'trackingId') => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (;;) {
    const candidate = Array.from({ length: 20 }, () => alphabet[crypto.randomInt(0, alphabet.length)]).join('');
    if (!(await Shipment.exists({ [field]: candidate }))) return candidate;
  }
};

const logActivity = (req: AuthRequest, action: string, resource: string, resourceId?: string, metadata?: unknown) =>
  ActivityLog.create({ actorId: req.user?._id, action, resource, resourceId, ip: req.ip, metadata });

const httpError = (message: string, statusCode: number) => {
  const error = new Error(message);
  Object.assign(error, { statusCode });
  return error;
};

const claimIdempotency = async (req: AuthRequest, scope: string) => {
  const key = req.header('idempotency-key')?.trim();
  if (!key || key.length > 128) throw httpError('A valid Idempotency-Key header is required', 400);
  const requestHash = crypto.createHash('sha256').update(JSON.stringify(req.body)).digest('hex');
  try {
    return await IdempotencyKey.create({
      userId: req.user!._id,
      key,
      scope,
      requestHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
  } catch (error) {
    if ((error as { code?: number }).code !== 11000) throw error;
    const existing = await IdempotencyKey.findOne({ userId: req.user!._id, key, scope });
    if (!existing || existing.requestHash !== requestHash) throw httpError('Idempotency key was already used with different request data', 409);
    if (existing.status === 'pending') throw httpError('An identical request is already being processed', 409);
    return existing;
  }
};

const completeIdempotency = async (record: { _id: unknown }, statusCode: number, response: unknown) => {
  await IdempotencyKey.findByIdAndUpdate(record._id, { status: 'completed', statusCode, response });
};

app.get('/health', (_req, res) => res.json({ ok: true, service: 'jb-best-logistics-api' }));

app.post('/api/auth/register', asyncRoute(async (req, res) => {
  const { email, password, name, phone } = parseBody(registerSchema, req.body);
  const exists = await User.exists({ email: email.toLowerCase() });
  if (exists) return res.status(409).json({ error: 'An account with this email already exists' });
  const user = await User.create({ email: email.toLowerCase(), passwordHash: await bcrypt.hash(password, 12), name, phone, role: 'customer' });
  return res.status(201).json({ user: publicUser(user), token: issueToken(user) });
}));

app.post('/api/auth/login', asyncRoute(async (req, res) => {
  const { email, password } = parseBody(loginSchema, req.body);
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user || user.status !== 'active' || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: 'Invalid email or password' });
  await logActivity(req as AuthRequest, 'login', 'user', user.id);
  return res.json({ user: publicUser(user), token: issueToken(user) });
}));

app.post('/api/auth/forgot-password', asyncRoute(async (req, res) => {
  const { email } = parseBody(forgotPasswordSchema, req.body);
  const user = await User.findOne({ email: email.toLowerCase(), status: 'active' });
  const response: { message: string; developmentToken?: string } = {
    message: 'If an account exists for that email, reset instructions have been sent.',
  };
  if (user) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    await PasswordResetToken.deleteMany({ userId: user._id, usedAt: { $exists: false } });
    await PasswordResetToken.create({
      userId: user._id,
      tokenHash: crypto.createHash('sha256').update(rawToken).digest('hex'),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });
    if (process.env.NODE_ENV !== 'production') response.developmentToken = rawToken;
  }
  return res.json(response);
}));

app.post('/api/auth/reset-password', asyncRoute(async (req, res) => {
  const { token, newPassword } = parseBody(resetPasswordSchema, req.body);
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const reset = await PasswordResetToken.findOne({ tokenHash, usedAt: { $exists: false }, expiresAt: { $gt: new Date() } });
  if (!reset) return res.status(400).json({ error: 'This reset link is invalid or expired' });
  const user = await User.findByIdAndUpdate(reset.userId, { $set: { passwordHash: await bcrypt.hash(newPassword, 12), status: 'active' } }, { new: true });
  if (!user) return res.status(400).json({ error: 'Account no longer exists' });
  reset.usedAt = new Date();
  await reset.save();
  return res.json({ message: 'Password reset successfully' });
}));

app.patch('/api/profile', requireAuth, profileUpload.single('photo'), asyncRoute(async (req: AuthRequest, res) => {
  const profile = parseBody(profileUpdateSchema, req.body);
  const updates: Record<string, unknown> = { ...profile };
  if (profile.newPassword) updates.passwordHash = await bcrypt.hash(profile.newPassword, 12);
  delete updates.newPassword;
  if (req.file) updates.profilePhotoKey = await uploadPrivateProfilePhoto(req.user!._id.toString(), req.file);
  updates.mustChangePassword = false;
  const user = await User.findByIdAndUpdate(req.user!._id, { $set: updates }, { new: true, runValidators: true });
  return res.json({ user: publicUser(user!) });
}));

app.get('/api/auth/me', requireAuth, (req: AuthRequest, res) => res.json({ user: publicUser(req.user!) }));

app.get('/api/admin/users', requireAuth, allowRoles('admin'), asyncRoute(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
    const filter = { role: { $in: ['admin', 'rider', 'warehouse', 'branch', 'carrier'] as Role[] } };
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  return res.json({ users: users.map(publicUser), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}));

app.post('/api/admin/users', requireAuth, allowRoles('admin'), asyncRoute(async (req: AuthRequest, res) => {
  const account = parseBody(adminUserCreateSchema, req.body);
  if (await User.exists({ email: account.email.toLowerCase() })) return res.status(409).json({ error: 'An account with this email already exists' });
  if (account.branchId && !mongoose.isValidObjectId(account.branchId)) return res.status(400).json({ error: 'Invalid branch ID' });
  if (['branch', 'rider', 'warehouse', 'carrier'].includes(account.role) && !account.branchId) return res.status(400).json({ error: 'Operational accounts require a branch ID' });
  const user = await User.create({
    ...account,
    email: account.email.toLowerCase(),
    passwordHash: await bcrypt.hash(account.password, 12),
    mustChangePassword: true,
    branchId: account.branchId ? new mongoose.Types.ObjectId(account.branchId) : undefined,
  });
  await logActivity(req, 'create_account', 'user', user.id, { role: user.role });
  return res.status(201).json({ user: publicUser(user) });
}));

app.get('/api/admin/branches', requireAuth, allowRoles('admin'), asyncRoute(async (_req, res) => {
  return res.json({ branches: await Branch.find({ active: true }).sort({ name: 1 }) });
}));

app.post('/api/admin/branches', requireAuth, allowRoles('admin'), asyncRoute(async (req: AuthRequest, res) => {
  const branchRequest = parseBody(branchCreateSchema, req.body);
  const branch = await Branch.create(branchRequest);
  await logActivity(req, 'create_branch', 'branch', branch.id);
  return res.status(201).json({ branch });
}));

app.patch('/api/admin/users/:id', requireAuth, allowRoles('admin'), asyncRoute(async (req: AuthRequest, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid user ID' });
  const changes = parseBody(adminUserUpdateSchema, req.body);
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: { $in: ['admin', 'rider', 'warehouse', 'branch', 'carrier'] } },
    { $set: changes },
    { new: true, runValidators: true },
  );
  if (!user) return res.status(404).json({ error: 'Staff account not found' });
  await logActivity(req, 'update_staff_account', 'user', user.id, { changes: Object.keys(changes) });
  return res.json({ user: publicUser(user) });
}));

app.post('/api/admin/users/:id/reset-password', requireAuth, allowRoles('admin'), asyncRoute(async (req: AuthRequest, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid user ID' });
  const { newPassword } = parseBody(adminPasswordResetSchema, req.body);
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: { $in: ['admin', 'rider', 'warehouse', 'branch', 'carrier'] } },
    { $set: { passwordHash: await bcrypt.hash(newPassword, 12), mustChangePassword: true } },
    { new: true },
  );
  if (!user) return res.status(404).json({ error: 'Staff account not found' });
  await logActivity(req, 'reset_staff_password', 'user', user.id);
  return res.json({ user: publicUser(user) });
}));

app.post('/api/appointments', requireAuth, allowRoles('customer', 'warehouse', 'admin'), asyncRoute(async (req: AuthRequest, res) => {
  const appointmentRequest = parseBody(appointmentSchema, req.body);
  const idempotency = await claimIdempotency(req, 'create-appointment');
  if (idempotency.status === 'completed') return res.status(idempotency.statusCode || 200).json(idempotency.response);
  const appointment = await Appointment.create({ ...appointmentRequest, customerId: req.user!._id, status: 'confirmed' });
  const response = { appointment };
  await completeIdempotency(idempotency, 201, response);
  return res.status(201).json(response);
}));

app.get('/api/appointments', requireAuth, allowRoles('customer', 'warehouse', 'admin'), asyncRoute(async (req: AuthRequest, res) => {
  const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
  const filter = req.user!.role === 'customer' ? { customerId: req.user!._id } : {};
  const [appointments, total] = await Promise.all([
    Appointment.find(filter).sort({ appointmentDate: 1, timeSlot: 1 }).skip(skip).limit(limit),
    Appointment.countDocuments(filter),
  ]);
  return res.json({ appointments, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}));

app.post('/api/quotes', asyncRoute(async (req, res) => {
  const quoteRequest = parseBody(quoteSchema, req.body);
  return res.json(calculateQuote(quoteRequest));
}));

app.post('/api/shipments', requireAuth, allowRoles('customer', 'warehouse', 'admin'), asyncRoute(async (req: AuthRequest, res) => {
  const { sender, receiver, package: packageDetails, deliveryOption, transport, international } = parseBody(shipmentSchema, req.body);
  const idempotency = await claimIdempotency(req, 'create-shipment');
  if (idempotency.status === 'completed') return res.status(idempotency.statusCode || 200).json(idempotency.response);
  const quote = calculateQuote({ ...packageDetails, deliveryOption, transport, international });
  if (quote.cutoffPassed && deliveryOption === 'same_day') return res.status(422).json({ error: 'Same-day drop-off cutoff is 5:30 PM local time' });
  const [orderId, trackingId] = await Promise.all([
    createShipmentIdentifier('orderId'),
    createShipmentIdentifier('trackingId'),
  ]);
  const shipment = await Shipment.create({
    orderId,
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
  const response = { shipment, quote, orderId, trackingId };
  await completeIdempotency(idempotency, 201, response);
  return res.status(201).json(response);
}));

app.get('/api/shipments', requireAuth, asyncRoute(async (req: AuthRequest, res) => {
  const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
  const filter = req.user!.role === 'customer'
    ? { customerId: req.user!._id }
    : req.user!.branchId
      ? { branchId: req.user!.branchId }
      : {};
  const [shipments, total] = await Promise.all([
    Shipment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Shipment.countDocuments(filter),
  ]);
  return res.json({ shipments, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}));

app.get('/api/shipments/track/:trackingId', asyncRoute(async (req, res) => {
  const identifier = req.params.trackingId.trim().toUpperCase();
  if (!/^[A-Z0-9]{20}$/.test(identifier)) return res.status(400).json({ error: 'Tracking or order ID must be 20 uppercase letters or numbers' });
  const shipment = await Shipment.findOne({ $or: [{ trackingId: identifier }, { orderId: identifier }] }).select('-customerId');
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

app.post('/api/shipments/:id/assign-rider', requireAuth, allowRoles('admin', 'warehouse', 'branch'), asyncRoute(async (req: AuthRequest, res) => {
  const { riderId, scheduledAt } = req.body as { riderId: string; scheduledAt: string };
  const rider = await User.findOne({ _id: riderId, role: 'rider', status: 'active' });
  if (!rider) return res.status(400).json({ error: 'Active rider not found' });
  if (req.user!.role === 'branch' && (!req.user!.branchId || rider.branchId?.toString() !== req.user!.branchId.toString())) return res.status(403).json({ error: 'Rider is outside your branch' });
  const shipment = await Shipment.findOne({
    _id: req.params.id,
    ...(req.user!.role === 'branch' ? { branchId: req.user!.branchId } : {}),
  });
  if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
  shipment.assignedRiderId = rider._id;
  shipment.status = 'assigned';
  await shipment.save();
  const job = await PickupJob.create({ shipmentId: shipment._id, riderId: rider._id, branchId: shipment.branchId, scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(), status: 'assigned' });
  await logActivity(req, 'assign', 'pickup_job', job.id, { shipmentId: shipment.id, riderId });
  return res.json({ shipment, job });
}));

app.post('/api/shipments/:id/assign-branch', requireAuth, allowRoles('admin'), asyncRoute(async (req: AuthRequest, res) => {
  const { branchId } = req.body as { branchId?: string };
  if (!branchId || !mongoose.isValidObjectId(branchId) || !(await Branch.exists({ _id: branchId, active: true }))) return res.status(400).json({ error: 'Active branch not found' });
  const shipment = await Shipment.findByIdAndUpdate(req.params.id, { branchId: new mongoose.Types.ObjectId(branchId) }, { new: true });
  if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
  return res.json({ shipment });
}));

app.post('/api/shipments/:id/assign-carrier', requireAuth, allowRoles('admin', 'branch'), asyncRoute(async (req: AuthRequest, res) => {
  const { carrier } = parseBody(carrierAssignmentSchema, req.body);
  const shipment = await Shipment.findOne({ _id: req.params.id, ...(req.user!.role === 'branch' ? { branchId: req.user!.branchId } : {}) });
  if (!shipment) return res.status(404).json({ error: 'Shipment not found in your branch' });
  shipment.carrier = carrier;
  await shipment.save();
  return res.json({ shipment });
}));

app.post('/api/payments', requireAuth, allowRoles('customer', 'warehouse', 'admin'), asyncRoute(async (req: AuthRequest, res) => {
  const { shipmentId, method, amount, installmentNumber, installmentCount } = parseBody(paymentSchema, req.body);
  const idempotency = await claimIdempotency(req, 'create-payment');
  if (idempotency.status === 'completed') return res.status(idempotency.statusCode || 200).json(idempotency.response);
  const shipment = await Shipment.findById(shipmentId);
  if (!shipment || (req.user!.role === 'customer' && shipment.customerId.toString() !== req.user!._id.toString())) return res.status(404).json({ error: 'Shipment not found' });
  const reference = `JB-${crypto.randomBytes(10).toString('hex')}`;
  const payment = await Payment.create({ shipmentId: shipment._id, customerId: shipment.customerId, method, amount: Number(amount), installmentNumber, installmentCount, reference, status: method === 'cash' ? 'pending' : 'pending' });
  if (method === 'paystack') {
    if (!config.paystackSecret) return res.status(503).json({ error: 'Paystack is not configured' });
    const paystack = await fetch('https://api.paystack.co/transaction/initialize', { method: 'POST', headers: { Authorization: `Bearer ${config.paystackSecret}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: req.user!.email, amount: Math.round(Number(amount) * 100), reference, callback_url: `${config.clientOrigin}/payments/complete` }) });
    const result = await paystack.json() as { status?: boolean; message?: string; data?: unknown };
    if (!paystack.ok || !result.status) return res.status(502).json({ error: result.message || 'Unable to initialize Paystack payment' });
    const response = { payment, checkout: result.data };
    await completeIdempotency(idempotency, 201, response);
    return res.status(201).json(response);
  }
  const response = { payment };
  await completeIdempotency(idempotency, 201, response);
  return res.status(201).json(response);
}));

app.get('/api/jobs', requireAuth, allowRoles('rider', 'warehouse', 'branch', 'admin'), asyncRoute(async (req: AuthRequest, res) => {
  const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
  const filter = req.user!.role === 'rider' ? { riderId: req.user!._id } : req.user!.branchId ? { branchId: req.user!.branchId } : {};
  const [jobs, total] = await Promise.all([
    PickupJob.find(filter).populate('shipmentId').sort({ scheduledAt: 1 }).skip(skip).limit(limit),
    PickupJob.countDocuments(filter),
  ]);
  return res.json({ jobs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}));

app.get('/api/notifications', requireAuth, asyncRoute(async (req: AuthRequest, res) => {
  const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
  const filter = { userId: req.user!._id };
  const [notifications, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
  ]);
  return res.json({ notifications, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
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
  if (error instanceof Error && 'statusCode' in error) {
    const typedError = error as Error & { statusCode: number; details?: unknown };
    return res.status(typedError.statusCode).json({ error: typedError.message, details: typedError.details });
  }
  if ((error as { code?: number }).code === 11000) return res.status(409).json({ error: 'A record with these unique values already exists' });
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
