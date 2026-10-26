import {
  handleRoute,
  ok,
  parseBody,
  requireActiveSubscription,
  requireAccount,
} from "@/lib/api";
import { reminderSchema } from "@/lib/validation";

export async function GET(request: Request) {
  return handleRoute(async () => {
    const { ctx, account } = await requireAccount(request);
    requireActiveSubscription(account);

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const kind = url.searchParams.get("kind");

    let query = ctx.admin
      .from("reminders")
      .select("*")
      .eq("user_id", ctx.user.id)
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);
    if (kind) query = query.eq("kind", kind);

    const { data, error } = await query;
    if (error) throw error;
    return ok(data || []);
  });
}

export async function POST(request: Request) {
  return handleRoute(async () => {
    const { ctx, account } = await requireAccount(request);
    requireActiveSubscription(account);
    const input = reminderSchema.parse(await parseBody(request));

    const { data, error } = await ctx.admin
      .from("reminders")
      .insert({ ...input, user_id: ctx.user.id })
      .select("*")
      .single();
    if (error) throw error;
    return ok(data, undefined, { status: 201 });
  });
}
