import {
  handleRoute,
  ok,
  parseBody,
  requireActiveSubscription,
  requireAccount,
} from "@/lib/api";
import { parsePagination, searchParam } from "@/lib/query";
import { contactSchema } from "@/lib/validation";

export async function GET(request: Request) {
  return handleRoute(async () => {
    const { ctx, account } = await requireAccount(request);
    requireActiveSubscription(account);

    const url = new URL(request.url);
    const { limit, offset } = parsePagination(url);
    const search = searchParam(url, "search");
    const type = searchParam(url, "type");

    let query = ctx.admin
      .from("contacts")
      .select("*", { count: "exact" })
      .eq("user_id", ctx.user.id)
      .order("name", { ascending: true })
      .range(offset, offset + limit - 1);

    if (type) query = query.eq("type", type);
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,postcode.ilike.%${search}%`);
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

    const input = contactSchema.parse(await parseBody(request));
    const { data, error } = await ctx.admin
      .from("contacts")
      .insert({ ...input, user_id: ctx.user.id })
      .select("*")
      .single();

    if (error) throw error;
    return ok(data, undefined, { status: 201 });
  });
}
