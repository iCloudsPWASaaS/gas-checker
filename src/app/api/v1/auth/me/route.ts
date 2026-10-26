import { handleRoute, ok, requireAccount } from "@/lib/api";
import { publicUser } from "@/lib/auth-service";

export async function GET(request: Request) {
  return handleRoute(async () => {
    const { ctx, account } = await requireAccount(request);
    return ok({
      user: publicUser(ctx.user),
      profile: account.profile,
      settings: account.settings,
      subscription: account.subscription,
      plan: account.plan,
      trial: {
        is_trialing: account.is_trialing,
        days_left: account.trial_days_left,
        active: account.subscription_active,
        trial_end: account.subscription?.trial_end || null,
      },
    });
  });
}
