import React from 'react';
import { IslandSummary } from '../types/weather';
import { NEA_PSI_BANDS } from '../utils/thresholds';
import {
  CloudRain,
  Wind,
  Droplets,
  Thermometer,
  Sun,
  ShieldCheck,
  AlertTriangle,
  Compass,
} from 'lucide-react';

interface Props {
  summary: IslandSummary;
  onSelectMetric?: (tab: 'rain' | 'psi' | 'map' | 'forecast') => void;
}

export const KeyMetricsOverview: React.FC<Props> = ({ summary, onSelectMetric }) => {
  const psiBandInfo = NEA_PSI_BANDS[summary.maxPsiBand];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. Rainfall Telemetry */}
      <div
        onClick={() => onSelectMetric?.('rain')}
        className="cursor-pointer group p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-sky-500/50 transition-all shadow-lg hover:shadow-sky-950/20"
      >
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="font-medium flex items-center gap-1.5">
            <CloudRain className="w-4 h-4 text-sky-400" />
            <span>Rainfall Activity</span>
          </span>
          <span className="font-mono text-[11px] text-slate-500">
            {summary.rainingStationsCount}/{summary.totalStationsCount} active
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold font-mono tracking-tight text-white">
            {summary.maxRainValue.toFixed(1)}
            <span className="text-xs font-normal text-slate-400 ml-1">mm</span>
          </div>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded ${
              summary.maxRainValue > 50
                ? 'bg-rose-500/20 text-rose-300'
                : summary.maxRainValue > 10
                ? 'bg-amber-500/20 text-amber-300'
                : summary.maxRainValue > 0.2
                ? 'bg-sky-500/20 text-sky-300'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {summary.maxRainValue > 50
              ? 'Torrential'
              : summary.maxRainValue > 10
              ? 'Heavy'
              : summary.maxRainValue > 2.5
              ? 'Moderate'
              : summary.maxRainValue > 0.2
              ? 'Light'
              : 'Dry Island'}
          </span>
        </div>

        <div className="mt-2 text-xs text-slate-400 truncate">
          {summary.maxRainStation ? (
            <span>
              Peak: <strong className="text-slate-200">{summary.maxRainStation.name}</strong>
            </span>
          ) : (
            <span className="text-slate-500">No precipitation reported</span>
          )}
        </div>
      </div>

      {/* 2. Air Quality: 24-Hour PSI */}
      <div
        onClick={() => onSelectMetric?.('psi')}
        className="cursor-pointer group p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-emerald-500/50 transition-all shadow-lg hover:shadow-emerald-950/20"
      >
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="font-medium flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>24-Hour PSI</span>
          </span>
          <span className="font-mono text-[11px] text-slate-500">{summary.maxPsiRegion}</span>
        </div>

        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold font-mono tracking-tight text-white">
            {summary.maxPsi}
            <span className="text-xs font-normal text-slate-400 ml-1">PSI</span>
          </div>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded"
            style={{
              backgroundColor: psiBandInfo.bgColor,
              color: psiBandInfo.color,
              border: `1px solid ${psiBandInfo.borderColor}`,
            }}
          >
            {summary.maxPsiBand}
          </span>
        </div>

        <div className="mt-2 text-xs text-slate-400 truncate flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: psiBandInfo.color }} />
          <span>{psiBandInfo.range} Band (Official NEA)</span>
        </div>
      </div>

      {/* 3. 1-Hour PM2.5 (Immediate Activity Decision Metric) */}
      <div
        onClick={() => onSelectMetric?.('psi')}
        className="cursor-pointer group p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-amber-500/50 transition-all shadow-lg hover:shadow-amber-950/20"
      >
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="font-medium flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>1-Hour PM2.5</span>
          </span>
          <span className="font-mono text-[11px] text-slate-500">{summary.maxPm25Region}</span>
        </div>

        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold font-mono tracking-tight text-white">
            {summary.maxPm25_1Hr}
            <span className="text-xs font-normal text-slate-400 ml-1">µg/m³</span>
          </div>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded ${
              summary.maxPm25Band === 'Normal'
                ? 'bg-emerald-500/20 text-emerald-300'
                : summary.maxPm25Band === 'Elevated'
                ? 'bg-amber-500/20 text-amber-300'
                : 'bg-rose-500/20 text-rose-300'
            }`}
          >
            {summary.maxPm25Band}
          </span>
        </div>

        <div className="mt-2 text-xs text-slate-400 truncate">
          <span>Key indicator for immediate sports & runs</span>
        </div>
      </div>

      {/* 4. Microclimate Conditions (Temp, Humidity, Wind, UV) */}
      <div
        onClick={() => onSelectMetric?.('forecast')}
        className="cursor-pointer group p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-yellow-500/50 transition-all shadow-lg hover:shadow-yellow-950/20"
      >
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="font-medium flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>Island Conditions</span>
          </span>
          <span className="font-mono text-[11px] text-slate-400 truncate max-w-[120px]">
            {summary.dominantForecast}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Thermometer className="w-3.5 h-3.5 text-rose-400" />
            <span className="font-mono font-bold text-white">{summary.avgTemp ?? 31}°C</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Droplets className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-mono font-bold text-white">{summary.avgHumidity ?? 75}%</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Wind className="w-3.5 h-3.5 text-teal-400" />
            <span className="font-mono font-bold text-white">{summary.avgWindSpeed ?? 5} km/h</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Sun className="w-3.5 h-3.5 text-yellow-400" />
            <span className="font-mono font-bold text-white">
              UV {summary.currentUv !== null ? summary.currentUv : '3'}
            </span>
          </div>
        </div>

        <div className="mt-2 text-[11px] text-slate-500 truncate">
          <span>Official 2-Hour Outlook: {summary.dominantForecast}</span>
        </div>
      </div>
    </div>
  );
};
