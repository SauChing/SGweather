import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import healthHandler, { getHealthStatus } from './api/health.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);

const DATA_GOV_ENDPOINTS: Record<string, string> = {
  'two-hr-forecast': 'https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast',
  'twenty-four-hr-forecast': 'https://api-open.data.gov.sg/v2/real-time/api/twenty-four-hr-forecast',
  'four-day-outlook': 'https://api-open.data.gov.sg/v2/real-time/api/four-day-outlook',
  'air-temperature': 'https://api-open.data.gov.sg/v2/real-time/api/air-temperature',
  'rainfall': 'https://api-open.data.gov.sg/v2/real-time/api/rainfall',
  'psi': 'https://api-open.data.gov.sg/v2/real-time/api/psi',
  'pm25': 'https://api-open.data.gov.sg/v2/real-time/api/pm25',
  'uv': 'https://api-open.data.gov.sg/v2/real-time/api/uv',
  'relative-humidity': 'https://api-open.data.gov.sg/v2/real-time/api/relative-humidity',
  'wind-speed': 'https://api-open.data.gov.sg/v2/real-time/api/wind-speed',
};

// In-memory weather data cache with TTL to protect against Data.gov.sg 429 rate limits
interface CacheEntry {
  timestamp: number;
  data: any;
}

const weatherCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 45 * 1000; // 45 seconds cache

async function fetchFromDataGov(endpointKey: string): Promise<any> {
  const url = DATA_GOV_ENDPOINTS[endpointKey];
  if (!url) throw new Error(`Unknown endpoint: ${endpointKey}`);

  const cached = weatherCache.get(endpointKey);
  const now = Date.now();
  if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  const res = await fetch(url, {
    headers: { 'User-Agent': 'SGWeatherWatch/2.0' },
  });

  if (!res.ok) {
    if (res.status === 429 && cached) {
      console.warn(`[Weather Cache] Rate limited on ${endpointKey}, serving stale cache.`);
      return cached.data;
    }
    throw new Error(`Data.gov.sg responded with HTTP ${res.status}`);
  }

  const json = await res.json();
  weatherCache.set(endpointKey, { timestamp: now, data: json });
  return json;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // CORS headers for API
  app.use('/api', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // 1. API Health Monitor routes (/api/health.js and /api/health)
  app.get('/api/health.js', healthHandler);
  app.get('/api/health', healthHandler);

  // 2. Interactive Map Configuration & Tile Proxy for OneMap Singapore / Mapbox Token
  app.get('/api/map/config', (req: Request, res: Response) => {
    const token = process.env.MAP_ACCESS_TOKEN || process.env.VITE_MAP_ACCESS_TOKEN;
    res.json({
      configured: Boolean(token),
      tokenType: token ? (token.startsWith('pk.') ? 'mapbox' : 'onemap') : 'none',
      availableStyles: ['onemap-night', 'onemap-default', 'onemap-grey', 'onemap-original', 'carto-dark', 'osm'],
      defaultStyle: 'onemap-night',
      provider: 'https://www.onemap.gov.sg',
    });
  });

  // OneMap Location / Address search API proxy
  app.get('/api/onemap/search', async (req: Request, res: Response) => {
    const query = req.query.q as string;
    if (!query) {
      res.json({ results: [] });
      return;
    }
    const token = process.env.MAP_ACCESS_TOKEN || process.env.VITE_MAP_ACCESS_TOKEN;
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const searchRes = await fetch(
        `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(query)}&returnGeom=Y&getAddrDetails=Y`,
        { headers }
      );
      if (searchRes.ok) {
        const json = await searchRes.json();
        res.json(json);
        return;
      }
    } catch {
      // fallback
    }
    res.json({ results: [] });
  });

  // Proxy OneMap Singapore / Mapbox tiles securely without leaking tokens to client
  app.get('/api/map/tiles/:style/:z/:x/:y', async (req: Request, res: Response) => {
    const { style, z, x, y } = req.params;
    const token = process.env.MAP_ACCESS_TOKEN || process.env.VITE_MAP_ACCESS_TOKEN;

    if (token) {
      try {
        const isOneMap = !token.startsWith('pk.');
        let tileUrl = '';
        const headers: Record<string, string> = {};

        if (isOneMap) {
          const styleMap: Record<string, string> = {
            'onemap-night': 'Night',
            'onemap-default': 'Default',
            'onemap-grey': 'Grey',
            'onemap-original': 'Original',
            'Night': 'Night',
            'Default': 'Default',
            'Grey': 'Grey',
          };
          const oneMapStyle = styleMap[style] || 'Night';
          tileUrl = `https://www.onemap.gov.sg/maps/tiles/${oneMapStyle}/${z}/${x}/${y}.png`;
          headers['Authorization'] = `Bearer ${token}`;
        } else {
          // Mapbox style
          tileUrl = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/${z}/${x}/${y}?access_token=${token}`;
        }

        const tileRes = await fetch(tileUrl, { headers });
        if (tileRes.ok) {
          const buffer = await tileRes.arrayBuffer();
          res.setHeader('Content-Type', tileRes.headers.get('content-type') || 'image/png');
          res.setHeader('Cache-Control', 'public, max-age=86400');
          res.send(Buffer.from(buffer));
          return;
        }
      } catch (err) {
        console.warn('Map tile proxy error, falling back to Carto:', err);
      }
    }

    // High quality fallback: Carto Dark Matter
    res.redirect(`https://a.basemaps.cartocdn.com/dark_all/${z}/${x}/${y}.png`);
  });

  // 2. Weather proxy endpoints (with caching & rate-limit resilience)
  app.get('/api/weather/:key', async (req: Request, res: Response) => {
    const key = req.params.key;
    if (!DATA_GOV_ENDPOINTS[key]) {
      res.status(404).json({ error: `Invalid weather endpoint: ${key}` });
      return;
    }
    try {
      const data = await fetchFromDataGov(key);
      res.json(data);
    } catch (err: any) {
      res.status(502).json({ error: 'Failed to fetch upstream weather data', message: err.message });
    }
  });

  // 3. Batch fetch all weather endpoints (staggered to prevent 429)
  app.get('/api/weather-all', async (req: Request, res: Response) => {
    const results: Record<string, any> = {};
    const errors: Record<string, string> = {};

    for (const key of Object.keys(DATA_GOV_ENDPOINTS)) {
      try {
        results[key] = await fetchFromDataGov(key);
      } catch (err: any) {
        errors[key] = err.message;
      }
    }

    res.json({
      timestamp: new Date().toISOString(),
      data: results,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
    });
  });

  // Vite middleware in dev or static files in production
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SG WeatherWatch server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
