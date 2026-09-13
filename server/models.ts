import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type Role = 'customer' | 'rider' | 'warehouse' | 'admin';
export type ShipmentStatus = 'booked' | 'assigned' | 'picked_up' | 'at_warehouse' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception' | 'cancelled';
export type DeliveryOption = 'standard' | 'express' | 'same_day' | 'premium_overnight';

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
  branchId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>({
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  name: { type: String, required: true, trim: true },
  phone: String,
  role: { type: String, enum: ['customer', 'rider', 'warehouse', 'admin'], default: 'customer', index: true },
  status: { type: String, enum: ['active', 'suspended'], default: 'active', index: true },
  branchId: String,
}, { timestamps: true });

export interface ShipmentDocument extends Document {
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
  branchId?: string;
  pickupAt?: Date;
  deliveredAt?: Date;
  events: Array<Record<string, unknown>>;
  createdAt: Date;
  updatedAt: Date;
}

const shipmentSchema = new Schema<ShipmentDocument>({
  trackingId: { type: String, required: true, unique: true, index: true },
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
  branchId: String,
  pickupAt: Date,
  deliveredAt: Date,
  events: { type: [eventSchema], default: [] },
}, { timestamps: true });

export interface PickupJobDocument extends Document {
  shipmentId: mongoose.Types.ObjectId;
  riderId?: mongoose.Types.ObjectId;
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

export const User: Model<UserDocument> = mongoose.models.User || mongoose.model<UserDocument>('User', userSchema);
export const Shipment: Model<ShipmentDocument> = mongoose.models.Shipment || mongoose.model<ShipmentDocument>('Shipment', shipmentSchema);
export const PickupJob: Model<PickupJobDocument> = mongoose.models.PickupJob || mongoose.model<PickupJobDocument>('PickupJob', pickupJobSchema);
export const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
export const ActivityLog = mongoose.models.ActivityLog || mongoose.model('ActivityLog', activityLogSchema);
export const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
