import {
  handleRoute,
  ok,
  parseBody,
  requireActiveSubscription,
  requireAccount,
} from "@/lib/api";
import { createNotification } from "@/lib/notifications";
import { parsePagination, searchParam } from "@/lib/query";
import { jobSchema } from "@/lib/validation";

export async function GET(request: Request) {
  return handleRoute(async () => {
    const { ctx, account } = await requireAccount(request);
    requireActiveSubscription(account);

    const url = new URL(request.url);
    const { limit, offset } = parsePagination(url);
    const search = searchParam(url, "search");
    const status = searchParam(url, "status");
    const priority = searchParam(url, "priority");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    let query = ctx.admin
      .from("jobs")
      .select("*", { count: "exact" })
      .eq("user_id", ctx.user.id)
      .order("scheduled_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq("status", status);
    if (priority) query = query.eq("priority", priority);
    if (from) query = query.gte("scheduled_at", from);
    if (to) query = query.lte("scheduled_at", to);
    if (search) {
      query = query.or(
        `title.ilike.%${search}%,reference.ilike.%${search}%,description.ilike.%${search}%`,
      );
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return ok(data || [], { count: count || 0, limit, offset });
  });
}

export async function POST(request: Request) {
  return handleRoute(async () => {
    const { ctx, account } = await requireAccount(request);
    requireActiveSubscription(account);

    const input = jobSchema.parse(await parseBody(request));
    const { data, error } = await ctx.admin
      .from("jobs")
      .insert({ ...input, user_id: ctx.user.id })
      .select("*")
      .single();

    if (error) throw error;

    if (data) {
      await createNotification(ctx.admin, ctx.user.id, {
        title: "Job scheduled",
        body: data.scheduled_at
          ? `${data.title} on ${new Date(data.scheduled_at).toISOString().slice(0, 16).replace("T", " ")}`
          : data.title,
        kind: "job",
        link: "/dashboard/jobs",
      });
    }

    return ok(data, undefined, { status: 201 });
  });
}
