import React, { useState } from 'react';
import { X, Sliders, CloudFog, CloudRain, Zap, CheckCircle2, RotateCcw } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApplySimulation: (config: {
    overridePsi?: number;
    overrideRainMm?: number;
    overrideForecast?: string;
  } | null) => void;
  currentSimConfig: {
    overridePsi?: number;
    overrideRainMm?: number;
    overrideForecast?: string;
  } | null;
}

export const SimulationControlsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onApplySimulation,
  currentSimConfig,
}) => {
  const [psiVal, setPsiVal] = useState<number>(currentSimConfig?.overridePsi ?? 45);
  const [rainVal, setRainVal] = useState<number>(currentSimConfig?.overrideRainMm ?? 0);
  const [customForecast, setCustomForecast] = useState<string>(
    currentSimConfig?.overrideForecast ?? 'Partly Cloudy'
  );

  if (!isOpen) return null;

  const handleApplyPreset = (preset: {
    psi?: number;
    rain?: number;
    forecast?: string;
  }) => {
    onApplySimulation({
      overridePsi: preset.psi,
      overrideRainMm: preset.rain,
      overrideForecast: preset.forecast,
    });
    onClose();
  };

  const handleApplyCustom = () => {
    onApplySimulation({
      overridePsi: psiVal,
      overrideRainMm: rainVal,
      overrideForecast: customForecast,
    });
    onClose();
  };

  const handleReset = () => {
    onApplySimulation(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">NEA Weather & Alert Simulator</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulate severe weather scenarios to test threshold alert triggers & background effects
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
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Quick Presets */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Quick NEA Alert Presets
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Preset 1: Monsoon Torrential Downpour */}
              <button
                onClick={() =>
                  handleApplyPreset({
                    rain: 68.4,
                    forecast: 'Heavy Thundery Showers with Gusty Winds',
                  })
                }
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-rose-500/50 hover:bg-rose-950/20 transition-all text-left flex items-start gap-3"
              >
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 shrink-0">
                  <CloudRain className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-200 text-xs">Monsoon Torrential Rain</div>
                  <div className="text-[11px] text-rose-300 font-mono mt-0.5">
                    68.4 mm/h (PUB Flash Flood Risk Alert)
                  </div>
                  <p className="text-slate-400 text-[10px] mt-1">Triggers severe rainfall alarm & rain screen</p>
                </div>
              </button>

              {/* Preset 2: Transboundary Haze */}
              <button
                onClick={() =>
                  handleApplyPreset({
                    psi: 165,
                    forecast: 'Hazy',
                  })
                }
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/50 hover:bg-amber-950/20 transition-all text-left flex items-start gap-3"
              >
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                  <CloudFog className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-200 text-xs">Transboundary Haze Episode</div>
                  <div className="text-[11px] text-amber-300 font-mono mt-0.5">
                    PSI 165 (Unhealthy Band 101–200)
                  </div>
                  <p className="text-slate-400 text-[10px] mt-1">
                    Triggers health alert & foggy screen atmosphere
                  </p>
                </div>
              </button>

              {/* Preset 3: Severe Hazardous Haze */}
              <button
                onClick={() =>
                  handleApplyPreset({
                    psi: 320,
                    forecast: 'Dense Haze',
                  })
                }
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-purple-500/50 hover:bg-purple-950/20 transition-all text-left flex items-start gap-3"
              >
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
                  <CloudFog className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-200 text-xs">Hazardous Air Quality Crisis</div>
                  <div className="text-[11px] text-purple-300 font-mono mt-0.5">PSI 320 (Hazardous 301+)</div>
                  <p className="text-slate-400 text-[10px] mt-1">Triggers critical stay-indoors advisory</p>
                </div>
              </button>

              {/* Preset 4: Heavy Afternoon Squall */}
              <button
                onClick={() =>
                  handleApplyPreset({
                    rain: 24.5,
                    forecast: 'Thundery Showers',
                  })
                }
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-sky-500/50 hover:bg-sky-950/20 transition-all text-left flex items-start gap-3"
              >
                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-200 text-xs">Afternoon Thundery Squall</div>
                  <div className="text-[11px] text-sky-300 font-mono mt-0.5">24.5 mm/h (Heavy Rain Warning)</div>
                  <p className="text-slate-400 text-[10px] mt-1">Lightning hazard warning & road advisory</p>
                </div>
              </button>
            </div>
          </div>

          {/* Custom Sliders */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
            <div className="font-semibold text-slate-300 text-xs uppercase tracking-wider">
              Fine-Grained Custom Controls
            </div>

            {/* PSI Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">24-Hr PSI Level:</span>
                <span className="font-mono font-bold text-amber-400">{psiVal} PSI</span>
              </div>
              <input
                type="range"
                min="10"
                max="400"
                value={psiVal}
                onChange={(e) => setPsiVal(Number(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0 Good</span>
                <span>51 Mod</span>
                <span>101 Unhealthy</span>
                <span>201 Very Unhealthy</span>
                <span>301+ Haz</span>
              </div>
            </div>

            {/* Rain Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Rainfall Intensity:</span>
                <span className="font-mono font-bold text-sky-400">{rainVal.toFixed(1)} mm/h</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                step="0.5"
                value={rainVal}
                onChange={(e) => setRainVal(Number(e.target.value))}
                className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0 Dry</span>
                <span>2.5 Light</span>
                <span>10.0 Moderate</span>
                <span>&gt;10 Heavy</span>
                <span>&gt;50 Torrential (Flash Flood)</span>
              </div>
            </div>

            {/* Forecast text */}
            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs">Forecast Condition:</label>
              <select
                value={customForecast}
                onChange={(e) => setCustomForecast(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs"
              >
                <option value="Partly Cloudy">Partly Cloudy</option>
                <option value="Fair (Day)">Fair (Day)</option>
                <option value="Hazy">Hazy (Foggy Screen)</option>
                <option value="Light Showers">Light Showers</option>
                <option value="Moderate Rain">Moderate Rain</option>
                <option value="Heavy Thundery Showers">Heavy Thundery Showers</option>
              </select>
            </div>

            <button
              onClick={handleApplyCustom}
              className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply Custom Parameters</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Live Data.gov.sg APIs</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
