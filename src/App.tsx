/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  AllWeatherData,
  fetchAllWeatherData,
  fetchApiHealth,
} from './services/dataGovApi';
import { VisualWeatherEffect, ApiHealthReport, RainfallStation } from './types/weather';
import { Header } from './components/Header';
import { AlertBanner } from './components/AlertBanner';
import { KeyMetricsOverview } from './components/KeyMetricsOverview';
import { WeatherMap } from './components/WeatherMap';
import { PsiMonitor } from './components/PsiMonitor';
import { RainfallMonitor } from './components/RainfallMonitor';
import { ForecastView } from './components/ForecastView';
import { AtmosphereSensorsView } from './components/AtmosphereSensorsView';
import { WeatherBackgroundEffects } from './components/WeatherBackgroundEffects';
import { ApiHealthModal } from './components/ApiHealthModal';
import { SimulationControlsModal } from './components/SimulationControlsModal';
import { ThresholdReferenceModal } from './components/ThresholdReferenceModal';
import {
  CloudRain,
  Shield,
  Compass,
  Map as MapIcon,
  Activity,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export default function App() {
  const [weatherData, setWeatherData] = useState<AllWeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Settings & Toggles
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(60); // 60s default
  const [soundAlertsEnabled, setSoundAlertsEnabled] = useState<boolean>(true);
  const [effectMode, setEffectMode] = useState<VisualWeatherEffect>('auto');
  const [activeTab, setActiveTab] = useState<'map' | 'rain' | 'psi' | 'forecast' | 'sensors'>('map');

  // Selected station for map focus
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  // Modals state
  const [isHealthOpen, setIsHealthOpen] = useState(false);
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);
  const [isThresholdsOpen, setIsThresholdsOpen] = useState(false);

  // API Health report state
  const [healthReport, setHealthReport] = useState<ApiHealthReport | null>(null);
  const [isHealthLoading, setIsHealthLoading] = useState(false);

  // Simulation overrides state
  const [simConfig, setSimConfig] = useState<{
    overridePsi?: number;
    overrideRainMm?: number;
    overrideForecast?: string;
  } | null>(null);

  // Fetch weather data
  const loadWeatherData = useCallback(
    async (isManual = false) => {
      if (isManual) setIsRefreshing(true);
      setError(null);

      try {
        const data = await fetchAllWeatherData(simConfig || undefined);
        setWeatherData(data);
      } catch (err: any) {
        console.error('Weather load error:', err);
        setError(err.message || 'Failed to fetch weather data from Data.gov.sg');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [simConfig]
  );

  // Load API Health report
  const loadHealthReport = useCallback(async () => {
    setIsHealthLoading(true);
    try {
      const report = await fetchApiHealth();
      setHealthReport(report);
    } catch (err) {
      console.error('Health check error:', err);
    } finally {
      setIsHealthLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadWeatherData();
    loadHealthReport();
  }, [loadWeatherData, loadHealthReport]);

  // Auto-refresh interval
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const interval = setInterval(() => {
      loadWeatherData();
    }, autoRefreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefreshInterval, loadWeatherData]);

  const handleStationSelect = (station: RainfallStation) => {
    setSelectedStationId(station.id);
    setActiveTab('map');
  };

  const handleApplySimulation = (config: any) => {
    setSimConfig(config);
    // If simulating haze, also set effect mode to haze for immediate visual confirmation
    if (config?.overridePsi && config.overridePsi > 100) {
      setEffectMode('haze');
    } else if (config?.overrideRainMm && config.overrideRainMm > 10) {
      setEffectMode('rain');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative selection:bg-sky-500 selection:text-white">
      {/* Dynamic Background Visual Weather Effects (Foggy Haze, Rain, Storms) */}
      <WeatherBackgroundEffects
        effectMode={effectMode}
        isHazy={Boolean(weatherData?.summary.isHazy)}
        isRaining={Boolean(weatherData?.summary.isRaining)}
        isStormy={Boolean(weatherData?.summary.isStormy)}
        psiLevel={weatherData?.summary.maxPsi}
      />

      {/* Main App Container */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navigation & Operational Header */}
        <Header
          lastUpdated={weatherData?.summary.lastUpdated || 'Syncing...'}
          isRefreshing={isRefreshing}
          onRefresh={() => loadWeatherData(true)}
          autoRefreshInterval={autoRefreshInterval}
          setAutoRefreshInterval={setAutoRefreshInterval}
          soundAlertsEnabled={soundAlertsEnabled}
          setSoundAlertsEnabled={setSoundAlertsEnabled}
          effectMode={effectMode}
          setEffectMode={setEffectMode}
          onOpenHealth={() => {
            loadHealthReport();
            setIsHealthOpen(true);
          }}
          onOpenSimulate={() => setIsSimulateOpen(true)}
          onOpenThresholds={() => setIsThresholdsOpen(true)}
          activeAlertCount={weatherData?.alerts.length || 0}
          isSimulated={Boolean(simConfig)}
          onResetSimulation={() => {
            setSimConfig(null);
            setEffectMode('auto');
          }}
        />

        {/* Content Container */}
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-5 w-full">
          {/* Error Message if any */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-300 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => loadWeatherData(true)}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded font-medium"
              >
                Retry
              </button>
            </div>
          )}

          {/* Automated NEA Threshold Alerts Banner */}
          {weatherData && (
            <AlertBanner
              alerts={weatherData.alerts}
              soundEnabled={soundAlertsEnabled}
            />
          )}

          {/* High-Impact Telemetry Overview Cards */}
          {weatherData && (
            <KeyMetricsOverview
              summary={weatherData.summary}
              onSelectMetric={(tab) => setActiveTab(tab)}
            />
          )}

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'map'
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-950/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <MapIcon className="w-4 h-4" />
              <span>Singapore Interactive Map</span>
            </button>

            <button
              onClick={() => setActiveTab('rain')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'rain'
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-950/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <CloudRain className="w-4 h-4" />
              <span>Rainfall Stations ({weatherData?.rainfallStations.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('psi')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'psi'
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-950/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>PSI & Air Quality</span>
            </button>

            <button
              onClick={() => setActiveTab('forecast')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'forecast'
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-950/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Town Forecasts & Outlook</span>
            </button>

            <button
              onClick={() => setActiveTab('sensors')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'sensors'
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-950/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <Activity className="w-4 h-4 text-teal-400" />
              <span>All 10 Feeds & Sensors (UV, Wind, Temp, RH)</span>
            </button>
          </div>

          {/* Tab Views */}
          {isLoading && !weatherData ? (
            <div className="h-96 rounded-2xl border border-slate-800 bg-slate-900/40 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
              <p className="text-xs text-slate-400 font-mono">
                Connecting to official Data.gov.sg v2 Meteorological APIs...
              </p>
            </div>
          ) : weatherData ? (
            <div className="space-y-6">
              {activeTab === 'map' && (
                <WeatherMap
                  rainfallStations={weatherData.rainfallStations}
                  psiReadings={weatherData.psiReadings}
                  townForecasts={weatherData.townForecasts}
                  temperatureStations={weatherData.temperatureStations}
                  selectedStationId={selectedStationId}
                  onSelectStation={handleStationSelect}
                />
              )}

              {activeTab === 'rain' && (
                <RainfallMonitor
                  stations={weatherData.rainfallStations}
                  selectedStationId={selectedStationId}
                  onSelectStation={handleStationSelect}
                />
              )}

              {activeTab === 'psi' && <PsiMonitor psiReadings={weatherData.psiReadings} />}

              {activeTab === 'forecast' && (
                <ForecastView
                  townForecasts={weatherData.townForecasts}
                  forecast24Hr={weatherData.forecast24Hr}
                  outlook4Day={weatherData.outlook4Day}
                />
              )}

              {activeTab === 'sensors' && (
                <AtmosphereSensorsView
                  uvIndex={weatherData.uvIndex}
                  windSpeedStations={weatherData.windSpeedStations}
                  temperatureStations={weatherData.temperatureStations}
                  humidityStations={weatherData.humidityStations}
                  rainfallCount={weatherData.rainfallStations.length}
                  psiCount={weatherData.psiReadings.length}
                  townForecastsCount={weatherData.townForecasts.length}
                  outlookCount={weatherData.outlook4Day.length}
                />
              )}
            </div>
          ) : null}
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t border-slate-900 bg-slate-950/90 py-5 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Real-time data sourced directly from official Singapore Open Data APIs (Data.gov.sg & NEA).</span>
            </div>

            <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
              <button
                onClick={() => setIsHealthOpen(true)}
                className="hover:text-white flex items-center gap-1 transition-colors"
              >
                <Activity className="w-3.5 h-3.5 text-sky-400" />
                <span>API Health Telemetry</span>
              </button>
              <span>·</span>
              <button
                onClick={() => setIsThresholdsOpen(true)}
                className="hover:text-white transition-colors"
              >
                NEA Thresholds Guide
              </button>
              <span>·</span>
              <a
                href="https://data.gov.sg"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>Data.gov.sg</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </footer>
      </div>

      {/* Modals */}
      <ApiHealthModal
        isOpen={isHealthOpen}
        onClose={() => setIsHealthOpen(false)}
        healthReport={healthReport}
        isLoading={isHealthLoading}
        onRefreshHealth={loadHealthReport}
      />

      <SimulationControlsModal
        isOpen={isSimulateOpen}
        onClose={() => setIsSimulateOpen(false)}
        onApplySimulation={handleApplySimulation}
        currentSimConfig={simConfig}
      />

      <ThresholdReferenceModal
        isOpen={isThresholdsOpen}
        onClose={() => setIsThresholdsOpen(false)}
      />
    </div>
  );
}
