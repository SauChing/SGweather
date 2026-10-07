import React, { useState } from 'react';
import { ApiHealthReport } from '../types/weather';
import { Activity, CheckCircle2, AlertTriangle, XCircle, RefreshCw, ExternalLink, X, ShieldCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  healthReport: ApiHealthReport | null;
  isLoading: boolean;
  onRefreshHealth: () => void;
}

export const ApiHealthModal: React.FC<Props> = ({
  isOpen,
  onClose,
  healthReport,
  isLoading,
  onRefreshHealth,
}) => {
  const [viewJson, setViewJson] = useState(false);

  if (!isOpen) return null;

  const isHealthy = healthReport?.status === 'operational';
  const isDegraded = healthReport?.status === 'degraded_performance';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-100">Official Data.gov.sg v2 API Health</h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  /api/health.js
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time telemetry and uptime for all 10 Singapore Meteorological endpoints
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Summary Status Banner */}
          <div
            className={`p-4 rounded-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              isHealthy
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                : isDegraded
                ? 'bg-amber-950/30 border-amber-500/30 text-amber-300'
                : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-3">
              {isHealthy ? (
                <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
              ) : isDegraded ? (
                <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
              ) : (
                <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
              )}
              <div>
                <div className="font-semibold text-sm">
                  {isHealthy ? 'All Systems Operational' : isDegraded ? 'Degraded Performance' : 'Upstream Service Outage'}
                </div>
                <div className="text-xs opacity-80 mt-0.5">
                  {healthReport?.summary.healthy} of {healthReport?.summary.total} endpoints healthy · Avg latency{' '}
                  {healthReport?.summary.avgLatencyMs}ms
                  {healthReport?.cached ? ` (cached ${healthReport.cacheAgeSeconds}s ago)` : ' (fresh check)'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewJson(!viewJson)}
                className="px-2.5 py-1.5 text-xs font-mono text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
              >
                {viewJson ? 'View Table' : 'Raw JSON'}
              </button>
              <button
                onClick={onRefreshHealth}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-100 bg-sky-600 hover:bg-sky-500 rounded disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Re-check</span>
              </button>
            </div>
          </div>

          {viewJson ? (
            <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto max-h-96">
              {JSON.stringify(healthReport, null, 2)}
            </pre>
          ) : (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
                Monitored Data.gov.sg v2 Endpoints ({healthReport?.endpoints.length || 0})
              </div>

              <div className="border border-slate-800 rounded-lg overflow-hidden divide-y divide-slate-800/80 bg-slate-950/50">
                {healthReport?.endpoints.map((ep) => {
                  const epUp = ep.status === 'UP';
                  const epRate = ep.status === 'RATE_LIMITED';

                  return (
                    <div
                      key={ep.id}
                      className="px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 hover:bg-slate-900/60 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              epUp ? 'bg-emerald-400' : epRate ? 'bg-amber-400 animate-pulse' : 'bg-rose-400'
                            }`}
                          />
                          <span className="text-sm font-medium text-slate-200 truncate">{ep.name}</span>
                        </div>
                        <div className="text-xs font-mono text-slate-500 truncate mt-0.5">{ep.url}</div>
                        {ep.error && <div className="text-xs text-rose-400 font-mono mt-1">{ep.error}</div>}
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono shrink-0 self-end sm:self-center">
                        <div className="text-right">
                          <span className="text-slate-400">Latency: </span>
                          <span
                            className={
                              ep.latencyMs < 300
                                ? 'text-emerald-400'
                                : ep.latencyMs < 800
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }
                          >
                            {ep.latencyMs}ms
                          </span>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            epUp
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                              : epRate
                              ? 'bg-amber-950/80 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-950/80 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {ep.status} ({ep.httpStatus || 'ERR'})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Direct Endpoint link info */}
          <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Direct JSON health feed is exposed at:</span>
            <a
              href="/api/health.js"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 font-mono text-sky-400 hover:underline"
            >
              <span>/api/health.js</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Official NEA & Singapore Open Data Service Integration</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
