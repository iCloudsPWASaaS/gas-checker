import {
  ApiError,
  handleRoute,
  ok,
  parseBody,
  requireActiveSubscription,
  requireAccount,
} from "@/lib/api";
import { recalcDocumentPayment } from "@/lib/documents";
import { paymentSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  return handleRoute(async () => {
    const { ctx, account } = await requireAccount(request);
    requireActiveSubscription(account);
    const { id } = await params;

    const { data, error } = await ctx.admin
      .from("payments")
      .select("*")
      .eq("document_id", id)
      .eq("user_id", ctx.user.id)
      .order("paid_at", { ascending: false });
    if (error) throw error;
    return ok(data || []);
  });
}

export async function POST(request: Request, { params }: Params) {
  return handleRoute(async () => {
    const { ctx, account } = await requireAccount(request);
    requireActiveSubscription(account);
    const { id } = await params;
    const input = paymentSchema.parse(await parseBody(request));

    const { data: document, error: documentError } = await ctx.admin
      .from("documents")
      .select("*")
      .eq("id", id)
      .eq("user_id", ctx.user.id)
      .eq("type", "invoice")
      .maybeSingle();
    if (documentError) throw documentError;
    if (!document) throw new ApiError(404, "NOT_FOUND", "Invoice not found.");

    const { data: payment, error } = await ctx.admin
      .from("payments")
      .insert({
        user_id: ctx.user.id,
        document_id: id,
        amount: input.amount,
        method: input.method,
        reference: input.reference || null,
        paid_at: input.paid_at || new Date().toISOString(),
        notes: input.notes || null,
      })
      .select("*")
      .single();
    if (error) throw error;

    const updated = await recalcDocumentPayment(ctx.admin, ctx.user.id, id);

    return ok({ payment, invoice: updated }, undefined, { status: 201 });
  });
}
