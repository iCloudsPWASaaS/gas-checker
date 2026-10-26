import {
  handleRoute,
  ok,
  parseBody,
  requireActiveSubscription,
  requireAccount,
} from "@/lib/api";
import { appointmentSchema } from "@/lib/validation";

export async function GET(request: Request) {
  return handleRoute(async () => {
    const { ctx, account } = await requireAccount(request);
    requireActiveSubscription(account);

    const url = new URL(request.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const status = url.searchParams.get("status");

    let query = ctx.admin
      .from("appointments")
      .select("*")
      .eq("user_id", ctx.user.id)
      .order("starts_at", { ascending: true });

    if (from) query = query.gte("starts_at", from);
    if (to) query = query.lte("starts_at", to);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw error;
    return ok(data || []);
  });
}

export async function POST(request: Request) {
  return handleRoute(async () => {
    const { ctx, account } = await requireAccount(request);
    requireActiveSubscription(account);
    const input = appointmentSchema.parse(await parseBody(request));

    const { data, error } = await ctx.admin
      .from("appointments")
      .insert({ ...input, user_id: ctx.user.id })
      .select("*")
      .single();
    if (error) throw error;
    return ok(data, undefined, { status: 201 });
  });
}
