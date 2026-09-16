import { z } from 'zod';

const addressSchema = z.object({
  name: z.string().trim().min(1).max(120),
  company: z.string().trim().max(120).optional(),
  street: z.string().trim().min(1).max(200),
  suite: z.string().trim().max(80).optional(),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().max(80).optional(),
  postalCode: z.string().trim().min(3).max(20),
  country: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(30),
  email: z.string().email().optional(),
});

const packageSchema = z.object({
  length: z.coerce.number().positive(),
  width: z.coerce.number().positive(),
  height: z.coerce.number().positive(),
  weight: z.coerce.number().positive(),
  unit: z.enum(['cm', 'in']).default('in'),
  fragile: z.boolean().default(false),
  declaredValue: z.coerce.number().min(0).optional(),
});

export const registerSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(7).max(30).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(128),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32).max(200),
  newPassword: z.string().min(8).max(128),
});

export const quoteSchema = packageSchema.extend({
  deliveryOption: z.enum(['standard', 'express', 'same_day', 'premium_overnight']),
  transport: z.enum(['road', 'air', 'sea']),
  international: z.boolean().default(false),
});

export const shipmentSchema = z.object({
  sender: addressSchema,
  receiver: addressSchema,
  package: packageSchema,
  deliveryOption: z.enum(['standard', 'express', 'same_day', 'premium_overnight']),
  transport: z.enum(['road', 'air', 'sea']),
  international: z.boolean().default(false),
});

export const paymentSchema = z.object({
  shipmentId: z.string().min(1),
  method: z.enum(['cash', 'installment', 'paystack']),
  amount: z.coerce.number().positive(),
  installmentNumber: z.coerce.number().int().positive().optional(),
  installmentCount: z.coerce.number().int().positive().optional(),
});

export const appointmentSchema = z.object({
  branchId: z.string().min(1),
  serviceType: z.string().trim().min(1).max(80),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeSlot: z.string().trim().min(1).max(30),
  customerName: z.string().trim().min(1).max(120),
  customerEmail: z.string().trim().email(),
  customerPhone: z.string().trim().min(7).max(30),
  notes: z.string().trim().max(2000).optional(),
});

export const adminUserUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().min(7).max(30).optional(),
    role: z.enum(['admin', 'rider', 'warehouse', 'branch', 'carrier']).optional(),
  status: z.enum(['active', 'suspended']).optional(),
  branchId: z.string().trim().max(100).optional(),
});

export const adminPasswordResetSchema = z.object({
  newPassword: z.string().min(8).max(128),
});

export const adminUserCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
  phone: z.string().trim().min(7).max(30).optional(),
  role: z.enum(['admin', 'rider', 'warehouse', 'branch', 'carrier']),
  branchId: z.string().trim().min(1).optional(),
});

export const branchCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(7).max(30).optional(),
  timezone: z.string().trim().min(1).max(80).default('America/New_York'),
  address: z.record(z.string(), z.unknown()).default({}),
});

export const carrierAssignmentSchema = z.object({
  carrier: z.string().trim().min(2).max(80),
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().min(7).max(30).optional(),
  newPassword: z.string().min(8).max(128).optional(),
});

export const parseBody = <T>(schema: z.ZodType<T>, body: unknown) => {
  const result = schema.safeParse(body);
  if (!result.success) {
    const error = new Error('Request validation failed');
    Object.assign(error, { statusCode: 400, details: result.error.flatten().fieldErrors });
    throw error;
  }
  return result.data;
};

export const parsePagination = (query: Record<string, unknown>) => {
  const page = Math.max(1, Math.min(10000, Number(query.page) || 1));
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 25));
  return { page, limit, skip: (page - 1) * limit };
};