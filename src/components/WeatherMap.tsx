import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { RainfallStation, RegionalPsiReading, TownForecast, StationMetricReading } from '../types/weather';
import { getRainfallColor } from '../utils/thresholds';
import { Layers, Maximize2, Search, CloudRain, Shield, Cloud } from 'lucide-react';

interface Props {
  rainfallStations: RainfallStation[];
  psiReadings: RegionalPsiReading[];
  townForecasts: TownForecast[];
  temperatureStations: StationMetricReading[];
  selectedStationId?: string | null;
  onSelectStation?: (station: RainfallStation) => void;
}

export const WeatherMap: React.FC<Props> = ({
  rainfallStations,
  psiReadings,
  townForecasts,
  temperatureStations,
  selectedStationId,
  onSelectStation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [activeLayer, setActiveLayer] = useState<'rainfall' | 'psi' | 'forecast' | 'temperature'>('rainfall');
  const [mapStyle, setMapStyle] = useState<'onemap-night' | 'onemap-default' | 'onemap-grey' | 'onemap-original' | 'carto-dark' | 'osm'>('onemap-night');
  const [hasCustomToken, setHasCustomToken] = useState<boolean>(false);
  const [tokenType, setTokenType] = useState<string>('none');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  // Check map token status from server
  useEffect(() => {
    fetch('/api/map/config')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.configured) {
          setHasCustomToken(true);
          setTokenType(data.tokenType || 'onemap');
        }
      })
      .catch(() => {});
  }, []);

  // Update Tile Layer when mapStyle changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    let url = 'https://www.onemap.gov.sg/maps/tiles/Night/{z}/{x}/{y}.png';
    let attribution = 'Map data &copy; <a href="https://www.onemap.gov.sg" target="_blank" rel="noreferrer">Singapore Land Authority (OneMap SLA)</a>';

    if (mapStyle.startsWith('onemap-')) {
      const styleName = mapStyle.replace('onemap-', '');
      const capitalized = styleName.charAt(0).toUpperCase() + styleName.slice(1);
      url = `https://www.onemap.gov.sg/maps/tiles/${capitalized}/{z}/{x}/{y}.png`;
      attribution = 'Map data &copy; <a href="https://www.onemap.gov.sg" target="_blank" rel="noreferrer">Singapore Land Authority (OneMap SLA)</a>';
    } else if (mapStyle === 'carto-dark') {
      url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      attribution = '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap';
    } else if (mapStyle === 'osm') {
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
    }

    const newTileLayer = L.tileLayer(url, {
      attribution,
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    tileLayerRef.current = newTileLayer;
  }, [mapStyle]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Singapore center: 1.3521, 103.8198
    const map = L.map(mapContainerRef.current, {
      center: [1.3521, 103.8198],
      zoom: 11,
      minZoom: 10,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: true,
      maxBounds: [
        [1.15, 103.55],
        [1.52, 104.15],
      ],
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial tile layer: Official OneMap Singapore Night
    const initialTileLayer = L.tileLayer('https://www.onemap.gov.sg/maps/tiles/Night/{z}/{x}/{y}.png', {
      attribution: 'Map data &copy; <a href="https://www.onemap.gov.sg" target="_blank" rel="noreferrer">Singapore Land Authority (OneMap SLA)</a>',
      maxZoom: 19,
    }).addTo(map);

    tileLayerRef.current = initialTileLayer;

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Render Layer markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = layerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    if (activeLayer === 'rainfall') {
      // Rainfall Stations Layer
      rainfallStations.forEach((station) => {
        const val = station.value;
        const color = getRainfallColor(val);
        const radius = val > 50 ? 14 : val > 10 ? 11 : val > 2 ? 8 : val > 0 ? 6 : 5;
        const isRaining = val > 0;

        const circle = L.circleMarker([station.location.latitude, station.location.longitude], {
          radius,
          fillColor: color,
          color: isRaining ? '#ffffff' : color,
          weight: isRaining ? 1.5 : 1,
          opacity: 0.9,
          fillOpacity: isRaining ? 0.85 : 0.6,
        });

        const popupHtml = `
          <div class="p-1 font-sans text-xs">
            <div class="font-bold text-slate-100 text-sm mb-1">${station.name}</div>
            <div class="text-slate-400 font-mono text-[11px] mb-2">Station ID: ${station.id} (${station.region.toUpperCase()})</div>
            <div class="flex items-center justify-between p-2 rounded bg-slate-950/80 border border-slate-800">
              <span class="text-slate-300">Rainfall:</span>
              <span class="font-bold font-mono text-base ${val > 10 ? 'text-amber-400' : 'text-sky-400'}">${val.toFixed(1)} mm</span>
            </div>
            <div class="mt-2 text-[10px] text-slate-400">
              Intensity: <strong class="uppercase text-slate-200">${station.intensity}</strong>
            </div>
          </div>
        `;
        circle.bindPopup(popupHtml);

        circle.on('click', () => {
          onSelectStation?.(station);
        });

        circle.addTo(group);
      });
    } else if (activeLayer === 'psi') {
      // PSI Regional Zones
      psiReadings.forEach((psi) => {
        const val = psi.psi24Hr;
        const color = val <= 50 ? '#10b981' : val <= 100 ? '#0ea5e9' : val <= 200 ? '#f59e0b' : '#ef4444';

        // Custom HTML DivIcon for PSI Region
        const icon = L.divIcon({
          className: 'custom-psi-marker',
          html: `
            <div style="background-color: ${color}20; border: 2px solid ${color};" class="rounded-xl px-2.5 py-1.5 shadow-xl text-center backdrop-blur-md">
              <div class="text-[10px] font-bold text-white uppercase tracking-wider">${psi.region}</div>
              <div class="text-base font-extrabold font-mono text-white leading-tight">${val} <span class="text-[9px] font-normal">PSI</span></div>
              <div class="text-[9px] font-mono text-slate-200">PM2.5: ${psi.pm25_1Hr} µg</div>
            </div>
          `,
          iconSize: [84, 52],
          iconAnchor: [42, 26],
        });

        const marker = L.marker([psi.location.latitude, psi.location.longitude], { icon });

        const popupHtml = `
          <div class="p-1 font-sans text-xs min-w-[200px]">
            <div class="font-bold text-slate-100 text-sm mb-1">${psi.label}</div>
            <div class="space-y-1.5 p-2 rounded bg-slate-950/80 border border-slate-800 font-mono">
              <div class="flex justify-between"><span>24-hr PSI:</span><strong class="text-white">${psi.psi24Hr} (${psi.psiBand})</strong></div>
              <div class="flex justify-between"><span>1-hr PM2.5:</span><strong class="text-amber-400">${psi.pm25_1Hr} µg/m³</strong></div>
              <div class="flex justify-between"><span>24-hr PM10:</span><span>${psi.pm10_24Hr} µg/m³</span></div>
              <div class="flex justify-between"><span>8-hr O3:</span><span>${psi.o3_8Hr} µg/m³</span></div>
            </div>
          </div>
        `;
        marker.bindPopup(popupHtml);
        marker.addTo(group);
      });
    } else if (activeLayer === 'forecast') {
      // 2-Hour Town Forecasts Layer
      townForecasts.forEach((town) => {
        const icon = L.divIcon({
          className: 'custom-forecast-marker',
          html: `
            <div class="bg-slate-900/90 border border-slate-700/80 rounded px-2 py-1 shadow-lg text-center backdrop-blur-sm hover:border-sky-400 transition-colors">
              <div class="text-[10px] font-semibold text-slate-200 truncate max-w-[80px]">${town.area}</div>
              <div class="text-[9px] text-sky-400 font-medium truncate max-w-[80px]">${town.forecast}</div>
            </div>
          `,
          iconSize: [80, 36],
          iconAnchor: [40, 18],
        });

        const marker = L.marker([town.location.latitude, town.location.longitude], { icon });
        marker.bindPopup(`
          <div class="p-1 text-xs font-sans">
            <strong class="text-slate-100 text-sm">${town.area}</strong>
            <p class="text-sky-400 font-medium mt-1">${town.forecast}</p>
            <span class="text-[10px] text-slate-500 font-mono">2-Hour NEA Forecast Window</span>
          </div>
        `);
        marker.addTo(group);
      });
    } else if (activeLayer === 'temperature') {
      // Temperature Stations Layer
      temperatureStations.forEach((st) => {
        const icon = L.divIcon({
          className: 'custom-temp-marker',
          html: `
            <div class="bg-rose-950/80 border border-rose-500/40 rounded-full px-2 py-0.5 text-center shadow-lg font-mono text-[11px] font-bold text-rose-300">
              ${st.value.toFixed(1)}°C
            </div>
          `,
          iconSize: [48, 24],
          iconAnchor: [24, 12],
        });
        const marker = L.marker([st.location.latitude, st.location.longitude], { icon });
        marker.bindPopup(`
          <div class="p-1 text-xs">
            <strong>${st.name}</strong>
            <div class="text-rose-400 font-mono text-sm mt-1">${st.value.toFixed(1)}°C</div>
          </div>
        `);
        marker.addTo(group);
      });
    }
  }, [activeLayer, rainfallStations, psiReadings, townForecasts, temperatureStations, onSelectStation]);

  // Handle station selection fly-to
  useEffect(() => {
    if (!selectedStationId || !mapInstanceRef.current) return;
    const station = rainfallStations.find((s) => s.id === selectedStationId);
    if (station) {
      mapInstanceRef.current.flyTo([station.location.latitude, station.location.longitude], 13, {
        animate: true,
        duration: 1.2,
      });
    }
  }, [selectedStationId, rainfallStations]);

  // Handle Search (Local stations + OneMap API location search)
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapInstanceRef.current) return;

    const query = searchQuery.toLowerCase();
    // 1. Search in rainfall stations first
    const matchRain = rainfallStations.find((s) => s.name.toLowerCase().includes(query) || s.id.toLowerCase() === query);
    if (matchRain) {
      mapInstanceRef.current.flyTo([matchRain.location.latitude, matchRain.location.longitude], 13);
      onSelectStation?.(matchRain);
      return;
    }

    // 2. Search in 2-hr town forecasts
    const matchTown = townForecasts.find((t) => t.area.toLowerCase().includes(query));
    if (matchTown) {
      mapInstanceRef.current.flyTo([matchTown.location.latitude, matchTown.location.longitude], 13);
      return;
    }

    // 3. Query OneMap Search API (https://www.onemap.gov.sg) for addresses, landmarks, postal codes
    try {
      setIsSearchingLocation(true);
      const res = await fetch(`/api/onemap/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const json = await res.json();
        const topResult = json.results?.[0];
        if (topResult && topResult.LATITUDE && topResult.LONGITUDE) {
          const lat = parseFloat(topResult.LATITUDE);
          const lng = parseFloat(topResult.LONGITUDE);
          mapInstanceRef.current.flyTo([lat, lng], 14, { animate: true, duration: 1.2 });

          // Pop up a transient marker at the searched location
          const popup = L.popup()
            .setLatLng([lat, lng])
            .setContent(`
              <div class="p-1 text-xs">
                <strong class="text-white">${topResult.BUILDING || topResult.SEARCHVAL}</strong>
                <p class="text-slate-400 text-[10px] mt-0.5">${topResult.ROAD_NAME || ''} ${topResult.POSTAL ? 'S(' + topResult.POSTAL + ')' : ''}</p>
                <span class="text-[9px] text-teal-400 font-mono">Found via OneMap Singapore</span>
              </div>
            `)
            .openOn(mapInstanceRef.current);
        }
      }
    } catch (err) {
      console.warn('OneMap search error:', err);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const handleResetView = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([1.3521, 103.8198], 11);
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl flex flex-col h-[520px]">
      {/* Top Map Toolbar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pointer-events-none">
        {/* Layer Switcher (Pointer events enabled on buttons) */}
        <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-1 rounded-xl shadow-xl pointer-events-auto text-xs">
          <button
            onClick={() => setActiveLayer('rainfall')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              activeLayer === 'rainfall'
                ? 'bg-sky-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span>Rainfall ({rainfallStations.length})</span>
          </button>

          <button
            onClick={() => setActiveLayer('psi')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              activeLayer === 'psi'
                ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>PSI & PM2.5</span>
          </button>

          <button
            onClick={() => setActiveLayer('forecast')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              activeLayer === 'forecast'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>2-Hr Towns ({townForecasts.length})</span>
          </button>

          <button
            onClick={() => setActiveLayer('temperature')}
            className={`px-3 py-1.5 rounded-lg transition-colors hidden md:inline-block ${
              activeLayer === 'temperature'
                ? 'bg-rose-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Temp (°C)</span>
          </button>
        </div>

        {/* Search & Reset */}
        <div className="flex items-center gap-2 pointer-events-auto self-end sm:self-auto">
          {/* Map Base Tile Style Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-2 py-1 rounded-xl text-xs">
            <span className="text-[10px] text-slate-400 font-mono hidden md:inline">Base Map:</span>
            <select
              value={mapStyle}
              onChange={(e) => setMapStyle(e.target.value as any)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
              title="Select Base Map Layer"
            >
              <option value="onemap-night" className="bg-slate-900 text-white">OneMap Singapore (Night - SLA)</option>
              <option value="onemap-default" className="bg-slate-900 text-white">OneMap Singapore (Default - SLA)</option>
              <option value="onemap-grey" className="bg-slate-900 text-white">OneMap Singapore (Grey - SLA)</option>
              <option value="onemap-original" className="bg-slate-900 text-white">OneMap Singapore (Original - SLA)</option>
              <option value="carto-dark" className="bg-slate-900 text-white">Carto Dark Matter</option>
              <option value="osm" className="bg-slate-900 text-white">OpenStreetMap Standard</option>
            </select>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="OneMap SLA Official Base Active" />
          </div>

          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder={isSearchingLocation ? "Searching OneMap..." : "Search station, town, or address..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-white text-xs pl-8 pr-3 py-1.5 rounded-xl focus:outline-none focus:border-sky-500 w-44 sm:w-60"
            />
            <Search className={`w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 ${isSearchingLocation ? 'animate-spin text-teal-400' : ''}`} />
          </form>

          <button
            onClick={handleResetView}
            className="p-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl text-slate-300 hover:text-white transition-colors"
            title="Reset Singapore Map View"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Map Legend Overlay in bottom-left */}
      <div className="absolute bottom-3 left-3 z-10 pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-800 p-2.5 rounded-xl shadow-xl text-xs space-y-1.5 max-w-[260px]">
        <div className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider flex items-center justify-between">
          <span>{activeLayer.toUpperCase()} LEGEND</span>
          <span className="text-[10px] font-mono text-slate-500">NEA OFFICIAL</span>
        </div>

        {activeLayer === 'rainfall' && (
          <div className="grid grid-cols-2 gap-1 text-[11px] font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
              <span className="text-slate-400">0.0 mm (Dry)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
              <span className="text-sky-300">&le; 2.5 mm</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-blue-300">2.6 - 10 mm</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-amber-300">10.1 - 50 mm</span>
            </div>
            <div className="flex items-center gap-1.5 col-span-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="text-rose-400 font-bold">&gt; 50 mm (Flash Flood Risk)</span>
            </div>
          </div>
        )}

        {activeLayer === 'psi' && (
          <div className="grid grid-cols-2 gap-1 text-[11px] font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-emerald-300">0-50 Good</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <span className="text-sky-300">51-100 Mod</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-amber-300">101-200 Unhealthy</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-rose-300">&gt;200 Very Unhealthy</span>
            </div>
          </div>
        )}

        {activeLayer === 'forecast' && (
          <p className="text-[11px] text-slate-400 leading-tight">
            Click on any town marker for 2-hour NEA weather forecast details.
          </p>
        )}
      </div>
    </div>
  );
};
