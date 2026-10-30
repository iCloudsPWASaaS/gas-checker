import {
  ApiError,
  handleRoute,
  ok,
  parseBody,
  requireActiveSubscription,
  requireAccount,
} from "@/lib/api";
import { parsePagination } from "@/lib/query";
import { notificationCreateSchema, notificationUpdateSchema } from "@/lib/validation";

export async function GET(request: Request) {
  return handleRoute(async () => {
    const { ctx, account } = await requireAccount(request);
    requireActiveSubscription(account);

    const url = new URL(request.url);
    const { limit, offset } = parsePagination(url);
    const unreadOnly = url.searchParams.get("unread") === "1";

    let query = ctx.admin
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", ctx.user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) query = query.is("read_at", null);

    const { data, error, count } = await query;
    if (error) throw error;

    return ok(data || [], { count: count || 0, limit, offset });
  });
}

export async function POST(request: Request) {
  return handleRoute(async () => {
    const { ctx, account } = await requireAccount(request);
    requireActiveSubscription(account);

    const input = notificationCreateSchema.parse(await parseBody(request));
    const { data, error } = await ctx.admin
      .from("notifications")
      .insert({ ...input, user_id: ctx.user.id })
      .select("*")
      .single();

    if (error) throw error;
    return ok(data, undefined, { status: 201 });
  });
}

export async function PATCH(request: Request) {
  return handleRoute(async () => {
    const { ctx, account } = await requireAccount(request);
    requireActiveSubscription(account);

    const input = notificationUpdateSchema.parse(await parseBody(request));
    if (!input.all) {
      throw new ApiError(400, "INVALID_REQUEST", "Use PATCH /api/v1/notifications/:id to mark one notification.");
    }

    const { error } = await ctx.admin
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", ctx.user.id)
      .is("read_at", null);
    if (error) throw error;

    return ok({ updated: true });
  });
}
