import { handleRoute, ok, parseBody } from "@/lib/api";
import { logAdminAction, requireAdminApi } from "@/lib/admin";
import { getPlatformSettings } from "@/lib/platform-settings";
import { adminPlatformSettingsSchema } from "@/lib/validation";

export async function GET() {
  return handleRoute(async () => {
    const { admin } = await requireAdminApi();
    return ok(await getPlatformSettings(admin));
  });
}

export async function PATCH(request: Request) {
  return handleRoute(async () => {
    const ctx = await requireAdminApi();
    const input = adminPlatformSettingsSchema.parse(await parseBody(request));

    const { data, error } = await ctx.admin
      .from("platform_settings")
      .update({
        support_email: input.support_email || null,
        default_currency: input.default_currency,
        trial_days: input.trial_days,
        signup_enabled: input.signup_enabled,
        announcement: input.announcement || null,
        updated_by: null,
      })
      .eq("id", 1)
      .select("*")
      .single();
    if (error) throw error;

    await logAdminAction(ctx.admin, ctx.email, "platform_settings.update", "platform_settings", "1", input);

    return ok(data);
  });
}
