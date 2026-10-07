/**
 * Singapore Weather API Health Monitor
 * Monitors official Data.gov.sg v2 Real-Time Weather APIs
 */

export const ENDPOINTS = [
  { id: 'two-hr-forecast', name: '2-Hour Weather Forecast', url: 'https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast' },
  { id: 'twenty-four-hr-forecast', name: '24-Hour Weather Forecast', url: 'https://api-open.data.gov.sg/v2/real-time/api/twenty-four-hr-forecast' },
  { id: 'four-day-outlook', name: '4-Day Weather Outlook', url: 'https://api-open.data.gov.sg/v2/real-time/api/four-day-outlook' },
  { id: 'air-temperature', name: 'Air Temperature', url: 'https://api-open.data.gov.sg/v2/real-time/api/air-temperature' },
  { id: 'rainfall', name: 'Rainfall (5-Min Total)', url: 'https://api-open.data.gov.sg/v2/real-time/api/rainfall' },
  { id: 'psi', name: 'Pollutant Standards Index (PSI)', url: 'https://api-open.data.gov.sg/v2/real-time/api/psi' },
  { id: 'pm25', name: 'PM2.5 (1-Hour Concentration)', url: 'https://api-open.data.gov.sg/v2/real-time/api/pm25' },
  { id: 'uv', name: 'UV Index', url: 'https://api-open.data.gov.sg/v2/real-time/api/uv' },
  { id: 'relative-humidity', name: 'Relative Humidity', url: 'https://api-open.data.gov.sg/v2/real-time/api/relative-humidity' },
  { id: 'wind-speed', name: 'Wind Speed', url: 'https://api-open.data.gov.sg/v2/real-time/api/wind-speed' }
];

// In-memory health cache
const healthCache = {
  lastCheck: 0,
  results: null
};

export async function checkEndpointHealth(endpoint) {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(endpoint.url, {
      headers: { 'User-Agent': 'SGWeatherWatch-Monitor/2.0' },
      signal: controller.signal
    });
    clearTimeout(timeout);

    const latencyMs = Date.now() - start;
    if (res.ok) {
      const json = await res.json();
      const hasData = json && (json.data || json.code === 0);
      return {
        id: endpoint.id,
        name: endpoint.name,
        url: endpoint.url,
        status: hasData ? 'UP' : 'DEGRADED',
        httpStatus: res.status,
        latencyMs,
        lastSuccess: new Date().toISOString(),
        error: null
      };
    } else if (res.status === 429) {
      return {
        id: endpoint.id,
        name: endpoint.name,
        url: endpoint.url,
        status: 'RATE_LIMITED',
        httpStatus: 429,
        latencyMs,
        lastSuccess: null,
        error: 'Data.gov.sg rate limit exceeded (HTTP 429)'
      };
    } else {
      return {
        id: endpoint.id,
        name: endpoint.name,
        url: endpoint.url,
        status: 'DOWN',
        httpStatus: res.status,
        latencyMs,
        lastSuccess: null,
        error: `HTTP Error ${res.status}`
      };
    }
  } catch (err) {
    return {
      id: endpoint.id,
      name: endpoint.name,
      url: endpoint.url,
      status: 'DOWN',
      httpStatus: 0,
      latencyMs: Date.now() - start,
      lastSuccess: null,
      error: err.message || 'Connection timeout or network failure'
    };
  }
}

/**
 * Executes health check across all endpoints with mild stagger to avoid Data.gov.sg 429 rate limiter
 */
export async function getHealthStatus(forceRefresh = false) {
  const now = Date.now();
  // Cache health checks for 30 seconds unless forceRefresh
  if (!forceRefresh && healthCache.results && now - healthCache.lastCheck < 30000) {
    return {
      ...healthCache.results,
      cached: true,
      cacheAgeSeconds: Math.round((now - healthCache.lastCheck) / 1000)
    };
  }

  const endpointResults = [];
  // Stagger requests slightly (150ms) to respect Data.gov.sg rate limits
  for (const ep of ENDPOINTS) {
    const res = await checkEndpointHealth(ep);
    endpointResults.push(res);
    await new Promise(r => setTimeout(r, 150));
  }

  const healthyCount = endpointResults.filter(r => r.status === 'UP').length;
  const rateLimitedCount = endpointResults.filter(r => r.status === 'RATE_LIMITED').length;
  const downCount = endpointResults.filter(r => r.status === 'DOWN').length;

  let overallStatus = 'operational';
  if (downCount > 3) {
    overallStatus = 'major_outage';
  } else if (downCount > 0 || rateLimitedCount > 0) {
    overallStatus = 'degraded_performance';
  }

  const avgLatency = Math.round(
    endpointResults.reduce((acc, r) => acc + (r.latencyMs || 0), 0) / endpointResults.length
  );

  const finalResult = {
    service: 'SG WeatherWatch Data.gov.sg v2 Monitor',
    status: overallStatus,
    timestamp: new Date().toISOString(),
    summary: {
      total: ENDPOINTS.length,
      healthy: healthyCount,
      rateLimited: rateLimitedCount,
      down: downCount,
      avgLatencyMs: avgLatency
    },
    endpoints: endpointResults,
    cached: false
  };

  healthCache.lastCheck = Date.now();
  healthCache.results = finalResult;

  return finalResult;
}

// Handler for Express or Serverless environments
export default async function handler(req, res) {
  try {
    const force = req.query && (req.query.force === 'true' || req.query.fresh === '1');
    const statusData = await getHealthStatus(Boolean(force));
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=15');
    res.status(statusData.status === 'major_outage' ? 503 : 200).json(statusData);
  } catch (error) {
    res.status(500).json({
      error: 'Health monitor failed to execute',
      message: error.message
    });
  }
}
