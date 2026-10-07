import React, { useState } from 'react';
import { RainfallStation, RegionName } from '../types/weather';
import { getRainfallColor } from '../utils/thresholds';
import { CloudRain, Search, Droplets, Filter, MapPin } from 'lucide-react';

interface Props {
  stations: RainfallStation[];
  onSelectStation?: (station: RainfallStation) => void;
  selectedStationId?: string | null;
}

export const RainfallMonitor: React.FC<Props> = ({
  stations,
  onSelectStation,
  selectedStationId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState<RegionName | 'all'>('all');
  const [rainingOnly, setRainingOnly] = useState(false);

  // Intensity counts
  const torrentialCount = stations.filter((s) => s.value > 50).length;
  const heavyCount = stations.filter((s) => s.value > 10 && s.value <= 50).length;
  const moderateCount = stations.filter((s) => s.value > 2.5 && s.value <= 10).length;
  const lightCount = stations.filter((s) => s.value > 0.1 && s.value <= 2.5).length;
  const dryCount = stations.filter((s) => s.value <= 0.1).length;

  const filteredStations = stations
    .filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRegion = regionFilter === 'all' || s.region === regionFilter;
      const matchRain = !rainingOnly || s.value > 0.1;
      return matchSearch && matchRegion && matchRain;
    })
    .sort((a, b) => b.value - a.value);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-md p-5 space-y-5 shadow-xl">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CloudRain className="w-5 h-5 text-sky-400" />
              <span>Real-Time Singapore Rainfall Network</span>
            </h2>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-700">
              {stations.length} Active Sensors
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            5-Minute accumulated rainfall telemetry from NEA tipping bucket rain gauges
          </p>
        </div>

        {/* Rain Breakdown Badges */}
        <div className="flex items-center gap-2 text-xs font-mono flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span className="text-slate-400">Dry: {dryCount}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span className="text-sky-300">Light: {lightCount}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-blue-300">Mod: {moderateCount}</span>
          </div>
          {heavyCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-950/50 border border-amber-500/40 text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Heavy: {heavyCount}</span>
            </div>
          )}
          {torrentialCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-950/50 border border-rose-500/40 text-rose-300 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Torrential: {torrentialCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Filter by station name or ID (e.g. Changi, Woodlands, S109)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 text-white text-xs pl-8 pr-3 py-2 rounded-xl focus:outline-none focus:border-sky-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>

        <div className="flex items-center gap-2">
          {/* Region Filter */}
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value as any)}
            className="bg-slate-950/80 border border-slate-800 text-slate-300 text-xs px-2.5 py-2 rounded-xl focus:outline-none focus:border-sky-500"
          >
            <option value="all">All Sectors</option>
            <option value="north">North Sector</option>
            <option value="south">South Sector</option>
            <option value="east">East Sector</option>
            <option value="west">West Sector</option>
            <option value="central">Central Sector</option>
          </select>

          {/* Raining Only Checkbox */}
          <button
            onClick={() => setRainingOnly(!rainingOnly)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors shrink-0 ${
              rainingOnly
                ? 'bg-sky-600 border-sky-500 text-white'
                : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>Raining Only</span>
          </button>
        </div>
      </div>

      {/* Stations Grid / Leaderboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
        {filteredStations.map((station) => {
          const isSelected = selectedStationId === station.id;
          const isRaining = station.value > 0.1;
          const color = getRainfallColor(station.value);

          return (
            <div
              key={station.id}
              onClick={() => onSelectStation?.(station)}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                isSelected
                  ? 'bg-sky-950/50 border-sky-500 shadow-lg shadow-sky-950/30'
                  : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/80 hover:border-slate-700'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      station.value > 50
                        ? 'bg-rose-500 animate-ping'
                        : station.value > 10
                        ? 'bg-amber-400'
                        : isRaining
                        ? 'bg-sky-400'
                        : 'bg-slate-600'
                    }`}
                  />
                  <h4 className="text-xs font-semibold text-slate-200 truncate">{station.name}</h4>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 mt-0.5">
                  <span>ID: {station.id}</span>
                  <span>·</span>
                  <span className="uppercase">{station.region}</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-base font-bold font-mono" style={{ color }}>
                  {station.value.toFixed(1)}{' '}
                  <span className="text-[10px] font-normal text-slate-400">mm</span>
                </div>
                <span
                  className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded"
                  style={{
                    backgroundColor: `${color}20`,
                    color,
                  }}
                >
                  {station.intensity}
                </span>
              </div>
            </div>
          );
        })}

        {filteredStations.length === 0 && (
          <div className="col-span-full p-8 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
            No rainfall stations matched the current filters.
          </div>
        )}
      </div>
    </div>
  );
};
