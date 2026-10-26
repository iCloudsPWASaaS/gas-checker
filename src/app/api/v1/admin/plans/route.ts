import { ApiError, handleRoute, ok, parseBody } from "@/lib/api";
import { logAdminAction, requireAdminApi } from "@/lib/admin";
import { adminPlanSchema } from "@/lib/validation";

export async function GET() {
  return handleRoute(async () => {
    const { admin } = await requireAdminApi();
    const { data, error } = await admin.from("plans").select("*").order("sort_order");
    if (error) throw error;
    return ok(data || []);
  });
}

export async function POST(request: Request) {
  return handleRoute(async () => {
    const ctx = await requireAdminApi();
    const input = adminPlanSchema.parse(await parseBody(request));

    const { data, error } = await ctx.admin
      .from("plans")
      .insert({
        ...input,
        description: input.description || null,
        stripe_price_monthly: input.stripe_price_monthly || null,
        stripe_price_yearly: input.stripe_price_yearly || null,
      })
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new ApiError(409, "PLAN_EXISTS", "A plan with that ID already exists.");
      }
      throw error;
    }

    await logAdminAction(ctx.admin, ctx.email, "plan.create", "plan", data.id, {
      name: data.name,
      monthly_price: data.monthly_price,
      yearly_price: data.yearly_price,
    });

    return ok(data, undefined, { status: 201 });
  });
}
