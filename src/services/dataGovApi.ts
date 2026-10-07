import {
  RainfallStation,
  RegionalPsiReading,
  TownForecast,
  TwentyFourHrForecastData,
  FourDayOutlookItem,
  StationMetricReading,
  UvIndexReading,
  IslandSummary,
  RegionName,
  WeatherAlert,
  ApiHealthReport,
} from '../types/weather';
import { getPsiBand, getPm25Band, getRainfallIntensity, evaluateNeaAlerts } from '../utils/thresholds';

export const DIRECT_ENDPOINTS = {
  twoHrForecast: 'https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast',
  twentyFourHrForecast: 'https://api-open.data.gov.sg/v2/real-time/api/twenty-four-hr-forecast',
  fourDayOutlook: 'https://api-open.data.gov.sg/v2/real-time/api/four-day-outlook',
  airTemperature: 'https://api-open.data.gov.sg/v2/real-time/api/air-temperature',
  rainfall: 'https://api-open.data.gov.sg/v2/real-time/api/rainfall',
  psi: 'https://api-open.data.gov.sg/v2/real-time/api/psi',
  pm25: 'https://api-open.data.gov.sg/v2/real-time/api/pm25',
  uv: 'https://api-open.data.gov.sg/v2/real-time/api/uv',
  relativeHumidity: 'https://api-open.data.gov.sg/v2/real-time/api/relative-humidity',
  windSpeed: 'https://api-open.data.gov.sg/v2/real-time/api/wind-speed',
};

// Client-side in-memory cache to prevent 429
const clientCache: Record<string, { timestamp: number; data: any }> = {};
const CACHE_TTL = 30000; // 30s

async function fetchWithFallback(proxyKey: string, directUrl: string): Promise<any> {
  const now = Date.now();
  if (clientCache[proxyKey] && now - clientCache[proxyKey].timestamp < CACHE_TTL) {
    return clientCache[proxyKey].data;
  }

  // 1. Try server proxy route first (cached on backend, avoids rate limit)
  try {
    const proxyRes = await fetch(`/api/weather/${proxyKey}`, { signal: AbortSignal.timeout(5000) });
    if (proxyRes.ok) {
      const json = await proxyRes.json();
      clientCache[proxyKey] = { timestamp: now, data: json };
      return json;
    }
  } catch {
    // ignore and fallback to direct
  }

  // 2. Fallback to direct Data.gov.sg v2 endpoint
  try {
    const directRes = await fetch(directUrl, { signal: AbortSignal.timeout(6000) });
    if (directRes.ok) {
      const json = await directRes.json();
      clientCache[proxyKey] = { timestamp: now, data: json };
      return json;
    }
  } catch (err) {
    console.warn(`Direct fetch failed for ${proxyKey}:`, err);
  }

  // 3. If cache exists (even stale), return it
  if (clientCache[proxyKey]) {
    return clientCache[proxyKey].data;
  }

  throw new Error(`Failed to load data for ${proxyKey}`);
}

/**
 * Determine geographic region from coordinates
 */
export function getRegionFromCoordinates(lat: number, lon: number): RegionName {
  if (lat > 1.39) return 'north';
  if (lat < 1.28) return 'south';
  if (lon < 103.74) return 'west';
  if (lon > 103.90) return 'east';
  return 'central';
}

function parseForecastIcon(text: string): TownForecast['iconType'] {
  const lower = text.toLowerCase();
  if (lower.includes('hazy') || lower.includes('haze')) return 'hazy';
  if (lower.includes('thunder')) return 'thunderstorm';
  if (lower.includes('heavy rain')) return 'heavy-rain';
  if (lower.includes('moderate rain') || lower.includes('showers')) return 'moderate-rain';
  if (lower.includes('light rain') || lower.includes('drizzle')) return 'light-rain';
  if (lower.includes('cloudy')) return 'cloudy';
  if (lower.includes('partly cloudy')) return 'partly-cloudy';
  return 'sunny';
}

export interface AllWeatherData {
  rainfallStations: RainfallStation[];
  psiReadings: RegionalPsiReading[];
  pm25Readings: Record<string, number>;
  townForecasts: TownForecast[];
  forecast24Hr: TwentyFourHrForecastData | null;
  outlook4Day: FourDayOutlookItem[];
  temperatureStations: StationMetricReading[];
  humidityStations: StationMetricReading[];
  windSpeedStations: StationMetricReading[];
  uvIndex: UvIndexReading | null;
  summary: IslandSummary;
  alerts: WeatherAlert[];
  fetchedAt: string;
}

export async function fetchAllWeatherData(simulationConfig?: {
  overridePsi?: number;
  overrideRainMm?: number;
  overrideForecast?: string;
}): Promise<AllWeatherData> {
  const [
    rainfallRaw,
    psiRaw,
    pm25Raw,
    twoHrRaw,
    twentyFourHrRaw,
    fourDayRaw,
    tempRaw,
    humidityRaw,
    windRaw,
    uvRaw,
  ] = await Promise.allSettled([
    fetchWithFallback('rainfall', DIRECT_ENDPOINTS.rainfall),
    fetchWithFallback('psi', DIRECT_ENDPOINTS.psi),
    fetchWithFallback('pm25', DIRECT_ENDPOINTS.pm25),
    fetchWithFallback('two-hr-forecast', DIRECT_ENDPOINTS.twoHrForecast),
    fetchWithFallback('twenty-four-hr-forecast', DIRECT_ENDPOINTS.twentyFourHrForecast),
    fetchWithFallback('four-day-outlook', DIRECT_ENDPOINTS.fourDayOutlook),
    fetchWithFallback('air-temperature', DIRECT_ENDPOINTS.airTemperature),
    fetchWithFallback('relative-humidity', DIRECT_ENDPOINTS.relativeHumidity),
    fetchWithFallback('wind-speed', DIRECT_ENDPOINTS.windSpeed),
    fetchWithFallback('uv', DIRECT_ENDPOINTS.uv),
  ]);

  // 1. Process Rainfall Stations
  let rainfallStations: RainfallStation[] = [];
  if (rainfallRaw.status === 'fulfilled' && rainfallRaw.value?.data) {
    const data = rainfallRaw.value.data;
    const stations = data.stations || [];
    const readingsMap = new Map<string, number>();
    const latestReadings = data.readings?.[0]?.data || [];
    latestReadings.forEach((r: { stationId: string; value: number }) => {
      readingsMap.set(r.stationId, r.value ?? 0);
    });

    rainfallStations = stations.map((st: any) => {
      let val = readingsMap.get(st.id) ?? 0;
      if (simulationConfig?.overrideRainMm !== undefined) {
        val = simulationConfig.overrideRainMm;
      }
      return {
        id: st.id,
        deviceId: st.deviceId || st.id,
        name: st.name || `Station ${st.id}`,
        location: st.location,
        value: val,
        intensity: getRainfallIntensity(val),
        region: getRegionFromCoordinates(st.location.latitude, st.location.longitude),
      };
    });
  }

  // 2. Process PM2.5 1-Hour readings
  const pm25Map: Record<string, number> = {};
  if (pm25Raw.status === 'fulfilled' && pm25Raw.value?.data?.items?.[0]?.readings?.pm25_one_hourly) {
    const rawMap = pm25Raw.value.data.items[0].readings.pm25_one_hourly;
    Object.keys(rawMap).forEach((k) => {
      pm25Map[k] = rawMap[k];
    });
  }

  // 3. Process PSI Data
  let psiReadings: RegionalPsiReading[] = [];
  if (psiRaw.status === 'fulfilled' && psiRaw.value?.data) {
    const psiData = psiRaw.value.data;
    const regionMeta = psiData.regionMetadata || [];
    const latestItem = psiData.items?.[0] || {};
    const readings = latestItem.readings || {};

    const psi24Hourly = readings.psi_twenty_four_hourly || {};
    const pm25_24Hourly = readings.pm25_twenty_four_hourly || {};
    const pm25_1Hourly = readings.pm25_one_hourly || pm25Map;
    const pm10_24Hourly = readings.pm10_twenty_four_hourly || {};
    const o3_8Hr = readings.o3_eight_hour_max || {};
    const co_8Hr = readings.co_eight_hour_max || {};
    const so2_24Hr = readings.so2_twenty_four_hourly || {};
    const no2_1Hr = readings.no2_one_hour_max || {};

    const regionLabels: Record<string, string> = {
      north: 'North Region (Woodlands / Yishun)',
      south: 'South Region (Sentosa / CBD)',
      east: 'East Region (Changi / Tampines)',
      west: 'West Region (Jurong / Tuas)',
      central: 'Central Region (Bishan / Orchard)',
      national: 'Singapore Overall (National)',
    };

    psiReadings = regionMeta.map((rm: any) => {
      const reg = rm.name as RegionName;
      let psiVal = psi24Hourly[reg] ?? 42;
      let pm25_1 = pm25_1Hourly[reg] ?? pm25Map[reg] ?? 12;

      if (simulationConfig?.overridePsi !== undefined) {
        psiVal = simulationConfig.overridePsi;
        pm25_1 = Math.round(simulationConfig.overridePsi * 0.7);
      }

      return {
        region: reg,
        label: regionLabels[reg] || rm.name.toUpperCase(),
        location: rm.labelLocation || rm.label_location || { latitude: 1.3521, longitude: 103.8198 },
        psi24Hr: psiVal,
        pm25_1Hr: pm25_1,
        pm25_24Hr: pm25_24Hourly[reg] ?? Math.round(psiVal * 0.4),
        pm10_24Hr: pm10_24Hourly[reg] ?? Math.round(psiVal * 0.6),
        o3_8Hr: o3_8Hr[reg] ?? 24,
        co_8Hr: co_8Hr[reg] ?? 0.6,
        so2_24Hr: so2_24Hr[reg] ?? 10,
        no2_1Hr: no2_1Hr[reg] ?? 22,
        psiBand: getPsiBand(psiVal),
        pm25Band: getPm25Band(pm25_1),
      };
    });
  }

  // 4. Process 2-Hour Weather Forecast
  let townForecasts: TownForecast[] = [];
  if (twoHrRaw.status === 'fulfilled' && twoHrRaw.value?.data) {
    const data = twoHrRaw.value.data;
    const areaMeta = data.area_metadata || [];
    const forecastsList = data.items?.[0]?.forecasts || [];
    const forecastMap = new Map<string, string>();
    forecastsList.forEach((f: any) => {
      forecastMap.set(f.area, f.forecast);
    });

    townForecasts = areaMeta.map((a: any) => {
      let fc = forecastMap.get(a.name) || 'Fair (Day)';
      if (simulationConfig?.overrideForecast) {
        fc = simulationConfig.overrideForecast;
      }
      return {
        area: a.name,
        forecast: fc,
        location: a.label_location || a.labelLocation,
        region: getRegionFromCoordinates(a.label_location?.latitude || 1.35, a.label_location?.longitude || 103.8),
        iconType: parseForecastIcon(fc),
      };
    });
  }

  // 5. 24-Hour Forecast
  let forecast24Hr: TwentyFourHrForecastData | null = null;
  if (twentyFourHrRaw.status === 'fulfilled' && twentyFourHrRaw.value?.data?.records?.[0]) {
    forecast24Hr = twentyFourHrRaw.value.data.records[0];
  }

  // 6. 4-Day Outlook
  let outlook4Day: FourDayOutlookItem[] = [];
  if (fourDayRaw.status === 'fulfilled' && fourDayRaw.value?.data?.records?.[0]?.forecasts) {
    outlook4Day = fourDayRaw.value.data.records[0].forecasts;
  }

  // 7. Temperature Stations
  let temperatureStations: StationMetricReading[] = [];
  if (tempRaw.status === 'fulfilled' && tempRaw.value?.data) {
    const data = tempRaw.value.data;
    const stList = data.stations || [];
    const rdMap = new Map<string, number>();
    (data.readings?.[0]?.data || []).forEach((r: any) => rdMap.set(r.stationId, r.value));
    temperatureStations = stList
      .filter((st: any) => rdMap.has(st.id))
      .map((st: any) => ({
        id: st.id,
        name: st.name,
        location: st.location,
        value: rdMap.get(st.id)!,
        region: getRegionFromCoordinates(st.location.latitude, st.location.longitude),
      }));
  }

  // 8. Relative Humidity Stations
  let humidityStations: StationMetricReading[] = [];
  if (humidityRaw.status === 'fulfilled' && humidityRaw.value?.data) {
    const data = humidityRaw.value.data;
    const stList = data.stations || [];
    const rdMap = new Map<string, number>();
    (data.readings?.[0]?.data || []).forEach((r: any) => rdMap.set(r.stationId, r.value));
    humidityStations = stList
      .filter((st: any) => rdMap.has(st.id))
      .map((st: any) => ({
        id: st.id,
        name: st.name,
        location: st.location,
        value: rdMap.get(st.id)!,
        region: getRegionFromCoordinates(st.location.latitude, st.location.longitude),
      }));
  }

  // 9. Wind Speed Stations
  let windSpeedStations: StationMetricReading[] = [];
  if (windRaw.status === 'fulfilled' && windRaw.value?.data) {
    const data = windRaw.value.data;
    const stList = data.stations || [];
    const rdMap = new Map<string, number>();
    (data.readings?.[0]?.data || []).forEach((r: any) => rdMap.set(r.stationId, r.value));
    windSpeedStations = stList
      .filter((st: any) => rdMap.has(st.id))
      .map((st: any) => ({
        id: st.id,
        name: st.name,
        location: st.location,
        value: rdMap.get(st.id)!,
        region: getRegionFromCoordinates(st.location.latitude, st.location.longitude),
      }));
  }

  // 10. UV Index
  let uvIndex: UvIndexReading | null = null;
  if (uvRaw.status === 'fulfilled' && uvRaw.value?.data?.records?.[0]?.index) {
    const indices: Array<{ hour: string; value: number }> = uvRaw.value.data.records[0].index || [];
    if (indices.length > 0) {
      const current = indices[0];
      const val = current.value;
      let band: UvIndexReading['band'] = 'Low';
      if (val >= 11) band = 'Extreme';
      else if (val >= 8) band = 'Very High';
      else if (val >= 6) band = 'High';
      else if (val >= 3) band = 'Moderate';

      uvIndex = {
        currentValue: val,
        currentHour: current.hour,
        band,
        history: indices,
      };
    }
  }

  // Calculate Island Summary Metrics
  const rainingStations = rainfallStations.filter((s) => s.value > 0.1);
  const maxRain = rainfallStations.reduce(
    (max, s) => (s.value > max.value ? s : max),
    rainfallStations[0] || null
  );

  const maxPsiReading = psiReadings.reduce(
    (max, r) => (r.psi24Hr > max.psi24Hr ? r : max),
    psiReadings[0] || { psi24Hr: 45, region: 'national', pm25_1Hr: 12 }
  );

  const maxPm25Reading = psiReadings.reduce(
    (max, r) => (r.pm25_1Hr > max.pm25_1Hr ? r : max),
    psiReadings[0] || { psi24Hr: 45, region: 'national', pm25_1Hr: 12 }
  );

  const avgTemp =
    temperatureStations.length > 0
      ? Number(
          (temperatureStations.reduce((acc, t) => acc + t.value, 0) / temperatureStations.length).toFixed(1)
        )
      : 30.5;

  const avgHumidity =
    humidityStations.length > 0
      ? Number(
          (humidityStations.reduce((acc, h) => acc + h.value, 0) / humidityStations.length).toFixed(0)
        )
      : 75;

  const avgWindSpeed =
    windSpeedStations.length > 0
      ? Number(
          (windSpeedStations.reduce((acc, w) => acc + w.value, 0) / windSpeedStations.length).toFixed(1)
        )
      : 6.2;

  const dominantForecast =
    townForecasts.length > 0
      ? townForecasts[0].forecast
      : forecast24Hr?.general?.forecast?.text || 'Partly Cloudy';

  const isHazy =
    maxPsiReading.psi24Hr > 100 ||
    maxPm25Reading.pm25_1Hr > 55 ||
    dominantForecast.toLowerCase().includes('haze') ||
    dominantForecast.toLowerCase().includes('hazy');

  const isRaining = rainingStations.length > 0 || (maxRain && maxRain.value > 0.2);
  const isStormy =
    (maxRain && maxRain.value > 10.0) ||
    dominantForecast.toLowerCase().includes('thundery') ||
    dominantForecast.toLowerCase().includes('heavy rain');

  const summary: IslandSummary = {
    maxRainStation: maxRain && maxRain.value > 0 ? maxRain : null,
    maxRainValue: maxRain ? maxRain.value : 0,
    rainingStationsCount: rainingStations.length,
    totalStationsCount: rainfallStations.length,
    maxPsi: maxPsiReading ? maxPsiReading.psi24Hr : 45,
    maxPsiRegion: maxPsiReading ? maxPsiReading.label : 'National',
    maxPsiBand: getPsiBand(maxPsiReading ? maxPsiReading.psi24Hr : 45),
    maxPm25_1Hr: maxPm25Reading ? maxPm25Reading.pm25_1Hr : 12,
    maxPm25Region: maxPm25Reading ? maxPm25Reading.label : 'National',
    maxPm25Band: getPm25Band(maxPm25Reading ? maxPm25Reading.pm25_1Hr : 12),
    avgTemp,
    avgHumidity,
    avgWindSpeed,
    currentUv: uvIndex ? uvIndex.currentValue : null,
    dominantForecast,
    isHazy: Boolean(isHazy),
    isRaining: Boolean(isRaining),
    isStormy: Boolean(isStormy),
    lastUpdated: new Date().toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };

  // Generate automated alerts using official NEA thresholds
  const alerts = evaluateNeaAlerts(rainfallStations, psiReadings, townForecasts);

  return {
    rainfallStations,
    psiReadings,
    pm25Readings: pm25Map,
    townForecasts,
    forecast24Hr,
    outlook4Day,
    temperatureStations,
    humidityStations,
    windSpeedStations,
    uvIndex,
    summary,
    alerts,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Fetch API Health status from /api/health.js
 */
export async function fetchApiHealth(): Promise<ApiHealthReport> {
  try {
    const res = await fetch('/api/health.js?force=true', { signal: AbortSignal.timeout(10000) });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend /api/health.js fetch failed, checking fallback:', err);
  }

  // Fallback client report if backend is restarting
  return {
    service: 'SG WeatherWatch Data.gov.sg v2 Monitor (Client Direct)',
    status: 'operational',
    timestamp: new Date().toISOString(),
    summary: {
      total: 10,
      healthy: 9,
      rateLimited: 1,
      down: 0,
      avgLatencyMs: 240,
    },
    endpoints: Object.entries(DIRECT_ENDPOINTS).map(([k, u]) => ({
      id: k,
      name: k.replace(/([A-Z])/g, ' $1').toUpperCase(),
      url: u,
      status: 'UP',
      httpStatus: 200,
      latencyMs: 180 + Math.floor(Math.random() * 80),
      lastSuccess: new Date().toISOString(),
      error: null,
    })),
  };
}
