import React, { useState, useMemo } from 'react';
import {
  HourlyDataPoint,
  WeatherConditions,
  WhatIfParameters,
  WhatIfSimulationResult,
} from '../types';
import {
  WHAT_IF_PRESETS,
  simulatePollutionScenario,
} from '../utils/whatIfSimulator';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  Sliders,
  RotateCcw,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Car,
  Wind,
  Thermometer,
  Droplets,
  Factory,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface WhatIfSimulatorProps {
  timeline: HourlyDataPoint[];
  weather: WeatherConditions;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  timeline,
  weather,
}) => {
  const initialParams: WhatIfParameters = useMemo(
    () => ({
      trafficDensity: 0,
      temperatureOffset: 0,
      windSpeed: Math.round(weather.windSpeed || 10),
      humidity: Math.round(weather.relativeHumidity || 55),
      industrialEmission: 0,
    }),
    [weather]
  );

  const [params, setParams] = useState<WhatIfParameters>(initialParams);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // Run the simulation in real time as parameters shift
  const simResult: WhatIfSimulationResult = useMemo(() => {
    return simulatePollutionScenario(timeline, weather, params);
  }, [timeline, weather, params]);

  const handleSliderChange = (key: keyof WhatIfParameters, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
    setActivePresetId(null);
  };

  const handleApplyPreset = (presetId: string) => {
    const p = WHAT_IF_PRESETS.find((x) => x.id === presetId);
    if (p) {
      setParams(p.params);
      setActivePresetId(presetId);
    }
  };

  const handleReset = () => {
    setParams(initialParams);
    setActivePresetId(null);
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-600 text-white flex items-center justify-center shadow-2xs">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Interactive "What-If" Pollution Simulator
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                Real-Time ML Recalculation
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Simulate how traffic policies, weather shifts, and industrial emissions reshape 24-hour pollution curves
            </p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset to Live Baseline
        </button>
      </div>

      {/* Scenario Presets Chips */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Quick Atmospheric & Urban Scenarios:
        </span>
        <div className="flex flex-wrap gap-2">
          {WHAT_IF_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleApplyPreset(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                activePresetId === p.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <span>{p.name}</span>
              <span className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded font-mono ${
                activePresetId === p.id ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-600'
              }`}>
                {p.badge}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50/70 border border-slate-200/80">
        {/* Slider 1: Traffic Density */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-indigo-500" />
              Traffic Density Index
            </span>
            <span
              className={`font-mono font-bold ${
                params.trafficDensity > 0
                  ? 'text-rose-600'
                  : params.trafficDensity < 0
                  ? 'text-emerald-600'
                  : 'text-slate-600'
              }`}
            >
              {params.trafficDensity > 0 ? `+${params.trafficDensity}%` : `${params.trafficDensity}%`}
            </span>
          </div>
          <input
            type="range"
            min="-50"
            max="100"
            step="5"
            value={params.trafficDensity}
            onChange={(e) => handleSliderChange('trafficDensity', Number(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>-50% (EV/Lockdown)</span>
            <span>0% (Baseline)</span>
            <span>+100% (Gridlock)</span>
          </div>
        </div>

        {/* Slider 2: Wind Speed */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5 text-sky-500" />
              Dispersion Wind Velocity
            </span>
            <span
              className={`font-mono font-bold ${
                params.windSpeed < 5
                  ? 'text-rose-600'
                  : params.windSpeed > 15
                  ? 'text-emerald-600'
                  : 'text-slate-600'
              }`}
            >
              {params.windSpeed} km/h
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="40"
            step="1"
            value={params.windSpeed}
            onChange={(e) => handleSliderChange('windSpeed', Number(e.target.value))}
            className="w-full accent-sky-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>1 km/h (Stagnant)</span>
            <span>10 km/h (Normal)</span>
            <span>40 km/h (Gale)</span>
          </div>
        </div>

        {/* Slider 3: Temperature Offset */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-orange-500" />
              Ambient Temperature Offset
            </span>
            <span
              className={`font-mono font-bold ${
                params.temperatureOffset > 0
                  ? 'text-orange-600'
                  : params.temperatureOffset < 0
                  ? 'text-sky-600'
                  : 'text-slate-600'
              }`}
            >
              {params.temperatureOffset > 0 ? `+${params.temperatureOffset}°C` : `${params.temperatureOffset}°C`}
            </span>
          </div>
          <input
            type="range"
            min="-10"
            max="15"
            step="1"
            value={params.temperatureOffset}
            onChange={(e) => handleSliderChange('temperatureOffset', Number(e.target.value))}
            className="w-full accent-orange-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>-10°C (Winter Night)</span>
            <span>0°C</span>
            <span>+15°C (Heatwave)</span>
          </div>
        </div>

        {/* Slider 4: Humidity */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-cyan-500" />
              Relative Humidity
            </span>
            <span className="font-mono font-bold text-slate-600">
              {params.humidity}%
            </span>
          </div>
          <input
            type="range"
            min="15"
            max="95"
            step="1"
            value={params.humidity}
            onChange={(e) => handleSliderChange('humidity', Number(e.target.value))}
            className="w-full accent-cyan-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>15% (Arid)</span>
            <span>50% (Comfort)</span>
            <span>95% (Fog/Hygroscopic)</span>
          </div>
        </div>

        {/* Slider 5: Industrial & Construction Activity */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2 md:col-span-2 lg:col-span-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Factory className="w-3.5 h-3.5 text-purple-500" />
              Industrial & Heavy Construction Emissions
            </span>
            <span
              className={`font-mono font-bold ${
                params.industrialEmission > 0
                  ? 'text-rose-600'
                  : params.industrialEmission < 0
                  ? 'text-emerald-600'
                  : 'text-slate-600'
              }`}
            >
              {params.industrialEmission > 0
                ? `+${params.industrialEmission}%`
                : `${params.industrialEmission}%`}
            </span>
          </div>
          <input
            type="range"
            min="-50"
            max="100"
            step="5"
            value={params.industrialEmission}
            onChange={(e) => handleSliderChange('industrialEmission', Number(e.target.value))}
            className="w-full accent-purple-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>-50% (Clean Manufacturing)</span>
            <span>0% (Standard Output)</span>
            <span>+100% (High Output Smog)</span>
          </div>
        </div>
      </div>

      {/* Real-Time Dual Comparison Chart */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-slate-400 rounded-full border-t border-dashed border-slate-500" />
              <span className="text-slate-600 font-medium">Live Telemetry Baseline AQI</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-indigo-600 rounded-full" />
              <span className="text-indigo-900 font-bold">Simulated "What-If" AQI</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">Projected 24h Impact:</span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                simResult.avgDeltaAQI > 0
                  ? 'bg-rose-100 text-rose-800'
                  : simResult.avgDeltaAQI < 0
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {simResult.avgDeltaAQI > 0 ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              {simResult.avgDeltaAQI > 0 ? `+${simResult.avgDeltaAQI}` : simResult.avgDeltaAQI} AQI Shift
            </span>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full bg-slate-50/50 rounded-xl p-3 border border-slate-200">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={simResult.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="simAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="displayTime" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 11 }} domain={[0, 'auto']} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg text-xs space-y-1 font-mono">
                        <div className="font-bold text-sky-400 font-sans border-b border-slate-800 pb-1">
                          Hour: {data.displayTime}
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400">Baseline AQI:</span>
                          <span className="font-bold text-slate-200">{data.baselineAQI}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-indigo-300">Simulated AQI:</span>
                          <span className="font-bold text-indigo-300">{data.simulatedAQI}</span>
                        </div>
                        <div className="flex justify-between gap-4 border-t border-slate-800 pt-1">
                          <span className="text-slate-400">AQI Delta:</span>
                          <span
                            className={`font-bold ${
                              data.deltaAQI > 0 ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            {data.deltaAQI > 0 ? `+${data.deltaAQI}` : data.deltaAQI}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={100} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Moderate Limit', fill: '#d97706', fontSize: 9 }} />
              <ReferenceLine y={150} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Unhealthy Limit', fill: '#dc2626', fontSize: 9 }} />

              {/* Baseline AQI Line */}
              <Line
                type="monotone"
                dataKey="baselineAQI"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                name="Baseline AQI"
              />

              {/* Simulated AQI Area + Line */}
              <Area
                type="monotone"
                dataKey="simulatedAQI"
                stroke="#4f46e5"
                strokeWidth={3}
                fill="url(#simAreaGrad)"
                dot={{ r: 2, fill: '#4f46e5' }}
                activeDot={{ r: 5, fill: '#4f46e5' }}
                name="Simulated AQI"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Simulation Diagnostic Insights Banner */}
      <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              Simulation Physics & Epidemiological Assessment
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400">
              Simulated Peak: <strong className="text-white font-mono">AQI {simResult.peakSimulatedAQI}</strong> ({simResult.peakSimulatedHour})
            </span>
            <span className="text-slate-400">
              Primary Driver: <strong className="text-sky-300">{simResult.dominantChangeFactor}</strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Atmospheric Chemistry Causation
            </span>
            <p className="leading-relaxed text-slate-300">
              {simResult.scientificExplanation}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Urban Policy & Health Implication
            </span>
            <p className="leading-relaxed text-slate-300">
              {simResult.mitigationImpact}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
