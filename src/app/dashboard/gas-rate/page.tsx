import type { Metadata } from "next";
import { PageHeader, UpgradeNotice } from "@/components/ui";
import { GasRateCalculator } from "@/components/gas-rate-calculator";
import { requireWebSession } from "@/lib/session";

export const metadata: Metadata = { title: "Gas rate calculator" };

export default async function GasRatePage() {
  const session = await requireWebSession();
  if (session.account && !session.account.subscription_active) return <UpgradeNotice trialEnded />;

  return (
    <div>
      <PageHeader
        eyebrow="Toolbox"
        title="Gas rate calculator"
        description="Time one revolution of the meter to get the gas rate, gross kW and net kW."
      />
      <GasRateCalculator />
    </div>
  );
}
