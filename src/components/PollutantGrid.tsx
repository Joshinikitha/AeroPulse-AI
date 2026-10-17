import React from 'react';
import { AQIResult, PollutantValues } from '../types';
import { WHO_GUIDELINES, getAQICategory } from '../utils/aqiCalculator';
import { AlertCircle, Check, Info } from 'lucide-react';

interface PollutantGridProps {
  pollutants: PollutantValues;
  aqiResult: AQIResult;
}

interface PollutantMeta {
  key: keyof PollutantValues;
  name: string;
  chemical: string;
  source: string;
  healthEffect: string;
  whoLimit: number;
}

const POLLUTANT_METAS: PollutantMeta[] = [
  {
    key: 'pm25',
    name: 'Fine Particulate Matter',
    chemical: 'PM2.5',
    source: 'Vehicle combustion, power stations, wildfire smoke',
    healthEffect: 'Bypasses respiratory cilia and penetrates bloodstream directly',
    whoLimit: 15,
  },
  {
    key: 'pm10',
    name: 'Inhalable Particulates',
    chemical: 'PM10',
    source: 'Construction dust, road turbulence, industrial crushing',
    healthEffect: 'Irritates bronchi and upper respiratory membranes',
    whoLimit: 45,
  },
  {
    key: 'no2',
    name: 'Nitrogen Dioxide',
    chemical: 'NO₂',
    source: 'Diesel engines, thermal power plants, heating furnaces',
    healthEffect: 'Inflames respiratory airways and exacerbates asthma',
    whoLimit: 25,
  },
  {
    key: 'o3',
    name: 'Ground-level Ozone',
    chemical: 'O₃',
    source: 'Photochemical reaction between sunlight, NOx, and VOCs',
    healthEffect: 'Causes airway constriction, coughing, and reduced lung capacity',
    whoLimit: 100,
  },
  {
    key: 'so2',
    name: 'Sulfur Dioxide',
    chemical: 'SO₂',
    source: 'Fossil fuel combustion, metal smelting, refineries',
    healthEffect: 'Triggers bronchoconstriction and throat irritation',
    whoLimit: 40,
  },
  {
    key: 'co',
    name: 'Carbon Monoxide',
    chemical: 'CO',
    source: 'Incomplete combustion in engines and biomass burning',
    healthEffect: 'Reduces oxygen-carrying capacity of hemoglobin in blood',
    whoLimit: 4000,
  },
];

export const PollutantGrid: React.FC<PollutantGridProps> = ({
  pollutants,
  aqiResult,
}) => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Real-Time Pollutant Concentrations & Sub-Indices
          </h3>
          <p className="text-xs text-slate-500">
            Measured in micrograms per cubic meter (µg/m³), benchmarked against WHO 2021 air quality standards
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> &lt; WHO limit
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ml-2" /> 1-2x
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ml-2" /> &gt; 2x limit
        </div>
      </div>

      {/* Grid of 6 Criteria Pollutants */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {POLLUTANT_METAS.map((item) => {
          const val = pollutants[item.key];
          const subIndex = aqiResult.subIndices[item.key] || 0;
          const subCat = getAQICategory(subIndex);
          const ratio = Math.round((val / item.whoLimit) * 10) / 10;
          const isExceeded = ratio > 1;
          const isDominant = aqiResult.dominantPollutant === item.key;

          // Clamped percentage for progress bar (up to 300% of WHO limit)
          const barPercent = Math.min(100, Math.round((val / (item.whoLimit * 2.5)) * 100));

          return (
            <div
              key={item.key}
              className={`rounded-xl p-4 border transition-all relative ${
                isDominant
                  ? 'border-sky-300 bg-sky-50/40 shadow-xs ring-1 ring-sky-200'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
              }`}
            >
              {/* Header with Chemical & Sub-index */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg font-bold text-slate-900 font-display">
                      {item.chemical}
                    </span>
                    {isDominant && (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-sky-600 text-white uppercase tracking-wider">
                        Dominant
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium line-clamp-1">
                    {item.name}
                  </p>
                </div>

                <div className="text-right">
                  <span
                    className="inline-block px-2 py-0.5 rounded-md text-xs font-bold border"
                    style={{
                      backgroundColor: `${subCat.color}15`,
                      color: subCat.color,
                      borderColor: `${subCat.color}35`,
                    }}
                  >
                    AQI {subIndex}
                  </span>
                </div>
              </div>

              {/* Main Numeric Metric */}
              <div className="my-3 flex items-baseline justify-between">
                <div>
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-display">
                    {val}
                  </span>
                  <span className="text-xs font-medium text-slate-500 ml-1.5">
                    µg/m³
                  </span>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                      ratio > 2
                        ? 'bg-rose-100 text-rose-700'
                        : ratio > 1
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {isExceeded ? (
                      <>
                        <AlertCircle className="w-3 h-3" />
                        {ratio}x WHO limit
                      </>
                    ) : (
                      <>
                        <Check className="w-3 h-3" />
                        Within WHO limit
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Visual Benchmark Bar */}
              <div className="space-y-1">
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${barPercent}%`,
                      backgroundColor: subCat.color,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0</span>
                  <span>WHO guideline: {item.whoLimit} µg/m³</span>
                </div>
              </div>

              {/* Source & Impact Note */}
              <div className="mt-3 pt-2.5 border-t border-slate-200/60 text-[11px] text-slate-500">
                <span className="font-semibold text-slate-600">Source: </span>
                {item.source}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
