import React, { useState, useEffect } from 'react';
import { VisualWeatherEffect } from '../types/weather';
import {
  CloudRain,
  RefreshCw,
  Bell,
  BellOff,
  Activity,
  Sliders,
  CloudFog,
  Sun,
  Zap,
  Info,
} from 'lucide-react';

interface Props {
  lastUpdated: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  autoRefreshInterval: number;
  setAutoRefreshInterval: (sec: number) => void;
  soundAlertsEnabled: boolean;
  setSoundAlertsEnabled: (enabled: boolean) => void;
  effectMode: VisualWeatherEffect;
  setEffectMode: (mode: VisualWeatherEffect) => void;
  onOpenHealth: () => void;
  onOpenSimulate: () => void;
  onOpenThresholds: () => void;
  activeAlertCount: number;
  isSimulated: boolean;
  onResetSimulation: () => void;
}

export const Header: React.FC<Props> = ({
  lastUpdated,
  isRefreshing,
  onRefresh,
  autoRefreshInterval,
  setAutoRefreshInterval,
  soundAlertsEnabled,
  setSoundAlertsEnabled,
  effectMode,
  setEffectMode,
  onOpenHealth,
  onOpenSimulate,
  onOpenThresholds,
  activeAlertCount,
  isSimulated,
  onResetSimulation,
}) => {
  const [sgTime, setSgTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setSgTime(
        now.toLocaleTimeString('en-SG', {
          timeZone: 'Asia/Singapore',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          {/* Brand & SGT Clock */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 via-rose-700 to-slate-900 flex items-center justify-center shadow-lg border border-red-500/30">
              <CloudRain className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  <span>SG WeatherWatch</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-red-600/20 text-red-400 border border-red-600/30">
                    SGP · NEA
                  </span>
                </h1>
                {isSimulated && (
                  <button
                    onClick={onResetSimulation}
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors"
                    title="Click to reset to live Data.gov.sg data"
                  >
                    SIMULATION ACTIVE (Reset)
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                <span>SGT: {sgTime || 'Loading...'}</span>
                <span>·</span>
                <span className="text-slate-500">Updated {lastUpdated}</span>
              </div>
            </div>
          </div>

          {/* Controls & Nav */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
            {/* Visual Weather Atmosphere Effect selector */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1 rounded-lg text-xs">
              <span className="text-slate-400 px-1 text-[11px] hidden sm:inline">Screen Atmosphere:</span>
              <button
                onClick={() => setEffectMode('auto')}
                className={`px-2 py-1 rounded transition-colors ${
                  effectMode === 'auto'
                    ? 'bg-sky-600 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Auto syncs with real weather"
              >
                Auto
              </button>
              <button
                onClick={() => setEffectMode('haze')}
                className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                  effectMode === 'haze'
                    ? 'bg-amber-600 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Simulate foggy haze background"
              >
                <CloudFog className="w-3.5 h-3.5" />
                <span>Foggy / Haze</span>
              </button>
              <button
                onClick={() => setEffectMode('rain')}
                className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                  effectMode === 'rain'
                    ? 'bg-blue-600 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Simulate rain showers"
              >
                <CloudRain className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Rain</span>
              </button>
              <button
                onClick={() => setEffectMode('thunderstorm')}
                className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                  effectMode === 'thunderstorm'
                    ? 'bg-indigo-600 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Simulate storm"
              >
                <Zap className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setEffectMode('clear')}
                className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                  effectMode === 'clear'
                    ? 'bg-yellow-600 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Simulate clear sunny"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5">
              {/* API Health Monitor Button */}
              <button
                onClick={onOpenHealth}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
                title="View /api/health.js status for all 10 endpoints"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <Activity className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">API Status</span>
              </button>

              {/* NEA Thresholds Reference Guide */}
              <button
                onClick={onOpenThresholds}
                className="p-1.5 text-xs rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
                title="NEA Official Threshold Guidelines"
              >
                <Info className="w-4 h-4 text-slate-400" />
              </button>

              {/* Alert Simulator */}
              <button
                onClick={onOpenSimulate}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-900 border border-slate-800 text-amber-300 hover:bg-slate-800 hover:border-amber-500/40 transition-colors"
                title="Simulate severe rain or haze conditions"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Simulator</span>
              </button>

              {/* Sound siren toggle */}
              <button
                onClick={() => setSoundAlertsEnabled(!soundAlertsEnabled)}
                className={`p-1.5 rounded-lg border transition-colors ${
                  soundAlertsEnabled
                    ? 'bg-sky-950/60 border-sky-500/40 text-sky-400'
                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400'
                }`}
                title={soundAlertsEnabled ? 'Audio alerts enabled' : 'Audio alerts muted'}
              >
                {soundAlertsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              </button>

              {/* Auto Refresh dropdown */}
              <select
                value={autoRefreshInterval}
                onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
                className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg text-xs px-2 py-1.5 focus:outline-none focus:border-sky-500"
                title="Auto Refresh Interval"
              >
                <option value={30}>30s</option>
                <option value={60}>1m</option>
                <option value={300}>5m</option>
                <option value={0}>Manual</option>
              </select>

              {/* Manual Refresh button */}
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition-colors disabled:opacity-50"
                title="Refresh live data from Data.gov.sg"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
