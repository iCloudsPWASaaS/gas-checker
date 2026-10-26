import { z } from "zod";

const optionalText = z.string().trim().max(2000).optional().nullable();
const optionalDate = z.string().trim().optional().nullable();
const money = z.coerce.number().finite().min(0).default(0);
const currencyCode = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .refine((value) => {
    try {
      new Intl.NumberFormat("en-GB", { style: "currency", currency: value });
      return true;
    } catch {
      return false;
    }
  }, "Use a valid 3-letter ISO currency code");

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  full_name: z.string().trim().min(2, "Name is required"),
  company_name: optionalText,
  phone: optionalText,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refresh_token: z.string().min(1),
});

export const contactSchema = z.object({
  name: z.string().trim().min(1),
  email: optionalText,
  phone: optionalText,
  address_line1: optionalText,
  address_line2: optionalText,
  address_line3: optionalText,
  postcode: optionalText,
  type: z.enum(["client", "installation", "supplier"]).default("client"),
  notes: optionalText,
});

export const contactUpdateSchema = contactSchema.partial();

export const documentItemSchema = z.object({
  description: z.string().trim().min(1),
  quantity: z.coerce.number().finite().min(0).default(1),
  unit_price: money,
  sort_order: z.coerce.number().int().optional(),
});

export const documentSchema = z.object({
  type: z.enum(["invoice", "quote"]).optional(),
  status: z
    .enum(["draft", "sent", "partially_paid", "paid", "overdue", "accepted", "declined", "expired", "cancelled"])
    .default("draft"),
  number: z.string().trim().optional(),
  client_contact_id: z.string().uuid().optional().nullable(),
  client_name: z.string().trim().min(1),
  client_address_line1: optionalText,
  client_address_line2: optionalText,
  client_address_line3: optionalText,
  client_postcode: optionalText,
  client_phone: optionalText,
  client_email: optionalText,
  installation_name: optionalText,
  installation_address_line1: optionalText,
  installation_address_line2: optionalText,
  installation_address_line3: optionalText,
  installation_postcode: optionalText,
  installation_phone: optionalText,
  installation_email: optionalText,
  issue_date: optionalDate,
  due_date: optionalDate,
  valid_until: optionalDate,
  tax_rate: z.coerce.number().min(0).max(100).default(0),
  notes: optionalText,
  terms: optionalText,
  meta: z.record(z.unknown()).optional(),
  items: z.array(documentItemSchema).min(1, "Add at least one line item"),
});

export const documentUpdateSchema = documentSchema.partial().omit({ items: true });

export const paymentSchema = z.object({
  amount: z.coerce.number().finite().gt(0),
  method: z.enum(["cash", "cheque", "card", "bank", "izettle", "other"]).default("cash"),
  reference: optionalText,
  paid_at: z.string().optional(),
  notes: optionalText,
});

export const appointmentSchema = z.object({
  title: z.string().trim().min(1),
  location: optionalText,
  description: optionalText,
  starts_at: z.string().min(1),
  ends_at: optionalDate,
  all_day: z.coerce.boolean().default(false),
  repeat_rule: z.string().trim().default("never"),
  alert_minutes: z.coerce.number().int().min(0).optional().nullable(),
  url: optionalText,
  contact_id: z.string().uuid().optional().nullable(),
  status: z.enum(["scheduled", "completed", "cancelled"]).default("scheduled"),
});

export const appointmentUpdateSchema = appointmentSchema.partial();

export const reminderSchema = z.object({
  title: z.string().trim().min(1),
  kind: z.enum(["gas_report", "invoice", "custom"]).default("custom"),
  due_date: optionalDate,
  status: z.enum(["pending", "done", "dismissed"]).default("pending"),
  entity_type: optionalText,
  entity_id: z.string().uuid().optional().nullable(),
  notes: optionalText,
});

export const reminderUpdateSchema = reminderSchema.partial();

export const reportSchema = z.object({
  type: z.string().trim().min(1),
  reference: optionalText,
  certificate_number: optionalText,
  job_id: optionalText,
  status: z.enum(["draft", "in_progress", "completed", "cancelled"]).default("draft"),
  contact_id: z.string().uuid().optional().nullable(),
  property_name: optionalText,
  property_address_line1: optionalText,
  property_address_line2: optionalText,
  property_address_line3: optionalText,
  property_postcode: optionalText,
  appliances: z.array(z.record(z.unknown())).optional(),
  defects: z.array(z.record(z.unknown())).optional(),
  readings: z.record(z.unknown()).optional(),
  notes: optionalText,
  pdf_url: optionalText,
  completed_at: optionalDate,
});

export const reportUpdateSchema = reportSchema.partial();

export const settingsSchema = z.object({
  company_name: optionalText,
  company_address_line1: optionalText,
  company_address_line2: optionalText,
  company_address_line3: optionalText,
  postcode: optionalText,
  phone: optionalText,
  email: optionalText,
  gas_engineer_id: optionalText,
  engineer_position: optionalText,
  engineer_signature_url: optionalText,
  email_message: optionalText,
  email_cc: optionalText,
  email_bcc: optionalText,
  certificate_prefix: optionalText,
  invoice_prefix: optionalText,
  quote_prefix: optionalText,
  currency: z.string().trim().max(8).optional(),
  vat_rate: z.coerce.number().min(0).max(100).optional(),
  auto_sync: z.coerce.boolean().optional(),
});

export const gasRateSchema = z.object({
  meter_type: z.enum(["metric", "imperial"]),
  reading1: z.coerce.number().finite().optional().nullable(),
  reading2: z.coerce.number().finite().optional().nullable(),
  seconds: z.coerce.number().int().positive(),
  save: z.coerce.boolean().default(true),
});

export const checkoutSchema = z.object({
  plan_id: z.string().trim().min(1).max(64),
  billing_interval: z.enum(["monthly", "yearly"]).default("monthly"),
});

export const deviceTokenSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(["android", "ios", "web"]).default("android"),
});

export const profileUpdateSchema = z.object({
  full_name: optionalText,
  company_name: optionalText,
  phone: optionalText,
  gas_safe_id: optionalText,
  avatar_url: optionalText,
});

export const adminPlanSchema = z.object({
  id: z
    .string()
    .trim()
    .min(2)
    .max(48)
    .regex(/^[a-z0-9][a-z0-9_-]*$/, "Use lowercase letters, numbers, hyphens or underscores"),
  name: z.string().trim().min(2).max(100),
  description: optionalText,
  monthly_price: z.coerce.number().finite().min(0),
  yearly_price: z.coerce.number().finite().min(0),
  currency: currencyCode,
  features: z.array(z.string().trim().min(1)).default([]),
  max_users: z.coerce.number().int().min(1).default(1),
  max_reports: z.coerce.number().int().min(0).optional().nullable(),
  sort_order: z.coerce.number().int().default(0),
  is_active: z.coerce.boolean().default(true),
  stripe_price_monthly: optionalText,
  stripe_price_yearly: optionalText,
});

export const adminPlanUpdateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: optionalText,
  monthly_price: z.coerce.number().finite().min(0).optional(),
  yearly_price: z.coerce.number().finite().min(0).optional(),
  currency: currencyCode.optional(),
  features: z.array(z.string().trim().min(1)).optional(),
  max_users: z.coerce.number().int().min(1).optional(),
  max_reports: z.coerce.number().int().min(0).optional().nullable(),
  sort_order: z.coerce.number().int().optional(),
  is_active: z.coerce.boolean().optional(),
  stripe_price_monthly: optionalText,
  stripe_price_yearly: optionalText,
});

const subscriptionStatus = z.enum(["trialing", "active", "past_due", "canceled", "expired", "incomplete"]);

export const adminSubscriptionSchema = z.object({
  user_id: z.string().uuid(),
  plan_id: z.string().trim().min(1),
  status: subscriptionStatus.default("trialing"),
  billing_interval: z.enum(["monthly", "yearly"]).default("monthly"),
  trial_start: optionalDate,
  trial_end: optionalDate,
  current_period_start: optionalDate,
  current_period_end: optionalDate,
  cancel_at_period_end: z.coerce.boolean().default(false),
  stripe_customer_id: optionalText,
  stripe_subscription_id: optionalText,
});

export const adminSubscriptionUpdateSchema = z.object({
  plan_id: z.string().trim().min(1).optional(),
  status: subscriptionStatus.optional(),
  billing_interval: z.enum(["monthly", "yearly"]).optional(),
  trial_start: optionalDate,
  trial_end: optionalDate,
  current_period_start: optionalDate,
  current_period_end: optionalDate,
  cancel_at_period_end: z.coerce.boolean().optional(),
  stripe_customer_id: optionalText,
  stripe_subscription_id: optionalText,
});

export const adminUserRoleSchema = z.object({
  role: z.enum(["owner", "admin"]),
});

export const adminPlatformSettingsSchema = z.object({
  support_email: optionalText,
  default_currency: currencyCode,
  trial_days: z.coerce.number().int().min(0).max(365),
  signup_enabled: z.coerce.boolean(),
  announcement: optionalText,
});

export type DocumentInput = z.infer<typeof documentSchema>;
