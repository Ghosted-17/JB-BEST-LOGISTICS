import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type Role = 'customer' | 'rider' | 'warehouse' | 'branch' | 'carrier' | 'admin';
export type ShipmentStatus = 'booked' | 'assigned' | 'picked_up' | 'at_warehouse' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception' | 'cancelled';
export type DeliveryOption = 'standard' | 'express' | 'same_day' | 'premium_overnight';

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

const addressSchema = new Schema({
  name: { type: String, required: true, trim: true },
  company: String,
  street: { type: String, required: true, trim: true },
  suite: String,
  city: { type: String, required: true, trim: true },
  state: String,
  postalCode: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: String,
}, { _id: false });

const packageSchema = new Schema({
  length: { type: Number, required: true, min: 0.1 },
  width: { type: Number, required: true, min: 0.1 },
  height: { type: Number, required: true, min: 0.1 },
  weight: { type: Number, required: true, min: 0.1 },
  unit: { type: String, enum: ['cm', 'in'], default: 'in' },
  suggestedPackaging: { type: String, enum: ['envelope', 'box', 'pallet', 'custom_crate'], required: true },
  fragile: { type: Boolean, default: false },
  declaredValue: { type: Number, min: 0 },
}, { _id: false });

const eventSchema = new Schema({
  status: { type: String, required: true },
  note: { type: String, required: true },
  location: String,
  actorId: String,
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

export interface UserDocument extends Document {
  email: string;
  passwordHash: string;
  name: string;
  phone?: string;
  role: Role;
  status: 'active' | 'suspended';
  branchId?: mongoose.Types.ObjectId;
  profilePhotoKey?: string;
  mustChangePassword: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>({
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  name: { type: String, required: true, trim: true },
  phone: String,
  role: { type: String, enum: ['customer', 'rider', 'warehouse', 'branch', 'carrier', 'admin'], default: 'customer', index: true },
  status: { type: String, enum: ['active', 'suspended'], default: 'active', index: true },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
  profilePhotoKey: String,
  mustChangePassword: { type: Boolean, default: false },
}, { timestamps: true });

export interface ShipmentDocument extends Document {
  orderId: string;
  trackingId: string;
  customerId: mongoose.Types.ObjectId;
  sender: Record<string, unknown>;
  receiver: Record<string, unknown>;
  package: Record<string, unknown>;
  deliveryOption: DeliveryOption;
  transport: 'road' | 'air' | 'sea';
  carrier?: string;
  status: ShipmentStatus;
  total: number;
  currency: string;
  paymentStatus: 'unpaid' | 'pending' | 'paid' | 'partial';
  assignedRiderId?: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  pickupAt?: Date;
  deliveredAt?: Date;
  events: Array<Record<string, unknown>>;
  createdAt: Date;
  updatedAt: Date;
}

const shipmentSchema = new Schema<ShipmentDocument>({
  orderId: { type: String, required: true, unique: true, index: true, match: /^[A-Z0-9]{20}$/ },
  trackingId: { type: String, required: true, unique: true, index: true, match: /^[A-Z0-9]{20}$/ },
  customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sender: { type: addressSchema, required: true },
  receiver: { type: addressSchema, required: true },
  package: { type: packageSchema, required: true },
  deliveryOption: { type: String, enum: ['standard', 'express', 'same_day', 'premium_overnight'], required: true },
  transport: { type: String, enum: ['road', 'air', 'sea'], required: true },
  carrier: String,
  status: { type: String, enum: ['booked', 'assigned', 'picked_up', 'at_warehouse', 'in_transit', 'out_for_delivery', 'delivered', 'exception', 'cancelled'], default: 'booked', index: true },
  total: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'USD' },
  paymentStatus: { type: String, enum: ['unpaid', 'pending', 'paid', 'partial'], default: 'unpaid' },
  assignedRiderId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
  pickupAt: Date,
  deliveredAt: Date,
  events: { type: [eventSchema], default: [] },
}, { timestamps: true });

shipmentSchema.index({ customerId: 1, createdAt: -1 });
shipmentSchema.index({ status: 1, createdAt: -1 });
shipmentSchema.index({ assignedRiderId: 1, status: 1, createdAt: -1 });
shipmentSchema.index({ branchId: 1, status: 1, createdAt: -1 });

export interface PickupJobDocument extends Document {
  shipmentId: mongoose.Types.ObjectId;
  riderId?: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  status: 'queued' | 'assigned' | 'in_route' | 'completed' | 'failed';
  scheduledAt: Date;
  proofOfPickupUrl?: string;
  qrScannedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const pickupJobSchema = new Schema<PickupJobDocument>({
  shipmentId: { type: Schema.Types.ObjectId, ref: 'Shipment', required: true, index: true },
  riderId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
  status: { type: String, enum: ['queued', 'assigned', 'in_route', 'completed', 'failed'], default: 'queued' },
  scheduledAt: { type: Date, required: true },
  proofOfPickupUrl: String,
  qrScannedAt: Date,
}, { timestamps: true });

const notificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  shipmentId: { type: Schema.Types.ObjectId, ref: 'Shipment' },
  channel: { type: String, enum: ['email', 'sms', 'in_app'], required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  readAt: Date,
}, { timestamps: true });

const activityLogSchema = new Schema({
  actorId: { type: Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  resource: { type: String, required: true },
  resourceId: String,
  ip: String,
  metadata: Schema.Types.Mixed,
}, { timestamps: true });

const paymentSchema = new Schema({
  shipmentId: { type: Schema.Types.ObjectId, ref: 'Shipment', required: true, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  method: { type: String, enum: ['cash', 'installment', 'paystack'], required: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'USD' },
  status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending', index: true },
  reference: { type: String, unique: true, sparse: true },
  installmentNumber: Number,
  installmentCount: Number,
  metadata: Schema.Types.Mixed,
}, { timestamps: true });

export interface AppointmentDocument extends Document {
  customerId?: mongoose.Types.ObjectId;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceType: string;
  appointmentDate: string;
  timeSlot: string;
  status: AppointmentStatus;
  notes?: string;
  branchId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<AppointmentDocument>({
  customerId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  customerName: { type: String, required: true, trim: true },
  customerEmail: { type: String, required: true, lowercase: true, trim: true },
  customerPhone: { type: String, required: true, trim: true },
  serviceType: { type: String, required: true, trim: true },
  appointmentDate: { type: String, required: true },
  timeSlot: { type: String, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'], default: 'pending', index: true },
  notes: { type: String, maxlength: 2000 },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
}, { timestamps: true });

appointmentSchema.index({ branchId: 1, appointmentDate: 1, timeSlot: 1 }, { unique: true, partialFilterExpression: { status: { $in: ['pending', 'confirmed'] } } });
appointmentSchema.index({ customerEmail: 1, appointmentDate: -1 });

export interface BranchDocument extends Document {
  name: string;
  address: Record<string, unknown>;
  phone?: string;
  timezone: string;
  businessHours: Record<string, unknown>;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const branchSchema = new Schema<BranchDocument>({
  name: { type: String, required: true, trim: true },
  address: { type: Schema.Types.Mixed, required: true },
  phone: String,
  timezone: { type: String, default: 'America/New_York' },
  businessHours: { type: Schema.Types.Mixed, default: {} },
  active: { type: Boolean, default: true, index: true },
}, { timestamps: true });

export interface InvoiceDocument extends Document {
  shipmentId?: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  status: 'draft' | 'issued' | 'paid' | 'void' | 'overdue';
  pdfStorageKey?: string;
  dueAt?: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSchema = new Schema<InvoiceDocument>({
  shipmentId: { type: Schema.Types.ObjectId, ref: 'Shipment', index: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  invoiceNumber: { type: String, required: true, unique: true, index: true },
  subtotal: { type: Number, required: true, min: 0 },
  tax: { type: Number, required: true, min: 0, default: 0 },
  total: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'USD' },
  status: { type: String, enum: ['draft', 'issued', 'paid', 'void', 'overdue'], default: 'draft', index: true },
  pdfStorageKey: String,
  dueAt: Date,
  paidAt: Date,
}, { timestamps: true });

export interface WebhookEventDocument extends Document {
  provider: string;
  eventId: string;
  eventType: string;
  payload: Record<string, unknown>;
  status: 'received' | 'processed' | 'failed';
  processedAt?: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const webhookEventSchema = new Schema<WebhookEventDocument>({
  provider: { type: String, required: true },
  eventId: { type: String, required: true },
  eventType: { type: String, required: true },
  payload: { type: Schema.Types.Mixed, required: true },
  status: { type: String, enum: ['received', 'processed', 'failed'], default: 'received', index: true },
  processedAt: Date,
  error: String,
}, { timestamps: true });

webhookEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });

const idempotencyKeySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  key: { type: String, required: true },
  scope: { type: String, required: true },
  requestHash: { type: String, required: true },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  statusCode: Number,
  response: Schema.Types.Mixed,
  expiresAt: { type: Date, required: true, index: true },
}, { timestamps: true });

idempotencyKeySchema.index({ userId: 1, key: 1, scope: 1 }, { unique: true });
idempotencyKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const User: Model<UserDocument> = mongoose.models.User || mongoose.model<UserDocument>('User', userSchema);
export const Shipment: Model<ShipmentDocument> = mongoose.models.Shipment || mongoose.model<ShipmentDocument>('Shipment', shipmentSchema);
export const PickupJob: Model<PickupJobDocument> = mongoose.models.PickupJob || mongoose.model<PickupJobDocument>('PickupJob', pickupJobSchema);
export const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
export const ActivityLog = mongoose.models.ActivityLog || mongoose.model('ActivityLog', activityLogSchema);
export const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
export const Appointment: Model<AppointmentDocument> = mongoose.models.Appointment || mongoose.model<AppointmentDocument>('Appointment', appointmentSchema);
export const Branch: Model<BranchDocument> = mongoose.models.Branch || mongoose.model<BranchDocument>('Branch', branchSchema);
export const Invoice: Model<InvoiceDocument> = mongoose.models.Invoice || mongoose.model<InvoiceDocument>('Invoice', invoiceSchema);
export const WebhookEvent: Model<WebhookEventDocument> = mongoose.models.WebhookEvent || mongoose.model<WebhookEventDocument>('WebhookEvent', webhookEventSchema);
export const IdempotencyKey = mongoose.models.IdempotencyKey || mongoose.model('IdempotencyKey', idempotencyKeySchema);
