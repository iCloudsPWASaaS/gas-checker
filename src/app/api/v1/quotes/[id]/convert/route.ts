import {
  ApiError,
  handleRoute,
  ok,
  requireActiveSubscription,
  requireAccount,
} from "@/lib/api";
import { nextDocumentNumber } from "@/lib/documents";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  return handleRoute(async () => {
    const { ctx, account } = await requireAccount(request);
    requireActiveSubscription(account);
    const { id } = await params;

    const { data: quote, error } = await ctx.admin
      .from("documents")
      .select("*")
      .eq("id", id)
      .eq("user_id", ctx.user.id)
      .eq("type", "quote")
      .maybeSingle();
    if (error) throw error;
    if (!quote) throw new ApiError(404, "NOT_FOUND", "Quote not found.");

    const { data: quoteItems } = await ctx.admin
      .from("document_items")
      .select("*")
      .eq("document_id", id)
      .order("sort_order");

    const number = await nextDocumentNumber(ctx.admin, ctx.user.id, "invoice");
    const issueDate = new Date().toISOString().slice(0, 10);
    const dueDate = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);

    const { data: invoice, error: invoiceError } = await ctx.admin
      .from("documents")
      .insert({
        user_id: ctx.user.id,
        type: "invoice",
        number,
        status: "draft",
        client_contact_id: quote.client_contact_id,
        client_name: quote.client_name,
        client_address_line1: quote.client_address_line1,
        client_address_line2: quote.client_address_line2,
        client_address_line3: quote.client_address_line3,
        client_postcode: quote.client_postcode,
        client_phone: quote.client_phone,
        client_email: quote.client_email,
        installation_name: quote.installation_name,
        installation_address_line1: quote.installation_address_line1,
        installation_address_line2: quote.installation_address_line2,
        installation_address_line3: quote.installation_address_line3,
        installation_postcode: quote.installation_postcode,
        installation_phone: quote.installation_phone,
        installation_email: quote.installation_email,
        issue_date: issueDate,
        due_date: dueDate,
        subtotal: quote.subtotal,
        tax_rate: quote.tax_rate,
        tax: quote.tax,
        total: quote.total,
        amount_paid: 0,
        balance: quote.total,
        notes: quote.notes,
        terms: quote.terms,
        meta: { converted_from_quote: quote.id },
      })
      .select("*")
      .single();
    if (invoiceError) throw invoiceError;

    if (quoteItems && quoteItems.length > 0) {
      const { error: itemsError } = await ctx.admin.from("document_items").insert(
        quoteItems.map((item) => ({
          document_id: invoice.id,
          user_id: ctx.user.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.amount,
          sort_order: item.sort_order,
        })),
      );
      if (itemsError) throw itemsError;
    }

    await ctx.admin.from("documents").update({ status: "accepted" }).eq("id", quote.id).eq("user_id", ctx.user.id);

    return ok(invoice, undefined, { status: 201 });
  });
}
