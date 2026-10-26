import { handleRoute, ok, requireAccount } from "@/lib/api";

export async function GET(request: Request) {
  return handleRoute(async () => {
    const { account } = await requireAccount(request);
    return ok({
      subscription: account.subscription,
      plan: account.plan,
      active: account.subscription_active,
      is_trialing: account.is_trialing,
      trial_days_left: account.trial_days_left,
    });
  });
}
