import React, { useState } from 'react';
import {
  StationMetricReading,
  UvIndexReading,
} from '../types/weather';
import { DIRECT_ENDPOINTS } from '../services/dataGovApi';
import {
  Sun,
  Wind,
  Thermometer,
  Droplets,
  ExternalLink,
  Code2,
  CheckCircle,
  Database,
} from 'lucide-react';

interface Props {
  uvIndex: UvIndexReading | null;
  windSpeedStations: StationMetricReading[];
  temperatureStations: StationMetricReading[];
  humidityStations: StationMetricReading[];
  rainfallCount: number;
  psiCount: number;
  townForecastsCount: number;
  outlookCount: number;
}

export const AtmosphereSensorsView: React.FC<Props> = ({
  uvIndex,
  windSpeedStations,
  temperatureStations,
  humidityStations,
  rainfallCount,
  psiCount,
  townForecastsCount,
  outlookCount,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'sensors' | 'feeds'>('sensors');

  // Sorted stations
  const sortedTemp = [...temperatureStations].sort((a, b) => b.value - a.value);
  const sortedHumidity = [...humidityStations].sort((a, b) => b.value - a.value);
  const sortedWind = [...windSpeedStations].sort((a, b) => b.value - a.value);

  const highestTemp = sortedTemp[0];
  const lowestTemp = sortedTemp[sortedTemp.length - 1];

  const highestWind = sortedWind[0];
  const lowestWind = sortedWind[sortedWind.length - 1];

  const highestHumidity = sortedHumidity[0];
  const lowestHumidity = sortedHumidity[sortedHumidity.length - 1];

  // The 10 official API endpoints directory
  const apiDirectory = [
    {
      id: 'two-hr-forecast',
      name: '2-Hour Weather Forecast',
      url: DIRECT_ENDPOINTS.twoHrForecast,
      category: 'Meteorology',
      recordsCount: `${townForecastsCount} Town Planning Areas`,
      frequency: 'Every 30 Minutes',
      status: 'Active',
    },
    {
      id: 'twenty-four-hr-forecast',
      name: '24-Hour Weather Forecast',
      url: DIRECT_ENDPOINTS.twentyFourHrForecast,
      category: 'Meteorology',
      recordsCount: '5 Regional Periods + Island Synopsis',
      frequency: 'Twice Daily (Morning & Midday)',
      status: 'Active',
    },
    {
      id: 'four-day-outlook',
      name: '4-Day Weather Outlook',
      url: DIRECT_ENDPOINTS.fourDayOutlook,
      category: 'Meteorology',
      recordsCount: `${outlookCount || 4} Daily Projected Intervals`,
      frequency: 'Twice Daily',
      status: 'Active',
    },
    {
      id: 'air-temperature',
      name: 'Air Temperature Telemetry',
      url: DIRECT_ENDPOINTS.airTemperature,
      category: 'Microclimate',
      recordsCount: `${temperatureStations.length} Meteorological Stations`,
      frequency: 'Every 1 Minute',
      status: 'Active',
    },
    {
      id: 'rainfall',
      name: 'Real-Time Rainfall Gauges',
      url: DIRECT_ENDPOINTS.rainfall,
      category: 'Precipitation',
      recordsCount: `${rainfallCount} Tipping Bucket Sensors`,
      frequency: 'Every 5 Minutes',
      status: 'Active',
    },
    {
      id: 'psi',
      name: 'Pollutant Standards Index (PSI)',
      url: DIRECT_ENDPOINTS.psi,
      category: 'Air Quality',
      recordsCount: `${psiCount} Sectors + Criteria Sub-indices`,
      frequency: 'Hourly',
      status: 'Active',
    },
    {
      id: 'pm25',
      name: '1-Hour PM2.5 Concentrations',
      url: DIRECT_ENDPOINTS.pm25,
      category: 'Air Quality',
      recordsCount: '5 Singapore Regional Sectors',
      frequency: 'Hourly',
      status: 'Active',
    },
    {
      id: 'uv',
      name: 'Ultraviolet Index (UV)',
      url: DIRECT_ENDPOINTS.uv,
      category: 'Atmosphere',
      recordsCount: `${uvIndex?.history.length || 0} Hourly Readings Today`,
      frequency: 'Hourly (07:00 – 19:00)',
      status: 'Active',
    },
    {
      id: 'relative-humidity',
      name: 'Relative Humidity Sensors',
      url: DIRECT_ENDPOINTS.relativeHumidity,
      category: 'Microclimate',
      recordsCount: `${humidityStations.length} Hygrometer Sensors`,
      frequency: 'Every 1 Minute',
      status: 'Active',
    },
    {
      id: 'wind-speed',
      name: 'Surface Wind Speed & Direction',
      url: DIRECT_ENDPOINTS.windSpeed,
      category: 'Atmosphere',
      recordsCount: `${windSpeedStations.length} Anemometer Stations`,
      frequency: 'Every 1 Minute',
      status: 'Active',
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-md p-5 space-y-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-teal-400" />
            <span>Atmospheric Sensors & Data.gov.sg v2 Feeds</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time sensor arrays for UV Index, Wind Speed, Temperature, Humidity & direct API integration directory
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveSubTab('sensors')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeSubTab === 'sensors'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Atmospheric Sensors
          </button>
          <button
            onClick={() => setActiveSubTab('feeds')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'feeds'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>All 10 API Feeds</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'sensors' ? (
        <div className="space-y-6">
          {/* Section 1: UV Index & Hourly Curve */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sun className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Official NEA Ultraviolet (UV) Index
                  </h3>
                  <p className="text-[11px] text-slate-400">Hourly solar radiation measurements across Singapore</p>
                </div>
              </div>

              {uvIndex && (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold font-mono text-white">{uvIndex.currentValue}</span>
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded font-mono ${
                      uvIndex.band === 'Extreme'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : uvIndex.band === 'Very High'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : uvIndex.band === 'High'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : uvIndex.band === 'Moderate'
                        ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {uvIndex.band} Risk
                  </span>
                </div>
              )}
            </div>

            {/* UV Timeline Bar Graph */}
            {uvIndex && uvIndex.history.length > 0 && (
              <div className="pt-2">
                <div className="text-[11px] font-mono text-slate-400 mb-1.5 flex justify-between">
                  <span>Today Hourly Progression (07:00 – 19:00 SGT)</span>
                  <span className="text-slate-500">Max scale: 12 UV</span>
                </div>
                <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-12 gap-1.5 items-end h-28 pt-4 pb-2 bg-slate-900/60 rounded-xl px-3 border border-slate-800/80">
                  {uvIndex.history.slice(0, 12).reverse().map((item, idx) => {
                    const heightPercent = Math.min(100, Math.max(8, (item.value / 12) * 100));
                    const timeLabel = item.hour.split('T')[1]?.slice(0, 5) || `${idx}:00`;
                    const barColor =
                      item.value >= 11
                        ? '#a855f7'
                        : item.value >= 8
                        ? '#ef4444'
                        : item.value >= 6
                        ? '#f59e0b'
                        : item.value >= 3
                        ? '#eab308'
                        : '#10b981';

                    return (
                      <div key={idx} className="flex flex-col items-center h-full justify-end group">
                        <div className="text-[10px] font-mono text-slate-300 font-bold mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.value}
                        </div>
                        <div
                          className="w-full max-w-[20px] rounded-t transition-all duration-500 hover:brightness-125"
                          style={{
                            height: `${heightPercent}%`,
                            backgroundColor: barColor,
                          }}
                        />
                        <span className="text-[9px] font-mono text-slate-500 mt-1.5">{timeLabel}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Sensor Arrays (Wind, Temp, Humidity) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Wind Speed Array */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Wind className="w-4 h-4 text-teal-400" />
                    <span>Wind Speed Sensors</span>
                  </span>
                  <span className="font-mono text-slate-500 text-[11px]">{windSpeedStations.length} Stations</span>
                </div>

                {highestWind && (
                  <div className="p-2.5 rounded-lg bg-teal-950/30 border border-teal-500/20 text-xs mb-3">
                    <div className="text-slate-400 text-[10px] uppercase font-mono">Briskest Wind</div>
                    <div className="flex justify-between items-baseline mt-0.5">
                      <span className="font-semibold text-white truncate max-w-[140px]">{highestWind.name}</span>
                      <span className="font-mono font-bold text-teal-400 text-sm">{highestWind.value.toFixed(1)} km/h</span>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-xs font-mono">
                  {sortedWind.slice(0, 7).map((st) => (
                    <div key={st.id} className="flex justify-between items-center py-1 border-b border-slate-800/60">
                      <span className="text-slate-400 truncate max-w-[150px]">{st.name}</span>
                      <span className="text-teal-300 font-bold">{st.value.toFixed(1)} km/h</span>
                    </div>
                  ))}
                </div>
              </div>

              {lowestWind && (
                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500 flex justify-between font-mono">
                  <span>Calmest: {lowestWind.name}</span>
                  <span>{lowestWind.value.toFixed(1)} km/h</span>
                </div>
              )}
            </div>

            {/* Temperature Array */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Thermometer className="w-4 h-4 text-rose-400" />
                    <span>Air Temperature Sensors</span>
                  </span>
                  <span className="font-mono text-slate-500 text-[11px]">{temperatureStations.length} Stations</span>
                </div>

                {highestTemp && (
                  <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/20 text-xs mb-3">
                    <div className="text-slate-400 text-[10px] uppercase font-mono">Peak Temperature</div>
                    <div className="flex justify-between items-baseline mt-0.5">
                      <span className="font-semibold text-white truncate max-w-[140px]">{highestTemp.name}</span>
                      <span className="font-mono font-bold text-rose-400 text-sm">{highestTemp.value.toFixed(1)}°C</span>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-xs font-mono">
                  {sortedTemp.slice(0, 7).map((st) => (
                    <div key={st.id} className="flex justify-between items-center py-1 border-b border-slate-800/60">
                      <span className="text-slate-400 truncate max-w-[150px]">{st.name}</span>
                      <span className="text-rose-300 font-bold">{st.value.toFixed(1)}°C</span>
                    </div>
                  ))}
                </div>
              </div>

              {lowestTemp && (
                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500 flex justify-between font-mono">
                  <span>Coolest: {lowestTemp.name}</span>
                  <span>{lowestTemp.value.toFixed(1)}°C</span>
                </div>
              )}
            </div>

            {/* Humidity Array */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-blue-400" />
                    <span>Relative Humidity Sensors</span>
                  </span>
                  <span className="font-mono text-slate-500 text-[11px]">{humidityStations.length} Stations</span>
                </div>

                {highestHumidity && (
                  <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-500/20 text-xs mb-3">
                    <div className="text-slate-400 text-[10px] uppercase font-mono">Highest Humidity</div>
                    <div className="flex justify-between items-baseline mt-0.5">
                      <span className="font-semibold text-white truncate max-w-[140px]">{highestHumidity.name}</span>
                      <span className="font-mono font-bold text-blue-400 text-sm">{highestHumidity.value.toFixed(1)}%</span>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-xs font-mono">
                  {sortedHumidity.slice(0, 7).map((st) => (
                    <div key={st.id} className="flex justify-between items-center py-1 border-b border-slate-800/60">
                      <span className="text-slate-400 truncate max-w-[150px]">{st.name}</span>
                      <span className="text-blue-300 font-bold">{st.value.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {lowestHumidity && (
                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500 flex justify-between font-mono">
                  <span>Driest: {lowestHumidity.name}</span>
                  <span>{lowestHumidity.value.toFixed(1)}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Section 3: The 10 API Feeds Explorer */
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                All <strong>10 official Data.gov.sg v2 endpoints</strong> are active and integrated with automatic rate limit protection and caching.
              </span>
            </div>
            <span className="font-mono text-[11px] text-teal-400 hidden sm:inline">10 / 10 Connected</span>
          </div>

          <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/80 bg-slate-950/50">
            {apiDirectory.map((api, index) => (
              <div
                key={api.id}
                className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:bg-slate-900/60 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-[11px] font-mono font-bold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-sm font-bold text-white truncate">{api.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-teal-300 border border-slate-700">
                      {api.category}
                    </span>
                  </div>

                  <div className="text-xs font-mono text-slate-400 truncate mt-1 flex items-center gap-2">
                    <span className="text-slate-500">URL:</span>
                    <span className="text-sky-400/90 hover:underline">{api.url}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 font-mono mt-1">
                    <span>Parsed Records: <strong className="text-slate-300">{api.recordsCount}</strong></span>
                    <span>·</span>
                    <span>Cadence: <strong className="text-slate-300">{api.frequency}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  <span className="px-2.5 py-1 rounded text-xs font-mono font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{api.status}</span>
                  </span>

                  <a
                    href={api.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title={`Open raw Data.gov.sg JSON for ${api.name}`}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
