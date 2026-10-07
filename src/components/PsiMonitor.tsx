import React, { useState } from 'react';
import { RegionalPsiReading } from '../types/weather';
import { NEA_PSI_BANDS, NEA_PM25_BANDS } from '../utils/thresholds';
import { ShieldCheck, HeartHandshake, Baby, AlertTriangle } from 'lucide-react';

interface Props {
  psiReadings: RegionalPsiReading[];
}

export const PsiMonitor: React.FC<Props> = ({ psiReadings }) => {
  const [selectedPollutant, setSelectedPollutant] = useState<
    'psi24Hr' | 'pm25_1Hr' | 'pm25_24Hr' | 'pm10_24Hr' | 'o3_8Hr' | 'co_8Hr' | 'so2_24Hr' | 'no2_1Hr'
  >('psi24Hr');

  const maxReading = psiReadings.reduce(
    (max, r) => (r.psi24Hr > max.psi24Hr ? r : max),
    psiReadings[0] || { psi24Hr: 42, psiBand: 'Good' }
  );

  const activeBandInfo = NEA_PSI_BANDS[maxReading?.psiBand || 'Good'];

  const getMetricValue = (r: RegionalPsiReading) => {
    switch (selectedPollutant) {
      case 'psi24Hr':
        return { val: r.psi24Hr, unit: 'PSI', maxScale: 300 };
      case 'pm25_1Hr':
        return { val: r.pm25_1Hr, unit: 'µg/m³', maxScale: 150 };
      case 'pm25_24Hr':
        return { val: r.pm25_24Hr, unit: 'µg/m³', maxScale: 150 };
      case 'pm10_24Hr':
        return { val: r.pm10_24Hr, unit: 'µg/m³', maxScale: 200 };
      case 'o3_8Hr':
        return { val: r.o3_8Hr, unit: 'µg/m³', maxScale: 100 };
      case 'co_8Hr':
        return { val: r.co_8Hr, unit: 'mg/m³', maxScale: 10 };
      case 'so2_24Hr':
        return { val: r.so2_24Hr, unit: 'µg/m³', maxScale: 50 };
      case 'no2_1Hr':
        return { val: r.no2_1Hr, unit: 'µg/m³', maxScale: 100 };
      default:
        return { val: r.psi24Hr, unit: 'PSI', maxScale: 300 };
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-md p-5 space-y-5 shadow-xl">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Pollutant Standards Index (PSI) & Air Quality</span>
            </h2>
            <span
              className="text-xs font-semibold px-2.5 py-0.5 rounded"
              style={{
                backgroundColor: activeBandInfo.bgColor,
                color: activeBandInfo.color,
                border: `1px solid ${activeBandInfo.borderColor}`,
              }}
            >
              Island Status: {maxReading.psiBand}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time pollutant breakdown across the 5 Singapore geographic sectors
          </p>
        </div>

        {/* Pollutant Tabs */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-xs overflow-x-auto">
          <button
            onClick={() => setSelectedPollutant('psi24Hr')}
            className={`px-2.5 py-1 rounded font-medium transition-colors shrink-0 ${
              selectedPollutant === 'psi24Hr'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            24-Hr PSI
          </button>
          <button
            onClick={() => setSelectedPollutant('pm25_1Hr')}
            className={`px-2.5 py-1 rounded font-medium transition-colors shrink-0 ${
              selectedPollutant === 'pm25_1Hr'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            1-Hr PM2.5
          </button>
          <button
            onClick={() => setSelectedPollutant('pm25_24Hr')}
            className={`px-2.5 py-1 rounded font-medium transition-colors shrink-0 ${
              selectedPollutant === 'pm25_24Hr'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            24-Hr PM2.5
          </button>
          <button
            onClick={() => setSelectedPollutant('pm10_24Hr')}
            className={`px-2.5 py-1 rounded font-medium transition-colors shrink-0 ${
              selectedPollutant === 'pm10_24Hr'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            PM10
          </button>
          <button
            onClick={() => setSelectedPollutant('o3_8Hr')}
            className={`px-2.5 py-1 rounded font-medium transition-colors shrink-0 ${
              selectedPollutant === 'o3_8Hr'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            O3 Ozone
          </button>
        </div>
      </div>

      {/* Regional Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {psiReadings.map((reading) => {
          const { val, unit, maxScale } = getMetricValue(reading);
          const percent = Math.min(100, Math.round((val / maxScale) * 100));
          const bandInfo = NEA_PSI_BANDS[reading.psiBand];

          return (
            <div
              key={reading.region}
              className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 flex flex-col justify-between hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="font-semibold uppercase tracking-wider text-slate-300">
                    {reading.region}
                  </span>
                  <span
                    className="font-mono text-[10px] px-1.5 py-0.5 rounded font-bold"
                    style={{
                      color: bandInfo.color,
                      backgroundColor: bandInfo.bgColor,
                    }}
                  >
                    {reading.psiBand}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 truncate mb-2">
                  {reading.label.split('(')[1]?.replace(')', '') || 'Singapore Region'}
                </div>

                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-2xl font-bold font-mono text-white">{val}</span>
                  <span className="text-xs text-slate-400 font-mono">{unit}</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: bandInfo.color,
                    }}
                  />
                </div>
              </div>

              {/* Sub-readings footer */}
              <div className="mt-3 pt-2 border-t border-slate-800/60 grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-400">
                <div>
                  <span className="text-slate-500">1h PM2.5: </span>
                  <span className="text-white font-semibold">{reading.pm25_1Hr} µg</span>
                </div>
                <div>
                  <span className="text-slate-500">24h PSI: </span>
                  <span className="text-white font-semibold">{reading.psi24Hr}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Official NEA Health Advisory Guidelines Box */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              NEA Official Health Guidance for {activeBandInfo.band} Air Quality ({activeBandInfo.range} PSI)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500">Ministry of Health / NEA Framework</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* General Public */}
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>Healthy Persons & General Public</span>
            </div>
            <p className="text-slate-400 leading-relaxed">{activeBandInfo.generalPublicAdvice}</p>
          </div>

          {/* Vulnerable Persons */}
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80">
            <div className="font-semibold text-amber-300 flex items-center gap-1.5 mb-1">
              <Baby className="w-3.5 h-3.5 text-amber-400" />
              <span>Vulnerable Persons (Elderly, Children, Pregnant, Heart/Lung Disease)</span>
            </div>
            <p className="text-slate-300 leading-relaxed">{activeBandInfo.vulnerableAdvice}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
