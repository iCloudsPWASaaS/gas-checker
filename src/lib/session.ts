import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient, type AdminClient } from "@/lib/supabase/admin";
import { getAccount, type Account } from "@/lib/account";
import { isDbNotReady } from "@/lib/api";

export type WebSession = {
  user: User;
  admin: AdminClient;
  account: Account | null;
  dbError: string | null;
};

export async function getWebSession(): Promise<WebSession | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  try {
    const account = await getAccount(user, admin);
    return { user, admin, account, dbError: null };
  } catch (error) {
    if (isDbNotReady(error)) {
      return {
        user,
        admin,
        account: null,
        dbError:
          "The gas-checker database schema is not set up yet. Run supabase/migrations/0001_init.sql and 0002_admin.sql in your Supabase SQL editor, then add gas-checker to the exposed schemas.",
      };
    }
    throw error;
  }
}

export async function requireWebSession(): Promise<WebSession> {
  const session = await getWebSession();
  if (!session) redirect("/login");
  return session;
}

export function displayName(session: WebSession) {
  const profile = session.account?.profile as Record<string, unknown> | undefined;
  const name = profile?.full_name;
  if (typeof name === "string" && name.trim()) return name;
  const metadata = session.user.user_metadata as Record<string, unknown> | undefined;
  const metaName = metadata?.full_name;
  if (typeof metaName === "string" && metaName.trim()) return metaName;
  return session.user.email || "Gas Engineer";
}

export function companyName(session: WebSession) {
  const settings = session.account?.settings as Record<string, unknown> | undefined;
  const profile = session.account?.profile as Record<string, unknown> | undefined;
  const value = settings?.company_name || profile?.company_name;
  return typeof value === "string" && value.trim() ? value : "Gas Checker";
}
