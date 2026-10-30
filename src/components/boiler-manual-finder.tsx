"use client";

import { useMemo, useState } from "react";
import { BookOpen, ExternalLink, Search } from "lucide-react";

const manufacturers = ["Vaillant", "Worcester Bosch", "Baxi", "Ideal", "Viessmann", "Glow-worm", "Potterton"];

export function BoilerManualFinder() {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");

  const query = useMemo(() => {
    const parts = [make.trim(), model.trim(), "installation servicing manual pdf"].filter(Boolean);
    return parts.join(" ");
  }, [make, model]);

  const href = query
    ? `https://www.google.com/search?q=${encodeURIComponent(query)}`
    : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="card p-5">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <BookOpen className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Boiler manual finder</h2>
            <p className="text-xs text-slate-500">Search for the latest manufacturer literature.</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="label">Manufacturer</label>
            <input
              value={make}
              onChange={(event) => setMake(event.target.value)}
              className="input"
              placeholder="Vaillant"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {manufacturers.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setMake(name)}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-brand-50 hover:text-brand-700"
              >
                {name}
              </button>
            ))}
          </div>
          <div>
            <label className="label">Model</label>
            <input
              value={model}
              onChange={(event) => setModel(event.target.value)}
              className="input"
              placeholder="ecoFIT Pure 830"
            />
          </div>
        </div>

        {href ? (
          <a href={href} target="_blank" rel="noreferrer" className="btn-primary mt-4 w-full">
            <Search className="h-4 w-4" /> Search manuals
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : (
          <button type="button" className="btn-primary mt-4 w-full" disabled>
            <Search className="h-4 w-4" /> Search manuals
          </button>
        )}
        <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
          Opens a web search for the manufacturer&apos;s latest installation, servicing and user manuals. Always use the
          current manual for the exact model and serial number.
        </p>
      </div>

      <div className="card h-fit p-5">
        <h3 className="text-sm font-bold text-slate-900">Manual search tips</h3>
        <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-600">
          <li>Include the full model name and, where possible, the GC number.</li>
          <li>Check the manufacturer&apos;s own download or literature section first.</li>
          <li>Use the installation manual for clearances, gas rates and servicing intervals.</li>
          <li>Do not rely on a manual for a different variant or revision of the appliance.</li>
        </ul>
        <div className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800">
          Always follow the manufacturer&apos;s instructions and current Gas Safe guidance. If the manual is unavailable,
          contact the manufacturer before working on the appliance.
        </div>
      </div>
    </div>
  );
}
