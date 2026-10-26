import { createClient, type User } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { createAdminClient, type AdminClient } from "@/lib/supabase/admin";
import { getAccount, type Account, type PlanRecord } from "@/lib/account";
import { ApiError, isDbNotReady } from "@/lib/api";
import { getPlatformSettings } from "@/lib/platform-settings";
import { PLAN_SEEDS, TRIAL_PLAN_ID } from "@/lib/plans";

export type SignupInput = {
  email: string;
  password: string;
  full_name: string;
  company_name?: string | null;
  phone?: string | null;
};

export type AuthPayload = {
  user: {
    id: string;
    email: string | null;
    email_confirmed_at: string | null;
    user_metadata: Record<string, unknown>;
    created_at: string;
  };
  account: Account | null;
  warning?: string;
};

function mapAuthError(error: { message?: string; code?: string; status?: number } | null) {
  const message = error?.message || "Authentication failed";
  if (/already registered|already exists|email_exists/i.test(message) || error?.code === "email_exists") {
    return new ApiError(409, "EMAIL_IN_USE", "An account with this email already exists.");
  }
  if (/invalid login credentials/i.test(message)) {
    return new ApiError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
  }
  if (/password/i.test(message) && /weak|characters|length/i.test(message)) {
    return new ApiError(422, "WEAK_PASSWORD", message);
  }
  return new ApiError(error?.status && error.status >= 400 ? error.status : 400, "AUTH_ERROR", message);
}

export function publicUser(user: User) {
  return {
    id: user.id,
    email: user.email || null,
    email_confirmed_at: user.email_confirmed_at || null,
    user_metadata: (user.user_metadata || {}) as Record<string, unknown>,
    created_at: user.created_at,
  };
}

export async function safeGetAccount(user: User, admin: AdminClient) {
  try {
    const account = await getAccount(user, admin);
    return { account, warning: undefined };
  } catch (error) {
    if (isDbNotReady(error)) {
      return {
        account: null,
        warning:
          "Account created, but the gas-checker database schema is not set up yet. Run supabase/migrations/0001_init.sql in Supabase, then sign in again.",
      };
    }
    throw error;
  }
}

export async function createAccount(input: SignupInput) {
  const admin = createAdminClient();
  const platform = await getPlatformSettings(admin);
  if (!platform.signup_enabled) {
    throw new ApiError(403, "SIGNUP_DISABLED", "New account signups are currently disabled.");
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: env.autoConfirm,
    user_metadata: {
      full_name: input.full_name,
      company_name: input.company_name || null,
      phone: input.phone || null,
    },
  });

  if (error || !data.user) {
    throw mapAuthError(error);
  }

  const { account, warning } = await safeGetAccount(data.user, admin);

  return {
    user: data.user,
    account,
    warning,
    admin,
  };
}

export function createAnonClient() {
  return createClient(env.supabaseUrl, env.supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function signInWithPassword(email: string, password: string) {
  const supabase = createAnonClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session || !data.user) {
    throw mapAuthError(error);
  }
  const admin = createAdminClient();
  const { account, warning } = await safeGetAccount(data.user, admin);
  return { session: data.session, user: data.user, account, warning, admin };
}

export async function refreshSession(refreshToken: string) {
  const supabase = createAnonClient();
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
  if (error || !data.session || !data.user) {
    throw new ApiError(401, "INVALID_REFRESH_TOKEN", error?.message || "Could not refresh session.");
  }
  const admin = createAdminClient();
  const { account, warning } = await safeGetAccount(data.user, admin);
  return { session: data.session, user: data.user, account, warning };
}

export function getPublicPlans() {
  return PLAN_SEEDS.map((plan) => ({
    ...plan,
    is_trial_plan: plan.id === TRIAL_PLAN_ID,
  }));
}

export function authTokenPayload(result: {
  session: { access_token: string; refresh_token: string; expires_in: number; token_type: string };
  user: User;
  account: Account | null;
  warning?: string;
}) {
  return {
    access_token: result.session.access_token,
    refresh_token: result.session.refresh_token,
    expires_in: result.session.expires_in,
    token_type: result.session.token_type,
    user: publicUser(result.user),
    account: result.account,
    trial: result.account?.subscription
      ? {
          status: result.account.subscription.status,
          plan_id: result.account.subscription.plan_id,
          trial_end: result.account.subscription.trial_end,
          days_left: result.account.trial_days_left,
          active: result.account.subscription_active,
        }
      : null,
    warning: result.warning || null,
  };
}

export async function loadPlans(admin: AdminClient): Promise<PlanRecord[]> {
  const { data, error } = await admin.from("plans").select("*").eq("is_active", true).order("sort_order");
  if (error || !data || data.length === 0) {
    return getPublicPlans();
  }
  return data as PlanRecord[];
}
