import React, { useState } from 'react';
import { TownForecast, TwentyFourHrForecastData, FourDayOutlookItem } from '../types/weather';
import {
  Cloud,
  Sun,
  CloudRain,
  CloudLightning,
  CloudFog,
  Calendar,
  Compass,
  Thermometer,
  Droplets,
  Wind,
} from 'lucide-react';

interface Props {
  townForecasts: TownForecast[];
  forecast24Hr: TwentyFourHrForecastData | null;
  outlook4Day: FourDayOutlookItem[];
}

export const ForecastView: React.FC<Props> = ({ townForecasts, forecast24Hr, outlook4Day }) => {
  const [activeTab, setActiveTab] = useState<'2hr' | '24hr' | '4day'>('2hr');
  const [townSearch, setTownSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');

  const getForecastIcon = (iconType: TownForecast['iconType']) => {
    switch (iconType) {
      case 'sunny':
        return <Sun className="w-5 h-5 text-amber-400" />;
      case 'partly-cloudy':
      case 'cloudy':
        return <Cloud className="w-5 h-5 text-slate-300" />;
      case 'light-rain':
      case 'moderate-rain':
        return <CloudRain className="w-5 h-5 text-sky-400" />;
      case 'heavy-rain':
        return <CloudRain className="w-5 h-5 text-blue-500" />;
      case 'thunderstorm':
        return <CloudLightning className="w-5 h-5 text-amber-400 animate-pulse" />;
      case 'hazy':
        return <CloudFog className="w-5 h-5 text-amber-300" />;
      default:
        return <Sun className="w-5 h-5 text-amber-400" />;
    }
  };

  const filteredTowns = townForecasts.filter((t) => {
    const matchSearch = t.area.toLowerCase().includes(townSearch.toLowerCase());
    const matchRegion = selectedRegion === 'all' || t.region === selectedRegion;
    return matchSearch && matchRegion;
  });

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-md p-5 space-y-5 shadow-xl">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-400" />
            <span>Singapore Meteorological Forecasts</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Official NEA high-resolution forecasts spanning 2-hour town level to 4-day outlook
          </p>
        </div>

        {/* Forecast View Switcher */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('2hr')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === '2hr' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            2-Hour Towns ({townForecasts.length})
          </button>
          <button
            onClick={() => setActiveTab('24hr')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === '24hr' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            24-Hour Synoptic
          </button>
          <button
            onClick={() => setActiveTab('4day')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === '4day' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            4-Day Outlook
          </button>
        </div>
      </div>

      {/* Tab 1: 2-Hour Towns */}
      {activeTab === '2hr' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <input
              type="text"
              placeholder="Search town (e.g. Ang Mo Kio, Bedok, Jurong East)..."
              value={townSearch}
              onChange={(e) => setTownSearch(e.target.value)}
              className="bg-slate-950/80 border border-slate-800 text-white text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500 flex-1"
            />
            <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto">
              {['all', 'north', 'south', 'east', 'west', 'central'].map((reg) => (
                <button
                  key={reg}
                  onClick={() => setSelectedRegion(reg)}
                  className={`px-2.5 py-1 rounded capitalize font-medium transition-colors ${
                    selectedRegion === reg
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {reg}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
            {filteredTowns.map((town) => (
              <div
                key={town.area}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900/60 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono uppercase text-slate-500">{town.region}</span>
                    {getForecastIcon(town.iconType)}
                  </div>
                  <h4 className="text-xs font-semibold text-slate-100 truncate">{town.area}</h4>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800/60 text-[11px] font-medium text-indigo-300 truncate">
                  {town.forecast}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: 24-Hour Synoptic */}
      {activeTab === '24hr' && (
        <div className="space-y-4">
          {forecast24Hr ? (
            <div className="space-y-4">
              {/* General Headline Card */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider">
                    General Island Outlook
                  </span>
                  <div className="text-lg font-bold text-white mt-1">
                    {forecast24Hr.general?.forecast?.text || 'Fair'}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 font-mono">
                    Valid Period: {forecast24Hr.general?.validPeriod?.text || 'Next 24 Hours'}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-500 text-[10px]">Temperature</div>
                    <div className="text-white font-bold text-sm">
                      {forecast24Hr.general?.temperature?.low}°C – {forecast24Hr.general?.temperature?.high}°C
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-500 text-[10px]">Humidity</div>
                    <div className="text-white font-bold text-sm">
                      {forecast24Hr.general?.relativeHumidity?.low}% – {forecast24Hr.general?.relativeHumidity?.high}%
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-500 text-[10px]">Wind Speed</div>
                    <div className="text-white font-bold text-sm">
                      {forecast24Hr.general?.wind?.speed?.low} – {forecast24Hr.general?.wind?.speed?.high} km/h (
                      {forecast24Hr.general?.wind?.direction})
                    </div>
                  </div>
                </div>
              </div>

              {/* Day Periods Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {forecast24Hr.periods?.map((p, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-slate-200 border-b border-slate-800 pb-1.5 flex items-center justify-between">
                      <span>{p.timePeriod?.text || `Period ${idx + 1}`}</span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      {Object.entries(p.regions || {}).map(([reg, val]: any) => (
                        <div key={reg} className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-400 capitalize">{reg}:</span>
                          <span className="text-indigo-300 font-medium">{val.text || val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">Loading 24-hour forecast from Data.gov.sg...</div>
          )}
        </div>
      )}

      {/* Tab 3: 4-Day Outlook */}
      {activeTab === '4day' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {outlook4Day.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="font-bold text-sm text-white">{item.day}</span>
                  <Calendar className="w-4 h-4 text-slate-500" />
                </div>
                <div className="text-xs font-medium text-indigo-300 mb-3">
                  {item.forecast?.text || item.forecast?.summary || 'Partly Cloudy'}
                </div>
              </div>

              <div className="space-y-1.5 text-xs font-mono pt-3 border-t border-slate-800/80">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Thermometer className="w-3 h-3 text-rose-400" /> Temp:
                  </span>
                  <span className="text-white font-bold">
                    {item.temperature?.low}°C – {item.temperature?.high}°C
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-blue-400" /> Humidity:
                  </span>
                  <span className="text-slate-300">
                    {item.relativeHumidity?.low}% – {item.relativeHumidity?.high}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Wind className="w-3 h-3 text-teal-400" /> Wind:
                  </span>
                  <span className="text-slate-300">
                    {item.wind?.speed?.low}–{item.wind?.speed?.high} km/h ({item.wind?.direction})
                  </span>
                </div>
              </div>
            </div>
          ))}

          {outlook4Day.length === 0 && (
            <div className="col-span-full p-8 text-center text-xs text-slate-500">
              Loading 4-day meteorological outlook...
            </div>
          )}
        </div>
      )}
    </div>
  );
};
