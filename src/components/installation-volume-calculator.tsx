"use client";

import { useMemo, useState } from "react";
import { Box, Plus, Trash2 } from "lucide-react";
import { calculateInstallationVolume } from "@/lib/installation-volume";

type SectionState = {
  key: string;
  diameterMm: string;
  lengthM: string;
  quantity: string;
};

function newSection(diameterMm = "22", lengthM = "5"): SectionState {
  return {
    key: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    diameterMm,
    lengthM,
    quantity: "1",
  };
}

export function InstallationVolumeCalculator() {
  const [sections, setSections] = useState<SectionState[]>([newSection()]);
  const [meterVolumeM3, setMeterVolumeM3] = useState("0.0035");
  const [purgeFactor, setPurgeFactor] = useState("1.5");

  const result = useMemo(
    () =>
      calculateInstallationVolume({
        sections: sections.map((section) => ({
          diameterMm: Number(section.diameterMm) || 0,
          lengthM: Number(section.lengthM) || 0,
          quantity: Number(section.quantity) || 1,
        })),
        meterVolumeM3: Number(meterVolumeM3) || 0,
        purgeFactor: Number(purgeFactor) || 1,
      }),
    [sections, meterVolumeM3, purgeFactor],
  );

  function updateSection(key: string, field: keyof Omit<SectionState, "key">, value: string) {
    setSections((rows) => rows.map((row) => (row.key === key ? { ...row, [field]: value } : row)));
  }

  function removeSection(key: string) {
    setSections((rows) => (rows.length === 1 ? rows : rows.filter((row) => row.key !== key)));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="card p-5">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Box className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Installation volume</h2>
            <p className="text-xs text-slate-500">Pipework plus meter volume and purge volume.</p>
          </div>
        </div>

        <div className="space-y-3">
          {sections.map((section) => (
            <div key={section.key} className="grid grid-cols-[1fr_1fr_0.7fr_auto] items-end gap-2">
              <div>
                <label className="label">Diameter (mm)</label>
                <input
                  value={section.diameterMm}
                  onChange={(event) => updateSection(section.key, "diameterMm", event.target.value)}
                  type="number"
                  min="1"
                  step="0.1"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Length (m)</label>
                <input
                  value={section.lengthM}
                  onChange={(event) => updateSection(section.key, "lengthM", event.target.value)}
                  type="number"
                  min="0"
                  step="0.1"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Qty</label>
                <input
                  value={section.quantity}
                  onChange={(event) => updateSection(section.key, "quantity", event.target.value)}
                  type="number"
                  min="1"
                  step="1"
                  className="input"
                />
              </div>
              <button
                type="button"
                onClick={() => removeSection(section.key)}
                className="mb-0.5 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                title="Remove section"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <button type="button" onClick={() => setSections((rows) => [...rows, newSection()])} className="btn-secondary mt-3">
          <Plus className="h-4 w-4" /> Add pipe section
        </button>

        <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
          <div>
            <label className="label">Meter volume (m³)</label>
            <input
              value={meterVolumeM3}
              onChange={(event) => setMeterVolumeM3(event.target.value)}
              type="number"
              min="0"
              step="0.0001"
              className="input"
            />
            <p className="mt-1 text-[10px] text-slate-400">Typical U6 meter ≈ 0.0035 m³.</p>
          </div>
          <div>
            <label className="label">Purge factor</label>
            <input
              value={purgeFactor}
              onChange={(event) => setPurgeFactor(event.target.value)}
              type="number"
              min="1"
              step="0.1"
              className="input"
            />
            <p className="mt-1 text-[10px] text-slate-400">Common allowance is 1.5 × installation volume.</p>
          </div>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
          Use internal diameters. Include every section of pipework. Verify purging procedures against the current
          Gas Safe guidance and the meter/pipework manufacturer&apos;s instructions.
        </p>
      </div>

      <div className="space-y-4">
        <div className="card overflow-hidden">
          <div className="bg-brand-600 px-5 py-4 text-white">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-100">Installation volume</p>
            <p className="mt-1 text-3xl font-black">{result.installationVolumeM3} m³</p>
            <p className="text-xs text-brand-100">
              {result.installationVolumeFt3} ft³ · purge {result.purgeVolumeM3} m³
            </p>
          </div>
          <div className="grid grid-cols-2 divide-x divide-slate-100">
            <div className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Pipework</p>
              <p className="mt-1 text-lg font-extrabold text-slate-900">{result.pipeVolumeM3} m³</p>
            </div>
            <div className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Meter</p>
              <p className="mt-1 text-lg font-extrabold text-slate-900">{result.meterVolumeM3} m³</p>
            </div>
          </div>
          <div className="border-t border-slate-100 px-5 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Purge volume</p>
            <p className="mt-1 text-lg font-extrabold text-slate-900">
              {result.purgeVolumeM3} m³ <span className="text-xs font-normal text-slate-500">({result.purgeVolumeFt3} ft³)</span>
            </p>
            <p className="text-[11px] text-slate-500">Purge factor {result.purgeFactor}×</p>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-bold text-slate-900">Section breakdown</h3>
          {result.sectionVolumes.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500">Add a pipe section to see its volume.</p>
          ) : (
            <div className="mt-2 divide-y divide-slate-100">
              {result.sectionVolumes.map((section, index) => (
                <div key={`${section.diameterMm}-${index}`} className="flex items-center justify-between py-2.5 text-xs">
                  <span className="text-slate-600">
                    {section.diameterMm} mm × {section.lengthM} m × {section.quantity}
                  </span>
                  <span className="font-semibold text-slate-900">{section.volumeM3} m³</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
