import {
  ApiError,
  parseBody,
  requireAccount,
  requireActiveSubscription,
  type AuthContext,
} from "@/lib/api";
import { computeDocumentTotals, markOverdueInvoices, nextDocumentNumber } from "@/lib/documents";
import { parsePagination, searchParam } from "@/lib/query";
import { documentSchema, documentUpdateSchema } from "@/lib/validation";
import type { Account } from "@/lib/account";

export type DocumentType = "invoice" | "quote";

async function context(request: Request): Promise<{ ctx: AuthContext; account: Account }> {
  const result = await requireAccount(request);
  requireActiveSubscription(result.account);
  return result;
}

export async function listDocuments(request: Request, type: DocumentType) {
  const { ctx } = await context(request);
  const url = new URL(request.url);
  const { limit, offset } = parsePagination(url);
  const search = searchParam(url, "search");
  const status = searchParam(url, "status");
  const contactId = searchParam(url, "contact_id");

  if (type === "invoice") {
    await markOverdueInvoices(ctx.admin, ctx.user.id);
  }

  let query = ctx.admin
    .from("documents")
    .select("*", { count: "exact" })
    .eq("user_id", ctx.user.id)
    .eq("type", type)
    .order("issue_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);
  if (contactId) query = query.eq("client_contact_id", contactId);
  if (search) query = query.or(`number.ilike.%${search}%,client_name.ilike.%${search}%,client_email.ilike.%${search}%`);

  const { data, error, count } = await query;
  if (error) throw error;

  return { data: data || [], count: count || 0, limit, offset };
}

export async function createDocument(request: Request, type: DocumentType) {
  const { ctx } = await context(request);
  const input = documentSchema.parse(await parseBody(request));

  const { data: settings } = await ctx.admin
    .from("settings")
    .select("vat_rate")
    .eq("user_id", ctx.user.id)
    .maybeSingle();

  const taxRate = input.tax_rate ?? Number(settings?.vat_rate || 0);
  const totals = computeDocumentTotals(input.items, taxRate);
  const number = input.number || (await nextDocumentNumber(ctx.admin, ctx.user.id, type));

  const issueDate = input.issue_date || new Date().toISOString().slice(0, 10);
  const dueDate =
    input.due_date ||
    (type === "invoice"
      ? new Date(new Date(issueDate).getTime() + 14 * 86400000).toISOString().slice(0, 10)
      : null);
  const validUntil =
    input.valid_until ||
    (type === "quote"
      ? new Date(new Date(issueDate).getTime() + 30 * 86400000).toISOString().slice(0, 10)
      : null);

  const { data: document, error } = await ctx.admin
    .from("documents")
    .insert({
      user_id: ctx.user.id,
      type,
      number,
      status: input.status,
      client_contact_id: input.client_contact_id || null,
      client_name: input.client_name,
      client_address_line1: input.client_address_line1 || null,
      client_address_line2: input.client_address_line2 || null,
      client_address_line3: input.client_address_line3 || null,
      client_postcode: input.client_postcode || null,
      client_phone: input.client_phone || null,
      client_email: input.client_email || null,
      installation_name: input.installation_name || null,
      installation_address_line1: input.installation_address_line1 || null,
      installation_address_line2: input.installation_address_line2 || null,
      installation_address_line3: input.installation_address_line3 || null,
      installation_postcode: input.installation_postcode || null,
      installation_phone: input.installation_phone || null,
      installation_email: input.installation_email || null,
      issue_date: issueDate,
      due_date: dueDate,
      valid_until: validUntil,
      subtotal: totals.subtotal,
      tax_rate: taxRate,
      tax: totals.tax,
      total: totals.total,
      amount_paid: 0,
      balance: totals.total,
      notes: input.notes || null,
      terms: input.terms || null,
      meta: input.meta || {},
    })
    .select("*")
    .single();

  if (error) throw error;

  const items = input.items.map((item, index) => ({
    document_id: document.id,
    user_id: ctx.user.id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    amount: Number((Number(item.quantity) * Number(item.unit_price)).toFixed(2)),
    sort_order: item.sort_order ?? index,
  }));

  const { data: savedItems, error: itemsError } = await ctx.admin.from("document_items").insert(items).select("*");
  if (itemsError) {
    await ctx.admin.from("documents").delete().eq("id", document.id);
    throw itemsError;
  }

  return { ...document, items: savedItems || [] };
}

export async function getDocument(request: Request, id: string, type?: DocumentType) {
  const { ctx } = await context(request);

  let query = ctx.admin.from("documents").select("*").eq("id", id).eq("user_id", ctx.user.id);
  if (type) query = query.eq("type", type);
  const { data: document, error } = await query.maybeSingle();
  if (error) throw error;
  if (!document) throw new ApiError(404, "NOT_FOUND", "Document not found.");

  const [{ data: items }, { data: payments }] = await Promise.all([
    ctx.admin.from("document_items").select("*").eq("document_id", id).order("sort_order"),
    ctx.admin.from("payments").select("*").eq("document_id", id).order("paid_at", { ascending: false }),
  ]);

  return { ...document, items: items || [], payments: payments || [] };
}

export async function updateDocument(request: Request, id: string) {
  const { ctx } = await context(request);
  const input = documentUpdateSchema.parse(await parseBody(request));

  const { data: current, error: currentError } = await ctx.admin
    .from("documents")
    .select("*")
    .eq("id", id)
    .eq("user_id", ctx.user.id)
    .maybeSingle();
  if (currentError) throw currentError;
  if (!current) throw new ApiError(404, "NOT_FOUND", "Document not found.");

  const patch: Record<string, unknown> = {};
  const keys = [
    "status",
    "number",
    "client_contact_id",
    "client_name",
    "client_address_line1",
    "client_address_line2",
    "client_address_line3",
    "client_postcode",
    "client_phone",
    "client_email",
    "installation_name",
    "installation_address_line1",
    "installation_address_line2",
    "installation_address_line3",
    "installation_postcode",
    "installation_phone",
    "installation_email",
    "issue_date",
    "due_date",
    "valid_until",
    "notes",
    "terms",
    "meta",
  ] as const;

  for (const key of keys) {
    if (input[key] !== undefined) patch[key] = input[key] === "" ? null : input[key];
  }

  if (input.tax_rate !== undefined) {
    const subtotal = Number(current.subtotal || 0);
    const tax = Number((subtotal * (Number(input.tax_rate) / 100)).toFixed(2));
    const total = Number((subtotal + tax).toFixed(2));
    patch.tax_rate = input.tax_rate;
    patch.tax = tax;
    patch.total = total;
    patch.balance = Number((total - Number(current.amount_paid || 0)).toFixed(2));
  }

  const { data, error } = await ctx.admin
    .from("documents")
    .update(patch)
    .eq("id", id)
    .eq("user_id", ctx.user.id)
    .select("*")
    .single();
  if (error) throw error;

  return data;
}

export async function deleteDocument(request: Request, id: string) {
  const { ctx } = await context(request);
  const { error } = await ctx.admin.from("documents").delete().eq("id", id).eq("user_id", ctx.user.id);
  if (error) throw error;
  return { deleted: true, id };
}
