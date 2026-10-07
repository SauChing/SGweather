import React from 'react';
import { X, BookOpen, Shield, CloudRain, Wind } from 'lucide-react';
import { NEA_PSI_BANDS, NEA_PM25_BANDS } from '../utils/thresholds';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ThresholdReferenceModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div
        className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Official NEA Standards & Advisory Thresholds</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Singapore National Environment Agency (NEA) and PUB regulatory frameworks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Section 1: 24-Hour PSI */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Shield className="w-4 h-4 text-emerald-400" />
              <h4>1. 24-Hour Pollutant Standards Index (PSI) Bands</h4>
            </div>
            <p className="text-slate-400 text-xs">
              Based on overall air quality criteria pollutants (PM2.5, PM10, O3, CO, NO2, SO2). Used for national health advisory planning.
            </p>

            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60 divide-y divide-slate-800">
              {Object.values(NEA_PSI_BANDS).map((band) => (
                <div key={band.band} className="p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div className="w-44 shrink-0 flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: band.color }} />
                    <div>
                      <div className="font-bold text-slate-200 text-sm">{band.band}</div>
                      <div className="font-mono text-[11px] text-slate-400">{band.range} PSI</div>
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                    <div className="p-2 rounded bg-slate-900/60 border border-slate-800/80">
                      <span className="text-slate-400 font-semibold text-[10px] uppercase block mb-0.5">Healthy Population</span>
                      <span>{band.generalPublicAdvice}</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900/60 border border-slate-800/80">
                      <span className="text-amber-400 font-semibold text-[10px] uppercase block mb-0.5">Vulnerable Population</span>
                      <span className="text-slate-300">{band.vulnerableAdvice}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: 1-Hour PM2.5 Guidance */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Wind className="w-4 h-4 text-amber-400" />
              <h4>2. 1-Hour PM2.5 Concentration Guide (Immediate Decisions)</h4>
            </div>
            <p className="text-slate-400 text-xs">
              NEA official indicator for immediate outdoor activities, athletic training, marathons, and physical education classes.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.values(NEA_PM25_BANDS).map((b) => (
                <div key={b.band} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">{b.band}</span>
                    <span className="font-mono text-[11px] font-bold" style={{ color: b.color }}>
                      {b.range}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">{b.advice}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Rainfall Intensity & Flood Risk */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <CloudRain className="w-4 h-4 text-sky-400" />
              <h4>3. Rainfall Intensity & Flash Flood Thresholds (NEA / PUB)</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-sky-400 font-bold">Light Rain</div>
                <div className="font-mono text-slate-300 text-[11px]">0.2 – 2.5 mm/h</div>
                <p className="text-slate-400 text-[11px] mt-1">Passing drizzle. Minor wet pavements.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-blue-400 font-bold">Moderate Rain</div>
                <div className="font-mono text-slate-300 text-[11px]">2.6 – 10.0 mm/h</div>
                <p className="text-slate-400 text-[11px] mt-1">Slippery roads. Umbrella advised.</p>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30">
                <div className="text-amber-400 font-bold">Heavy Rain (Warning)</div>
                <div className="font-mono text-slate-300 text-[11px]">10.1 – 50.0 mm/h</div>
                <p className="text-slate-300 text-[11px] mt-1">
                  Sudden wind squalls. Reduced road visibility. Postpone field sports.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/40">
                <div className="text-rose-400 font-bold">Torrential / Severe (PUB Alert)</div>
                <div className="font-mono text-slate-300 text-[11px]">&gt; 50.0 mm/h</div>
                <p className="text-rose-200 text-[11px] mt-1">
                  High flash flood risk. Avoid low-lying canals, stay indoors.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Source: National Environment Agency (nea.gov.sg)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
