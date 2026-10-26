import {
  handleRoute,
  ok,
  parseBody,
  requireActiveSubscription,
  requireAccount,
} from "@/lib/api";
import { parsePagination, searchParam } from "@/lib/query";
import { reportSchema } from "@/lib/validation";

export async function GET(request: Request) {
  return handleRoute(async () => {
    const { ctx, account } = await requireAccount(request);
    requireActiveSubscription(account);

    const url = new URL(request.url);
    const { limit, offset } = parsePagination(url);
    const status = searchParam(url, "status");
    const type = searchParam(url, "type");
    const search = searchParam(url, "search");

    let query = ctx.admin
      .from("gas_reports")
      .select("*", { count: "exact" })
      .eq("user_id", ctx.user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq("status", status);
    if (type) query = query.eq("type", type);
    if (search) {
      query = query.or(
        `reference.ilike.%${search}%,certificate_number.ilike.%${search}%,property_name.ilike.%${search}%,property_postcode.ilike.%${search}%`,
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
    const input = reportSchema.parse(await parseBody(request));

    const { data, error } = await ctx.admin
      .from("gas_reports")
      .insert({
        ...input,
        appliances: input.appliances || [],
        defects: input.defects || [],
        readings: input.readings || {},
        completed_at: input.status === "completed" ? input.completed_at || new Date().toISOString() : input.completed_at || null,
        user_id: ctx.user.id,
      })
      .select("*")
      .single();
    if (error) throw error;
    return ok(data, undefined, { status: 201 });
  });
}
