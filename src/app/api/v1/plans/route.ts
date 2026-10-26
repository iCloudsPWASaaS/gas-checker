import { createAdminClient } from "@/lib/supabase/admin";
import { handleRoute, ok } from "@/lib/api";
import { env } from "@/lib/env";
import { getPublicPlans } from "@/lib/auth-service";

export async function GET() {
  return handleRoute(async () => {
    const admin = createAdminClient();
    const { data, error } = await admin.from("plans").select("*").eq("is_active", true).order("sort_order");
    const plans = error || !data?.length ? getPublicPlans() : data;
    return ok({
      plans,
      trial_days: env.trialDays,
      currency: "GBP",
    });
  });
}
