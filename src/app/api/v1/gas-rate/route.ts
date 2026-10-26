import {
  handleRoute,
  ok,
  parseBody,
  requireActiveSubscription,
  requireAccount,
} from "@/lib/api";
import { calculateGasRate } from "@/lib/gas-rate";
import { parsePagination } from "@/lib/query";
import { gasRateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  return handleRoute(async () => {
    const { ctx, account } = await requireAccount(request);
    requireActiveSubscription(account);
    const input = gasRateSchema.parse(await parseBody(request));
    const result = calculateGasRate(input);

    if (!input.save) {
      return ok({ calculation: result, saved: false });
    }

    const { data, error } = await ctx.admin
      .from("gas_rate_calculations")
      .insert({
        user_id: ctx.user.id,
        meter_type: result.meter_type,
        reading1: result.reading1,
        reading2: result.reading2,
        seconds: result.seconds,
        gas_rate_m3_hr: result.gas_rate_m3_hr,
        gross_kw: result.gross_kw,
        net_kw: result.net_kw,
      })
      .select("*")
      .single();
    if (error) throw error;

    return ok({ calculation: result, saved: true, record: data });
  });
}

export async function GET(request: Request) {
  return handleRoute(async () => {
    const { ctx, account } = await requireAccount(request);
    requireActiveSubscription(account);
    const { limit, offset } = parsePagination(new URL(request.url));

    const { data, error, count } = await ctx.admin
      .from("gas_rate_calculations")
      .select("*", { count: "exact" })
      .eq("user_id", ctx.user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;

    return ok(data || [], { count: count || 0, limit, offset });
  });
}
