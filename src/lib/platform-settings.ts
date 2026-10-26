import type { AdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";

export type PlatformSettings = {
  id: number;
  support_email: string | null;
  default_currency: string;
  trial_days: number;
  signup_enabled: boolean;
  announcement: string | null;
  updated_by: string | null;
  updated_at: string | null;
};

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  id: 1,
  support_email: null,
  default_currency: "GBP",
  trial_days: 30,
  signup_enabled: true,
  announcement: null,
  updated_by: null,
  updated_at: null,
};

export async function getPlatformSettings(admin: AdminClient): Promise<PlatformSettings> {
  const { data, error } = await admin
    .from("platform_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    return { ...DEFAULT_PLATFORM_SETTINGS, trial_days: env.trialDays };
  }

  const trialDays = Number(data.trial_days);
  return {
    ...DEFAULT_PLATFORM_SETTINGS,
    ...data,
    default_currency: String(data.default_currency || "GBP").toUpperCase(),
    trial_days: Number.isFinite(trialDays) ? Math.min(Math.max(Math.trunc(trialDays), 0), 365) : 30,
    signup_enabled: data.signup_enabled !== false,
  };
}

export async function isSignupEnabled(admin: AdminClient) {
  return (await getPlatformSettings(admin)).signup_enabled;
}
