import React, { useEffect, useRef } from 'react';
import { WeatherAlert } from '../types/weather';
import { AlertTriangle, AlertCircle, Info, Volume2, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  alerts: WeatherAlert[];
  soundEnabled: boolean;
}

export const AlertBanner: React.FC<Props> = ({ alerts, soundEnabled }) => {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const previousAlertCount = useRef(0);

  // Play subtle warning audio chime on new high-severity alerts using Web Audio API
  useEffect(() => {
    if (!soundEnabled || alerts.length === 0) return;

    if (alerts.length > previousAlertCount.current) {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        const hasCritical = alerts.some((a) => a.severity === 'critical');
        osc.type = hasCritical ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(hasCritical ? 587.33 : 440, audioCtx.currentTime); // D5 or A4
        osc.frequency.exponentialRampToValueAtTime(hasCritical ? 880 : 554.37, audioCtx.currentTime + 0.3);

        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.45);
      } catch (err) {
        console.warn('Audio chime unavailable:', err);
      }
    }
    previousAlertCount.current = alerts.length;
  }, [alerts, soundEnabled]);

  if (alerts.length === 0) {
    return (
      <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-300">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="font-medium">NEA Advisory Status: Normal</span>
          <span className="text-emerald-400/60 hidden sm:inline">·</span>
          <span className="text-emerald-400/80 hidden sm:inline">
            No extreme rainfall or unhealthy PSI levels detected across Singapore stations
          </span>
        </div>
        <span className="text-[11px] font-mono text-emerald-400/60">Island-wide nominal</span>
      </div>
    );
  }

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const warningCount = alerts.filter((a) => a.severity === 'warning').length;

  const topAlert = alerts[0];

  return (
    <div
      className={`rounded-xl border transition-all duration-300 overflow-hidden shadow-xl ${
        criticalCount > 0
          ? 'bg-rose-950/60 border-rose-500/50 shadow-rose-950/40'
          : warningCount > 0
          ? 'bg-amber-950/60 border-amber-500/50 shadow-amber-950/40'
          : 'bg-sky-950/60 border-sky-500/40 shadow-sky-950/30'
      }`}
    >
      {/* Alert Header Bar */}
      <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg shrink-0 ${
              criticalCount > 0
                ? 'bg-rose-500/20 text-rose-400 animate-pulse'
                : warningCount > 0
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-sky-500/20 text-sky-400'
            }`}
          >
            {criticalCount > 0 ? (
              <ShieldAlert className="w-5 h-5" />
            ) : warningCount > 0 ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-wide uppercase">
                {criticalCount > 0 ? 'CRITICAL NEA WEATHER ALERT' : 'OFFICIAL NEA WEATHER ADVISORY'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-mono font-bold bg-white/10 text-white border border-white/10">
                {alerts.length} Active {alerts.length === 1 ? 'Notice' : 'Notices'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">
              {topAlert.title} · <span className="font-semibold text-white">{topAlert.location}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {soundEnabled && (
            <span className="text-[11px] font-mono text-slate-400 hidden sm:flex items-center gap-1">
              <Volume2 className="w-3 h-3 text-sky-400" /> Audio alerts ON
            </span>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
            aria-label="Toggle alert details"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Alert Cards */}
      {isExpanded && (
        <div className="p-4 space-y-3 bg-black/20">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-700/60 space-y-2 text-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded font-bold font-mono uppercase text-[10px] ${
                      alert.severity === 'critical'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : alert.severity === 'warning'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    }`}
                  >
                    {alert.severity}
                  </span>
                  <span className="font-semibold text-slate-100 text-sm">{alert.title}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                  <span>Metric: {alert.metricValue}</span>
                  <span>·</span>
                  <span>{alert.timestamp}</span>
                </div>
              </div>

              {/* Threshold Met & Area */}
              <div className="text-slate-300 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-slate-400">Affected Location(s):</span>
                <span className="font-medium text-white">{alert.location}</span>
                <span className="text-slate-500">·</span>
                <span className="text-amber-300/90 font-mono">Trigger: {alert.thresholdMet}</span>
              </div>

              {/* Official NEA Health/Safety Guidance */}
              <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800 text-slate-200">
                <div className="font-semibold text-sky-400 flex items-center gap-1.5 mb-1">
                  <Info className="w-3.5 h-3.5" /> Official NEA Action Advisory:
                </div>
                <p className="leading-relaxed">{alert.neaGuidance}</p>
              </div>

              {/* Affected Groups */}
              {alert.affectedGroups.length > 0 && (
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="text-slate-500">Key Affected Groups:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {alert.affectedGroups.map((group) => (
                      <span
                        key={group}
                        className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/50"
                      >
                        {group}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
