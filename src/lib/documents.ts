import type { AdminClient } from "@/lib/supabase/admin";

export type DocumentItemInput = {
  description: string;
  quantity: number;
  unit_price: number;
  sort_order?: number;
};

export function computeDocumentTotals(items: DocumentItemInput[], taxRate: number) {
  const subtotal = items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0), 0);
  const tax = subtotal * (Number(taxRate || 0) / 100);
  const total = subtotal + tax;
  const round = (value: number) => Number(value.toFixed(2));
  return {
    subtotal: round(subtotal),
    tax: round(tax),
    total: round(total),
  };
}

export async function nextDocumentNumber(admin: AdminClient, userId: string, type: "invoice" | "quote") {
  const { data: settings } = await admin
    .from("settings")
    .select("invoice_prefix,quote_prefix")
    .eq("user_id", userId)
    .maybeSingle();

  const prefix =
    (type === "invoice" ? settings?.invoice_prefix : settings?.quote_prefix) ||
    (type === "invoice" ? "INV" : "QT");

  const { data: docs } = await admin
    .from("documents")
    .select("number")
    .eq("user_id", userId)
    .eq("type", type)
    .order("created_at", { ascending: false })
    .limit(500);

  let max = 0;
  for (const doc of docs || []) {
    const number = String(doc.number || "");
    const match = number.match(/(\d+)\s*$/);
    if (match) max = Math.max(max, Number(match[1]));
  }

  let candidate = max + 1;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const number = `${prefix}-${String(candidate).padStart(4, "0")}`;
    const { data: exists } = await admin
      .from("documents")
      .select("id")
      .eq("user_id", userId)
      .eq("type", type)
      .eq("number", number)
      .maybeSingle();
    if (!exists) return number;
    candidate += 1;
  }

  return `${prefix}-${Date.now()}`;
}

export async function recalcDocumentPayment(admin: AdminClient, userId: string, documentId: string) {
  const [{ data: document }, { data: payments }] = await Promise.all([
    admin.from("documents").select("*").eq("id", documentId).eq("user_id", userId).maybeSingle(),
    admin.from("payments").select("amount").eq("document_id", documentId).eq("user_id", userId),
  ]);

  if (!document) return null;

  const amountPaid = (payments || []).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const total = Number(document.total || 0);
  const balance = Number((total - amountPaid).toFixed(2));
  const round = (value: number) => Number(value.toFixed(2));

  let status = document.status as string;
  if (document.type === "invoice") {
    const today = new Date().toISOString().slice(0, 10);
    const isOverdue = Boolean(document.due_date && String(document.due_date).slice(0, 10) < today);
    if (balance <= 0.001) status = "paid";
    else if (amountPaid > 0) status = isOverdue ? "overdue" : "partially_paid";
    else if (isOverdue) status = "overdue";
  }

  const { data: updated } = await admin
    .from("documents")
    .update({
      amount_paid: round(amountPaid),
      balance,
      status,
    })
    .eq("id", documentId)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  return updated;
}

export async function markOverdueInvoices(admin: AdminClient, userId: string) {
  const today = new Date().toISOString().slice(0, 10);
  await admin
    .from("documents")
    .update({ status: "overdue" })
    .eq("user_id", userId)
    .eq("type", "invoice")
    .in("status", ["sent", "partially_paid"])
    .lt("due_date", today)
    .gt("balance", 0);
}
