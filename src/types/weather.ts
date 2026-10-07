export type RegionName = 'west' | 'east' | 'central' | 'south' | 'north' | 'national';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface RainfallStation {
  id: string;
  deviceId: string;
  name: string;
  location: LatLng;
  value: number; // in mm
  intensity: 'none' | 'light' | 'moderate' | 'heavy' | 'torrential';
  region: RegionName;
}

export type PsiBand = 'Good' | 'Moderate' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous';

export type Pm25Band = 'Normal' | 'Elevated' | 'High' | 'Very High';

export interface RegionalPsiReading {
  region: RegionName;
  label: string;
  location: LatLng;
  psi24Hr: number;
  pm25_1Hr: number;
  pm25_24Hr: number;
  pm10_24Hr: number;
  o3_8Hr: number;
  co_8Hr: number;
  so2_24Hr: number;
  no2_1Hr: number;
  psiBand: PsiBand;
  pm25Band: Pm25Band;
}

export interface TownForecast {
  area: string;
  forecast: string;
  location: LatLng;
  region: RegionName;
  iconType: 'sunny' | 'partly-cloudy' | 'cloudy' | 'light-rain' | 'moderate-rain' | 'heavy-rain' | 'thunderstorm' | 'hazy';
}

export interface TwentyFourHrForecastData {
  date: string;
  updatedTimestamp: string;
  general: {
    forecast: { text: string; code: string };
    relativeHumidity: { low: number; high: number; unit?: string };
    temperature: { low: number; high: number; unit?: string };
    wind: { speed: { low: number; high: number }; direction: string };
    validPeriod?: { text: string; start: string; end: string };
  };
  periods: Array<{
    timePeriod: { text: string };
    regions: Record<RegionName, { text: string; code?: string }>;
  }>;
}

export interface FourDayOutlookItem {
  day: string;
  date?: string;
  forecast: { summary: string; text?: string; code?: string };
  temperature: { low: number; high: number };
  relativeHumidity: { low: number; high: number };
  wind: { speed: { low: number; high: number }; direction: string };
}

export interface StationMetricReading {
  id: string;
  name: string;
  location: LatLng;
  value: number;
  region: RegionName;
}

export interface UvIndexReading {
  currentValue: number;
  currentHour: string;
  band: 'Low' | 'Moderate' | 'High' | 'Very High' | 'Extreme';
  history: Array<{ hour: string; value: number }>;
}

export type AlertSeverity = 'critical' | 'warning' | 'advisory' | 'info';

export type AlertCategory = 'rainfall' | 'psi' | 'forecast' | 'pm25' | 'uv';

export interface WeatherAlert {
  id: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  location: string;
  metricValue: string;
  thresholdMet: string;
  neaGuidance: string;
  affectedGroups: string[];
  timestamp: string;
}

export interface IslandSummary {
  maxRainStation: RainfallStation | null;
  maxRainValue: number;
  rainingStationsCount: number;
  totalStationsCount: number;
  maxPsi: number;
  maxPsiRegion: string;
  maxPsiBand: PsiBand;
  maxPm25_1Hr: number;
  maxPm25Region: string;
  maxPm25Band: Pm25Band;
  avgTemp: number | null;
  avgHumidity: number | null;
  avgWindSpeed: number | null;
  currentUv: number | null;
  dominantForecast: string;
  isHazy: boolean;
  isRaining: boolean;
  isStormy: boolean;
  lastUpdated: string;
}

export interface ApiEndpointHealth {
  id: string;
  name: string;
  url: string;
  status: 'UP' | 'DEGRADED' | 'RATE_LIMITED' | 'DOWN';
  httpStatus: number;
  latencyMs: number;
  lastSuccess: string | null;
  error: string | null;
}

export interface ApiHealthReport {
  service: string;
  status: 'operational' | 'degraded_performance' | 'major_outage';
  timestamp: string;
  summary: {
    total: number;
    healthy: number;
    rateLimited: number;
    down: number;
    avgLatencyMs: number;
  };
  endpoints: ApiEndpointHealth[];
  cached?: boolean;
  cacheAgeSeconds?: number;
}

export type VisualWeatherEffect = 'auto' | 'haze' | 'rain' | 'heavy-rain' | 'thunderstorm' | 'clear' | 'off';

