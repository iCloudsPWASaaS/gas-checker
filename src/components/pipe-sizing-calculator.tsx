"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Ruler } from "lucide-react";
import { PIPE_SIZES, calculatePipeSizing, pipeSizeTable } from "@/lib/pipe-sizing";
import { cn } from "@/lib/utils";

export function PipeSizingCalculator() {
  const [heatInputKw, setHeatInputKw] = useState("24");
  const [pipeId, setPipeId] = useState("copper-22");
  const [lengthM, setLengthM] = useState("10");
  const [targetDropMbar, setTargetDropMbar] = useState("1");
  const [fittingsAllowancePct, setFittingsAllowancePct] = useState("10");

  const selectedPipe = PIPE_SIZES.find((pipe) => pipe.id === pipeId) || PIPE_SIZES[0];

  const result = useMemo(() => {
    const kw = Number(heatInputKw);
    const length = Number(lengthM);
    if (!kw || kw <= 0 || !length || length <= 0) return null;
    return calculatePipeSizing({
      heatInputKw: kw,
      idMm: selectedPipe.id_mm,
      lengthM: length,
      targetDropMbar: Number(targetDropMbar) || 1,
      fittingsAllowancePct: Number(fittingsAllowancePct) || 0,
    });
  }, [heatInputKw, lengthM, selectedPipe, targetDropMbar, fittingsAllowancePct]);

  const table = useMemo(() => {
    const length = Number(lengthM);
    if (!length || length <= 0) return [];
    return pipeSizeTable({
      lengthM: length,
      targetDropMbar: Number(targetDropMbar) || 1,
      fittingsAllowancePct: Number(fittingsAllowancePct) || 0,
    });
  }, [lengthM, targetDropMbar, fittingsAllowancePct]);

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-4">
        <div className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <Ruler className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Pipe sizing</h2>
              <p className="text-xs text-slate-500">Natural gas, low pressure.</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Heat input (kW)</label>
              <input
                value={heatInputKw}
                onChange={(event) => setHeatInputKw(event.target.value)}
                type="number"
                min="0"
                step="0.1"
                className="input"
                placeholder="24"
              />
            </div>
            <div>
              <label className="label">Pipe size</label>
              <select value={pipeId} onChange={(event) => setPipeId(event.target.value)} className="input">
                {PIPE_SIZES.map((pipe) => (
                  <option key={pipe.id} value={pipe.id}>
                    {pipe.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Equivalent length (m)</label>
              <input
                value={lengthM}
                onChange={(event) => setLengthM(event.target.value)}
                type="number"
                min="0.1"
                step="0.1"
                className="input"
              />
            </div>
            <div>
              <label className="label">Target drop (mbar)</label>
              <input
                value={targetDropMbar}
                onChange={(event) => setTargetDropMbar(event.target.value)}
                type="number"
                min="0.1"
                step="0.1"
                className="input"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Fittings allowance (%)</label>
              <input
                value={fittingsAllowancePct}
                onChange={(event) => setFittingsAllowancePct(event.target.value)}
                type="number"
                min="0"
                step="1"
                className="input"
              />
            </div>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            Uses an indicative Darcy-Weisbach calculation for natural gas (SG 0.6). Add bends, tees, elbows and the
            meter to the equivalent length. Always verify against BS 6891 and the manufacturer&apos;s instructions.
          </p>
        </div>

        {result && (
          <div className="card overflow-hidden">
            <div className={cn("px-5 py-4 text-white", result.adequate ? "bg-brand-600" : "bg-red-600")}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">Pressure drop</p>
                  <p className="mt-1 text-3xl font-black">{result.dropMbar} mbar</p>
                  <p className="text-xs text-white/80">
                    Target {result.targetDropMbar} mbar · {result.flowM3H} m³/hr
                  </p>
                </div>
                {result.adequate ? <CheckCircle2 className="h-8 w-8" /> : <AlertTriangle className="h-8 w-8" />}
              </div>
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-100">
              <div className="p-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Max heat input</p>
                <p className="mt-1 text-lg font-extrabold text-slate-900">{result.maxKw} kW</p>
                <p className="text-[11px] text-slate-500">For this size and length</p>
              </div>
              <div className="p-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Velocity</p>
                <p className="mt-1 text-lg font-extrabold text-slate-900">{result.velocityMs} m/s</p>
                <p className="text-[11px] text-slate-500">Reynolds {result.reynolds.toLocaleString("en-GB")}</p>
              </div>
            </div>
            {result.warnings.length > 0 && (
              <div className="border-t border-amber-100 bg-amber-50 px-5 py-3 text-[11px] text-amber-800">
                {result.warnings.map((warning) => (
                  <p key={warning}>{warning}</p>
                ))}
              </div>
            )}
            <p className="border-t border-slate-100 px-5 py-3 text-[11px] leading-relaxed text-slate-500">
              {result.adequate
                ? "This pipe size is within the selected pressure drop for the entered load."
                : "This pipe size is undersized for the entered load. Increase the pipe size or reduce the equivalent length."}
            </p>
          </div>
        )}
      </div>

      <div className="card h-fit p-5">
        <h2 className="text-sm font-bold text-slate-900">Pipe size comparison</h2>
        <p className="mt-1 text-xs text-slate-500">
          Maximum heat input for {lengthM || 0} m and a {targetDropMbar || 1} mbar drop.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-3 font-bold">Pipe</th>
                <th className="py-2 pr-3 font-bold">ID</th>
                <th className="py-2 pr-3 font-bold">Max kW</th>
                <th className="py-2 font-bold">Max m³/hr</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {table.map((row) => (
                <tr key={row.id} className={cn(row.id === selectedPipe.id && "bg-brand-50/60")}>
                  <td className="py-2.5 pr-3 font-semibold text-slate-800">{row.label}</td>
                  <td className="py-2.5 pr-3 text-slate-500">{row.id_mm} mm</td>
                  <td className="py-2.5 pr-3 font-bold text-slate-900">{row.maxKw}</td>
                  <td className="py-2.5 text-slate-600">{row.maxFlowM3H}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
          Indicative sizing only. Include the meter, regulator and all fittings in the equivalent length.
        </p>
      </div>
    </div>
  );
}
