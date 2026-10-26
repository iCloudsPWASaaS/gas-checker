import { DashboardShell, SetupRequired } from "@/components/dashboard-shell";
import { getAdminSession } from "@/lib/admin-auth";
import { getPlatformSettings } from "@/lib/platform-settings";
import { companyName, displayName, requireWebSession } from "@/lib/session";
import { humanStatus } from "@/lib/utils";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireWebSession();

  if (session.dbError) {
    return <SetupRequired message={session.dbError} />;
  }

  const account = session.account;
  const subscription = account?.subscription;
  const status = subscription?.status || "trialing";
  const platform = await getPlatformSettings(session.admin);
  const adminSession = await getAdminSession();

  return (
    <DashboardShell
      name={displayName(session)}
      email={session.user.email || ""}
      company={companyName(session)}
      planName={account?.plan?.name || humanStatus(status)}
      trialDaysLeft={account?.trial_days_left || 0}
      active={account?.subscription_active || false}
      isTrialing={account?.is_trialing || false}
      announcement={platform.announcement}
      isAdmin={Boolean(adminSession)}
    >
      {children}
    </DashboardShell>
  );
}
