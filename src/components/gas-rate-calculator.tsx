"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Gauge, Loader2, Play, RotateCcw, Square, TimerReset } from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import { cn, formatDate } from "@/lib/utils";

type Result = {
  meter_type: "metric" | "imperial";
  reading1: number | null;
  reading2: number | null;
  seconds: number;
  gas_rate_m3_hr: number;
  gross_kw: number;
  net_kw: number;
  formula: string;
};

type HistoryRow = {
  id: string;
  meter_type: string;
  gas_rate_m3_hr: number;
  gross_kw: number;
  net_kw: number;
  seconds: number;
  created_at: string;
};

export function GasRateCalculator() {
  const [meterType, setMeterType] = useState<"metric" | "imperial">("metric");
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      setHistory(await apiFetch<HistoryRow[]>("/api/v1/gas-rate?limit=10"));
    } catch {
      // History is non-critical.
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [running]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);
    const form = new FormData(event.currentTarget);

    try {
      const payload = await apiFetch<{ calculation: Result; saved: boolean }>("/api/v1/gas-rate", {
        method: "POST",
        body: JSON.stringify({
          meter_type: meterType,
          reading1: form.get("reading1") ? Number(form.get("reading1")) : null,
          reading2: form.get("reading2") ? Number(form.get("reading2")) : null,
          seconds: Number(form.get("seconds")),
          save: true,
        }),
      });
      setResult(payload.calculation);
      setSaved(payload.saved);
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not calculate gas rate.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setRunning(false);
    setSeconds(0);
    setResult(null);
    setSaved(false);
    setError(null);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-4">
        <form onSubmit={onSubmit} className="card p-5">
          <div className="mb-4 flex rounded-xl bg-slate-100 p-1">
            {(["metric", "imperial"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMeterType(value)}
                className={cn(
                  "flex-1 rounded-lg px-3 py-2 text-xs font-bold capitalize transition",
                  meterType === value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500",
                )}
              >
                {value === "metric" ? "Metric (m³)" : "Imperial (ft³)"}
              </button>
            ))}
          </div>

          {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

          <div className="rounded-2xl bg-slate-950 p-5 text-center text-white">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Time for one revolution</p>
            <p className="mt-2 font-mono text-4xl font-black tabular-nums">
              {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setRunning((value) => !value)}
                className={cn(
                  "btn px-4 py-2 text-xs",
                  running ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-brand-600 text-white hover:bg-brand-700",
                )}
              >
                {running ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {running ? "Stop" : "Start"}
              </button>
              <button type="button" onClick={reset} className="btn bg-white/10 px-4 py-2 text-xs text-white hover:bg-white/20">
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">{meterType === "metric" ? "Reading 1 (m³)" : "Reading 1 (ft³)"}</label>
              <input name="reading1" type="number" step="0.001" className="input" placeholder="Optional" />
            </div>
            <div>
              <label className="label">{meterType === "metric" ? "Reading 2 (m³)" : "Reading 2 (ft³)"}</label>
              <input name="reading2" type="number" step="0.001" className="input" placeholder="Optional" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Seconds</label>
              <div className="flex gap-2">
                <input
                  name="seconds"
                  type="number"
                  min="1"
                  className="input"
                  value={seconds || ""}
                  onChange={(event) => setSeconds(Number(event.target.value))}
                  placeholder="Time for one full revolution"
                  required
                />
                <span className="flex items-center gap-1 rounded-xl bg-slate-100 px-3 text-xs font-semibold text-slate-500">
                  <TimerReset className="h-3.5 w-3.5" /> sec
                </span>
              </div>
            </div>
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            {meterType === "metric"
              ? "Use the last four digits of the metric meter, including the decimal. With no readings we assume one revolution = 0.01 m³."
              : "Enter imperial readings if available. With no readings we assume one revolution = 1 ft³."}
          </p>

          <button type="submit" className="btn-primary mt-4 w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gauge className="h-4 w-4" />} Calculate gas rate
          </button>
        </form>

        {result && (
          <div className="card overflow-hidden">
            <div className="bg-brand-600 px-5 py-4 text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-100">Result</p>
              <p className="mt-1 text-3xl font-black">{result.gross_kw} kW</p>
              <p className="text-xs text-brand-100">Gross · {result.net_kw} kW net</p>
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-100">
              <div className="p-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Gas rate</p>
                <p className="mt-1 text-lg font-extrabold text-slate-900">{result.gas_rate_m3_hr} m³/hr</p>
              </div>
              <div className="p-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Time</p>
                <p className="mt-1 text-lg font-extrabold text-slate-900">{result.seconds}s</p>
              </div>
            </div>
            <p className="border-t border-slate-100 px-5 py-3 text-[11px] leading-relaxed text-slate-500">{result.formula}</p>
            {saved && <p className="bg-brand-50 px-5 py-2 text-xs font-semibold text-brand-800">Saved to your history.</p>}
          </div>
        )}
      </div>

      <div className="card h-fit p-5">
        <h2 className="text-sm font-bold text-slate-900">Recent calculations</h2>
        {history.length === 0 ? (
          <p className="mt-3 text-xs text-slate-500">Calculations you save will appear here.</p>
        ) : (
          <div className="mt-3 divide-y divide-slate-100">
            {history.map((row) => (
              <div key={row.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {row.gross_kw} kW <span className="text-xs font-normal text-slate-400">gross</span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {row.meter_type} · {row.gas_rate_m3_hr} m³/hr · {row.seconds}s
                  </p>
                </div>
                <span className="text-[11px] text-slate-400">{formatDate(row.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
