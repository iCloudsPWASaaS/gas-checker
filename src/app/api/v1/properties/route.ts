import {
  handleRoute,
  ok,
  parseBody,
  requireActiveSubscription,
  requireAccount,
} from "@/lib/api";
import { parsePagination, searchParam } from "@/lib/query";
import { propertySchema } from "@/lib/validation";

export async function GET(request: Request) {
  return handleRoute(async () => {
    const { ctx, account } = await requireAccount(request);
    requireActiveSubscription(account);

    const url = new URL(request.url);
    const { limit, offset } = parsePagination(url);
    const search = searchParam(url, "search");
    const contactId = searchParam(url, "contact_id");

    let query = ctx.admin
      .from("properties")
      .select("*", { count: "exact" })
      .eq("user_id", ctx.user.id)
      .order("name", { ascending: true })
      .range(offset, offset + limit - 1);

    if (contactId) query = query.eq("contact_id", contactId);
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,address_line1.ilike.%${search}%,postcode.ilike.%${search}%`,
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

    const input = propertySchema.parse(await parseBody(request));
    const { data, error } = await ctx.admin
      .from("properties")
      .insert({ ...input, user_id: ctx.user.id })
      .select("*")
      .single();

    if (error) throw error;
    return ok(data, undefined, { status: 201 });
  });
}
