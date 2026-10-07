import { PsiBand, Pm25Band, RainfallStation, RegionalPsiReading, TownForecast, WeatherAlert } from '../types/weather';

export interface PsiBandInfo {
  band: PsiBand;
  range: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  generalPublicAdvice: string;
  vulnerableAdvice: string;
}

export const NEA_PSI_BANDS: Record<PsiBand, PsiBandInfo> = {
  Good: {
    band: 'Good',
    range: '0 – 50',
    color: '#10b981', // emerald-500
    bgColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    textColor: 'text-emerald-400',
    generalPublicAdvice: 'Normal outdoor activities may be carried out.',
    vulnerableAdvice: 'Normal outdoor activities may be carried out.',
  },
  Moderate: {
    band: 'Moderate',
    range: '51 – 100',
    color: '#0ea5e9', // sky-500
    bgColor: 'rgba(14, 165, 233, 0.1)',
    borderColor: 'rgba(14, 165, 233, 0.3)',
    textColor: 'text-sky-400',
    generalPublicAdvice: 'Normal outdoor activities may be carried out.',
    vulnerableAdvice: 'Normal outdoor activities may be carried out.',
  },
  Unhealthy: {
    band: 'Unhealthy',
    range: '101 – 200',
    color: '#f59e0b', // amber-500
    bgColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    textColor: 'text-amber-400',
    generalPublicAdvice: 'Reduce prolonged or strenuous outdoor exertion.',
    vulnerableAdvice: 'Minimize outdoor exertion. Elderly, pregnant women and children should rest indoors.',
  },
  'Very Unhealthy': {
    band: 'Very Unhealthy',
    range: '201 – 300',
    color: '#ef4444', // red-500
    bgColor: 'rgba(239, 68, 68, 0.18)',
    borderColor: 'rgba(239, 68, 68, 0.5)',
    textColor: 'text-red-400',
    generalPublicAdvice: 'Avoid strenuous outdoor exertion.',
    vulnerableAdvice: 'Avoid outdoor exertion. Stay indoors with air purifier or closed windows.',
  },
  Hazardous: {
    band: 'Hazardous',
    range: '301+',
    color: '#a855f7', // purple-500
    bgColor: 'rgba(168, 85, 247, 0.25)',
    borderColor: 'rgba(168, 85, 247, 0.6)',
    textColor: 'text-purple-400',
    generalPublicAdvice: 'Minimize outdoor activities. Keep windows and doors closed.',
    vulnerableAdvice: 'Stay indoors. Seek medical attention if unwell. Avoid all outdoor exertion.',
  },
};

export const NEA_PM25_BANDS: Record<Pm25Band, { band: Pm25Band; range: string; color: string; advice: string }> = {
  Normal: {
    band: 'Normal',
    range: '0 – 55 µg/m³',
    color: '#10b981',
    advice: 'Normal outdoor activities for all individuals.',
  },
  Elevated: {
    band: 'Elevated',
    range: '56 – 150 µg/m³',
    color: '#f59e0b',
    advice: 'Vulnerable individuals should reduce strenuous outdoor activities.',
  },
  High: {
    band: 'High',
    range: '151 – 250 µg/m³',
    color: '#ef4444',
    advice: 'General public should reduce outdoor activities. Vulnerable persons stay indoors.',
  },
  'Very High': {
    band: 'Very High',
    range: '> 250 µg/m³',
    color: '#a855f7',
    advice: 'Avoid all outdoor activities.',
  },
};

export function getPsiBand(value: number): PsiBand {
  if (value <= 50) return 'Good';
  if (value <= 100) return 'Moderate';
  if (value <= 200) return 'Unhealthy';
  if (value <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

export function getPm25Band(value: number): Pm25Band {
  if (value <= 55) return 'Normal';
  if (value <= 150) return 'Elevated';
  if (value <= 250) return 'High';
  return 'Very High';
}

export function getRainfallIntensity(value: number): RainfallStation['intensity'] {
  if (value < 0.2) return 'none';
  if (value <= 2.5) return 'light';
  if (value <= 10.0) return 'moderate';
  if (value <= 50.0) return 'heavy';
  return 'torrential';
}

export function getRainfallColor(value: number): string {
  if (value < 0.2) return '#64748b'; // slate-500
  if (value <= 2.5) return '#38bdf8'; // sky-400
  if (value <= 10.0) return '#3b82f6'; // blue-500
  if (value <= 50.0) return '#f59e0b'; // amber-500
  return '#ef4444'; // red-500 (torrential)
}

/**
 * Generate official NEA threshold-based alerts
 */
export function evaluateNeaAlerts(
  rainfallStations: RainfallStation[],
  psiReadings: RegionalPsiReading[],
  townForecasts: TownForecast[]
): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  const now = new Date().toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', hour12: true });

  // 1. Evaluate Rainfall Thresholds
  const torrentialStations = rainfallStations.filter((s) => s.value > 50.0);
  const heavyRainStations = rainfallStations.filter((s) => s.value > 10.0 && s.value <= 50.0);

  if (torrentialStations.length > 0) {
    const stationNames = torrentialStations.slice(0, 3).map((s) => `${s.name} (${s.value.toFixed(1)} mm)`).join(', ');
    const remainingCount = torrentialStations.length > 3 ? ` +${torrentialStations.length - 3} more` : '';
    alerts.push({
      id: `rain-torrential-${Date.now()}`,
      category: 'rainfall',
      severity: 'critical',
      title: 'PUB & NEA Torrential Rain / Flash Flood Risk',
      location: `${stationNames}${remainingCount}`,
      metricValue: `${Math.max(...torrentialStations.map((s) => s.value)).toFixed(1)} mm`,
      thresholdMet: 'Rainfall > 50.0 mm/h (NEA Severe / Torrential threshold)',
      neaGuidance:
        'High risk of localized flash floods. Avoid low-lying areas, open storm canals, and postpone driving or outdoor physical activities.',
      affectedGroups: ['Motorists', 'Pedestrians in flood-prone areas', 'Ground-floor occupants'],
      timestamp: now,
    });
  } else if (heavyRainStations.length > 0) {
    const maxHeavy = Math.max(...heavyRainStations.map((s) => s.value));
    const stationNames = heavyRainStations.slice(0, 3).map((s) => `${s.name} (${s.value.toFixed(1)} mm)`).join(', ');
    const extra = heavyRainStations.length > 3 ? ` +${heavyRainStations.length - 3} more` : '';
    alerts.push({
      id: `rain-heavy-${Date.now()}`,
      category: 'rainfall',
      severity: 'warning',
      title: 'NEA Heavy Rain Warning',
      location: `${stationNames}${extra}`,
      metricValue: `${maxHeavy.toFixed(1)} mm`,
      thresholdMet: 'Rainfall > 10.0 mm/h (NEA Heavy Rain threshold)',
      neaGuidance:
        'Moderate to heavy showers with sudden gusts. Carry wet weather gear. Road visibility reduced. Water pooling on road expressways.',
      affectedGroups: ['Commuters', 'Outdoor workers', 'Drivers'],
      timestamp: now,
    });
  }

  // 2. Evaluate PSI Thresholds
  const hazardousRegions = psiReadings.filter((r) => r.psi24Hr > 300);
  const veryUnhealthyRegions = psiReadings.filter((r) => r.psi24Hr > 200 && r.psi24Hr <= 300);
  const unhealthyRegions = psiReadings.filter((r) => r.psi24Hr > 100 && r.psi24Hr <= 200);

  if (hazardousRegions.length > 0) {
    const regions = hazardousRegions.map((r) => `${r.label} (PSI ${r.psi24Hr})`).join(', ');
    alerts.push({
      id: `psi-hazardous-${Date.now()}`,
      category: 'psi',
      severity: 'critical',
      title: 'NEA PSI Alert: Hazardous Air Quality (301+)',
      location: regions,
      metricValue: `PSI ${Math.max(...hazardousRegions.map((r) => r.psi24Hr))}`,
      thresholdMet: '24-hr PSI > 300 (NEA Hazardous Level)',
      neaGuidance:
        'Healthy persons should minimize outdoor activity. Elderly, children, and persons with chronic diseases should stay indoors with windows shut. Wear N95 if outdoors.',
      affectedGroups: ['General public', 'Elderly & children', 'Asthma/heart patients'],
      timestamp: now,
    });
  } else if (veryUnhealthyRegions.length > 0) {
    const regions = veryUnhealthyRegions.map((r) => `${r.label} (PSI ${r.psi24Hr})`).join(', ');
    alerts.push({
      id: `psi-very-unhealthy-${Date.now()}`,
      category: 'psi',
      severity: 'critical',
      title: 'NEA PSI Alert: Very Unhealthy Air Quality (201-300)',
      location: regions,
      metricValue: `PSI ${Math.max(...veryUnhealthyRegions.map((r) => r.psi24Hr))}`,
      thresholdMet: '24-hr PSI 201–300 (NEA Very Unhealthy Band)',
      neaGuidance:
        'General public should avoid strenuous outdoor exertion. Vulnerable persons must stay indoors and avoid outdoor activity.',
      affectedGroups: ['Vulnerable groups', 'Outdoor sports participants'],
      timestamp: now,
    });
  } else if (unhealthyRegions.length > 0) {
    const regions = unhealthyRegions.map((r) => `${r.label} (PSI ${r.psi24Hr})`).join(', ');
    alerts.push({
      id: `psi-unhealthy-${Date.now()}`,
      category: 'psi',
      severity: 'warning',
      title: 'NEA PSI Alert: Unhealthy Air Quality (101-200)',
      location: regions,
      metricValue: `PSI ${Math.max(...unhealthyRegions.map((r) => r.psi24Hr))}`,
      thresholdMet: '24-hr PSI 101–200 (NEA Unhealthy Band)',
      neaGuidance:
        'Healthy people should reduce prolonged strenuous exertion outdoors. Vulnerable persons should minimize outdoor activity.',
      affectedGroups: ['Elderly', 'Pregnant women', 'Children', 'Cardiopulmonary patients'],
      timestamp: now,
    });
  }

  // 3. Evaluate 1-Hour PM2.5 (Immediate Activity Decision Guide)
  const highPm25 = psiReadings.filter((r) => r.pm25_1Hr > 150);
  const elevatedPm25 = psiReadings.filter((r) => r.pm25_1Hr > 55 && r.pm25_1Hr <= 150);

  if (highPm25.length > 0) {
    const regions = highPm25.map((r) => `${r.label} (${r.pm25_1Hr} µg/m³)`).join(', ');
    alerts.push({
      id: `pm25-high-${Date.now()}`,
      category: 'pm25',
      severity: 'warning',
      title: 'NEA 1-Hour PM2.5 High / Very High Alert',
      location: regions,
      metricValue: `${Math.max(...highPm25.map((r) => r.pm25_1Hr))} µg/m³`,
      thresholdMet: '1-hr PM2.5 > 150 µg/m³ (Band III / IV)',
      neaGuidance:
        'Immediate short-term particle spike detected. Reschedule outdoor runs and athletic training.',
      affectedGroups: ['Runners', 'Schools', 'Outdoor events'],
      timestamp: now,
    });
  } else if (elevatedPm25.length > 0 && unhealthyRegions.length === 0) {
    const regions = elevatedPm25.map((r) => `${r.label} (${r.pm25_1Hr} µg/m³)`).join(', ');
    alerts.push({
      id: `pm25-elevated-${Date.now()}`,
      category: 'pm25',
      severity: 'advisory',
      title: 'NEA 1-Hour PM2.5 Elevated Advisory',
      location: regions,
      metricValue: `${Math.max(...elevatedPm25.map((r) => r.pm25_1Hr))} µg/m³`,
      thresholdMet: '1-hr PM2.5 56–150 µg/m³ (Band II)',
      neaGuidance: 'Vulnerable individuals should reduce prolonged or strenuous outdoor physical exertion.',
      affectedGroups: ['Elderly', 'Persons with respiratory conditions'],
      timestamp: now,
    });
  }

  // 4. Evaluate Severe Thundery Showers in 2-Hour Forecast
  const thunderTowns = townForecasts.filter((t) =>
    t.forecast.toLowerCase().includes('heavy thundery') || t.forecast.toLowerCase().includes('thundery showers')
  );
  if (thunderTowns.length >= 10 && torrentialStations.length === 0 && heavyRainStations.length === 0) {
    alerts.push({
      id: `forecast-thunder-${Date.now()}`,
      category: 'forecast',
      severity: 'advisory',
      title: 'Island-wide Thundery Showers Forecast',
      location: `${thunderTowns.length} towns affected (incl. ${thunderTowns.slice(0, 3).map((t) => t.area).join(', ')})`,
      metricValue: `${thunderTowns.length} / ${townForecasts.length} areas`,
      thresholdMet: 'Widespread Thundery Showers in NEA 2-Hour Forecast',
      neaGuidance: 'Lightning risk elevated. Seek shelter indoors immediately upon hearing thunder or seeing dark clouds.',
      affectedGroups: ['Golfers', 'Swimmers', 'Hikers', 'Outdoor construction workers'],
      timestamp: now,
    });
  }

  return alerts;
}
