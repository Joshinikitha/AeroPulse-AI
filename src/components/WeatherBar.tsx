import React from 'react';
import { WeatherConditions } from '../types';
import {
  Thermometer,
  Droplets,
  Wind,
  Gauge,
  Sun,
  Navigation,
  CloudFog,
} from 'lucide-react';

interface WeatherBarProps {
  weather: WeatherConditions;
}

export const WeatherBar: React.FC<WeatherBarProps> = ({ weather }) => {
  // Assess atmospheric dispersion efficiency
  const isStagnant = weather.windSpeed < 5 && weather.relativeHumidity > 70;
  const isHighDispersion = weather.windSpeed >= 15;

  const getWindDirectionLabel = (deg: number): string => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const idx = Math.round(deg / 22.5) % 16;
    return directions[idx] || 'N';
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-sky-600" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Meteorological Drivers of Pollution Dispersion
          </h3>
        </div>

        {/* Dispersion status pill */}
        <div className="flex items-center gap-2">
          {isStagnant ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">
              <CloudFog className="w-3.5 h-3.5 text-amber-600" />
              Thermal Inversion / Smog Stagnation Risk
            </span>
          ) : isHighDispersion ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <Wind className="w-3.5 h-3.5 text-emerald-600" />
              High Atmospheric Flushing
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
              Moderate Aerosol Dispersion
            </span>
          )}
        </div>
      </div>

      {/* Weather Metric Cards - Perfectly aligned across mobile, desktop & full screen */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3 mt-3.5">
        {/* Temperature */}
        <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center gap-3 min-w-0 shadow-2xs">
          <div className="w-9 h-9 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
            <Thermometer className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
              Temperature
            </span>
            <span className="text-sm sm:text-base font-bold text-slate-900 font-display block truncate">
              {weather.temperature}°C
            </span>
          </div>
        </div>

        {/* Humidity */}
        <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center gap-3 min-w-0 shadow-2xs">
          <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
            <Droplets className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
              Humidity
            </span>
            <span className="text-sm sm:text-base font-bold text-slate-900 font-display block truncate">
              {weather.relativeHumidity}%
            </span>
          </div>
        </div>

        {/* Wind Speed & Direction */}
        <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center gap-3 min-w-0 shadow-2xs">
          <div className="w-9 h-9 rounded-lg bg-cyan-100 text-cyan-600 flex items-center justify-center shrink-0">
            <Navigation
              className="w-5 h-5 transition-transform"
              style={{ transform: `rotate(${weather.windDirection}deg)` }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
              Wind Velocity
            </span>
            <span className="text-sm sm:text-base font-bold text-slate-900 font-display block truncate" title={`${weather.windSpeed} km/h (${getWindDirectionLabel(weather.windDirection)})`}>
              {weather.windSpeed} <span className="text-xs text-slate-500 font-normal">km/h</span> ({getWindDirectionLabel(weather.windDirection)})
            </span>
          </div>
        </div>

        {/* Atmospheric Pressure */}
        <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center gap-3 min-w-0 shadow-2xs">
          <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <Gauge className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
              Barometric Press.
            </span>
            <span className="text-sm sm:text-base font-bold text-slate-900 font-display block truncate">
              {weather.surfacePressure} <span className="text-xs text-slate-500 font-normal">hPa</span>
            </span>
          </div>
        </div>

        {/* UV Index */}
        <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center gap-3 min-w-0 col-span-2 sm:col-span-1 lg:col-span-2 xl:col-span-1 shadow-2xs">
          <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Sun className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
              Solar UV Index
            </span>
            <span className="text-sm sm:text-base font-bold text-slate-900 font-display block truncate">
              {weather.uvIndex ?? 3.5} <span className="text-xs text-slate-500 font-normal">UV</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
