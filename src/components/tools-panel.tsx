"use client";

import { useState } from "react";
import { Box, BookOpen, Gauge, Ruler } from "lucide-react";
import { BoilerManualFinder } from "@/components/boiler-manual-finder";
import { GasRateCalculator } from "@/components/gas-rate-calculator";
import { InstallationVolumeCalculator } from "@/components/installation-volume-calculator";
import { PipeSizingCalculator } from "@/components/pipe-sizing-calculator";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "gas-rate", label: "Gas rate", icon: Gauge },
  { id: "pipe-sizing", label: "Pipe sizing", icon: Ruler },
  { id: "installation-volume", label: "Installation volume", icon: Box },
  { id: "manuals", label: "Manual finder", icon: BookOpen },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function ToolsPanel() {
  const [active, setActive] = useState<TabId>("pipe-sizing");

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-1 rounded-2xl bg-slate-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition",
              active === tab.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700",
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {active === "gas-rate" && <GasRateCalculator />}
      {active === "pipe-sizing" && <PipeSizingCalculator />}
      {active === "installation-volume" && <InstallationVolumeCalculator />}
      {active === "manuals" && <BoilerManualFinder />}
    </div>
  );
}
