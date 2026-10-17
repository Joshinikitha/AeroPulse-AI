import React, { useState } from 'react';
import {
  HourlyDataPoint,
  MLForecastSummary,
  CityLocation,
} from '../types';
import { IndiaLocationFilter } from './IndiaLocationFilter';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Cpu,
  BarChart3,
  Calendar,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';
import { getAQICategory } from '../utils/aqiCalculator';

interface ForecastSectionProps {
  timeline: HourlyDataPoint[];
  summary: MLForecastSummary;
  selectedState?: string;
  selectedDistrict?: string;
  onSelectLocation?: (city: CityLocation) => void;
  currentCity?: CityLocation;
}

type ViewMode = 'aqi' | 'particulates' | 'gases';

export const ForecastSection: React.FC<ForecastSectionProps> = ({
  timeline,
  summary,
  selectedState,
  selectedDistrict,
  onSelectLocation,
  currentCity,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('aqi');
  const [forecastHorizon, setForecastHorizon] = useState<24 | 48>(48);

  // Filter timeline according to chosen horizon
  // Timeline has ~13 past points + 48 future points
  const displayData = timeline.filter((pt) => {
    if (!pt.isForecast) return true;
    const futureIndex = timeline.filter((t) => t.isForecast).indexOf(pt);
    return futureIndex < forecastHorizon;
  });

  const isDeteriorating = summary.trendDirection === 'deteriorating';
  const isImproving = summary.trendDirection === 'improving';

  const cat24 = getAQICategory(summary.target24hAQI);
  const cat48 = getAQICategory(summary.target48hAQI);

  // Custom chart tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as HourlyDataPoint;
      const cat = getAQICategory(data.aqi);

      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs min-w-[200px]">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700/80 mb-2">
            <span className="font-semibold text-slate-300 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              {data.displayTime}
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                data.isForecast ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'bg-slate-700 text-slate-300'
              }`}
            >
              {data.isForecast ? 'ML Prediction' : 'Historical Sensor'}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">AQI Index:</span>
              <span className="font-bold font-mono text-sm" style={{ color: cat.color }}>
                {data.aqi} ({cat.label})
              </span>
            </div>

            {data.confidenceLower !== undefined && data.confidenceUpper !== undefined && (
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>95% Confidence:</span>
                <span className="font-mono text-slate-300">
                  {data.confidenceLower} - {data.confidenceUpper}
                </span>
              </div>
            )}

            <div className="border-t border-slate-800 pt-1.5 mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">PM2.5:</span>
                <span className="font-mono font-semibold text-slate-200">{data.pm25} µg/m³</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">PM10:</span>
                <span className="font-mono font-semibold text-slate-200">{data.pm10} µg/m³</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">NO₂:</span>
                <span className="font-mono font-semibold text-slate-200">{data.no2} µg/m³</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">O₃:</span>
                <span className="font-mono font-semibold text-slate-200">{data.o3} µg/m³</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Indian State & District Filter Bar for ML Forecasting */}
      {onSelectLocation && (
        <IndiaLocationFilter
          selectedState={selectedState}
          selectedDistrict={selectedDistrict}
          onSelectLocation={onSelectLocation}
          variant="section"
        />
      )}

      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
        {/* Module Title & Target Cards */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-sky-600" />
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Machine Learning Pollution Forecasting Engine
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                48-Hour Continuous Horizon
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Autoregressive Gradient Boosted Ensemble factoring diurnal rush emissions, planetary boundary layer dynamics, and wind dispersion
              {currentCity && (
                <span className="font-semibold text-sky-700 ml-1">
                  • Forecasting for {currentCity.name}{currentCity.admin1 ? `, ${currentCity.admin1}` : ''}
                </span>
              )}
            </p>
          </div>

        {/* Forecast Horizon Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Horizon:</span>
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs font-semibold">
            <button
              onClick={() => setForecastHorizon(24)}
              className={`px-3 py-1 rounded-md transition-all ${
                forecastHorizon === 24
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              24 Hours
            </button>
            <button
              onClick={() => setForecastHorizon(48)}
              className={`px-3 py-1 rounded-md transition-all ${
                forecastHorizon === 48
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              48 Hours
            </button>
          </div>
        </div>
      </div>

      {/* 24h & 48h Forecast Targets & Model Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 24-Hour Target Card */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-sky-500" />
              24-Hour Prediction
            </span>
            <span
              className="px-2 py-0.5 rounded text-[11px] font-bold uppercase"
              style={{
                backgroundColor: `${cat24.color}15`,
                color: cat24.color,
              }}
            >
              {cat24.label}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-display">
              {summary.target24hAQI}
            </span>
            <span className="text-xs font-semibold text-slate-400">AQI</span>
            <span
              className={`inline-flex items-center text-xs font-bold ml-auto ${
                isDeteriorating ? 'text-rose-600' : isImproving ? 'text-emerald-600' : 'text-slate-500'
              }`}
            >
              {isDeteriorating ? (
                <>
                  <TrendingUp className="w-3.5 h-3.5 mr-0.5" />+{summary.trendDelta}
                </>
              ) : isImproving ? (
                <>
                  <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                  {summary.trendDelta}
                </>
              ) : (
                'Stable'
              )}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Projected trajectory: <strong className="text-slate-700 capitalize">{summary.trendDirection}</strong> over 24h
          </p>
        </div>

        {/* 48-Hour Target Card */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              48-Hour Prediction
            </span>
            <span
              className="px-2 py-0.5 rounded text-[11px] font-bold uppercase"
              style={{
                backgroundColor: `${cat48.color}15`,
                color: cat48.color,
              }}
            >
              {cat48.label}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-display">
              {summary.target48hAQI}
            </span>
            <span className="text-xs font-semibold text-slate-400">AQI</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Two-day extended meteorological projection
          </p>
        </div>

        {/* Model Accuracy & Validation Metrics */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            <span className="flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              Model Accuracy
            </span>
            <span className="text-[11px] font-mono text-emerald-600 font-bold">
              R² = {summary.r2}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div className="bg-white p-2 rounded-lg border border-slate-200/60">
              <span className="text-[10px] text-slate-400 font-medium block">RMSE Error</span>
              <span className="text-sm font-bold text-slate-800 font-mono">
                {summary.rmse} <span className="text-[10px] text-slate-400 font-normal">µg/m³</span>
              </span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-200/60">
              <span className="text-[10px] text-slate-400 font-medium block">MAE Error</span>
              <span className="text-sm font-bold text-slate-800 font-mono">
                {summary.mae} <span className="text-[10px] text-slate-400 font-normal">µg/m³</span>
              </span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5">
            Evaluated against standard EPA test ground monitors
          </p>
        </div>

        {/* Cleanest Window Recommendation */}
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Cleanest Window
            </span>
            <p className="text-xs text-emerald-800 mt-1.5 font-medium leading-relaxed">
              {summary.safeWindowRecommendation}
            </p>
          </div>
          <div className="mt-2 text-[11px] text-emerald-700/80">
            Peak forecast: <strong>{summary.predictedPeakHour}</strong> (AQI {summary.predictedPeakAQI})
          </div>
        </div>
      </div>

      {/* Chart View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Interactive Forecast Visualizer
          </span>
        </div>

        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs font-semibold">
          <button
            onClick={() => setViewMode('aqi')}
            className={`px-3 py-1 rounded-md transition-all ${
              viewMode === 'aqi'
                ? 'bg-white text-sky-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            AQI & 95% Confidence Band
          </button>
          <button
            onClick={() => setViewMode('particulates')}
            className={`px-3 py-1 rounded-md transition-all ${
              viewMode === 'particulates'
                ? 'bg-white text-sky-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            PM2.5 & PM10 Particulates
          </button>
          <button
            onClick={() => setViewMode('gases')}
            className={`px-3 py-1 rounded-md transition-all ${
              viewMode === 'gases'
                ? 'bg-white text-sky-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Gaseous Pollutants (NO₂, O₃, SO₂)
          </button>
        </div>
      </div>

      {/* Recharts Visualization */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={displayData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="aqiAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0284c7" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#0284c7" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="confidenceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.05} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

            <XAxis
              dataKey="displayTime"
              stroke="#94a3b8"
              fontSize={10}
              tickLine={false}
              interval={Math.max(1, Math.floor(displayData.length / 8))}
            />
            <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />

            <Tooltip content={<CustomTooltip />} />

            {/* EPA Threshold Lines */}
            {viewMode === 'aqi' && (
              <>
                <ReferenceLine y={50} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Good (50)', fill: '#10b981', fontSize: 9, position: 'right' }} />
                <ReferenceLine y={100} stroke="#eab308" strokeDasharray="4 4" label={{ value: 'Moderate (100)', fill: '#eab308', fontSize: 9, position: 'right' }} />
                <ReferenceLine y={150} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Unhealthy (150)', fill: '#ef4444', fontSize: 9, position: 'right' }} />
              </>
            )}

            {/* View Mode 1: AQI & Confidence Band */}
            {viewMode === 'aqi' && (
              <>
                <Area
                  type="monotone"
                  dataKey="confidenceUpper"
                  stroke="none"
                  fill="url(#confidenceGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="aqi"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  fill="url(#aqiAreaGrad)"
                />
              </>
            )}

            {/* View Mode 2: PM2.5 & PM10 */}
            {viewMode === 'particulates' && (
              <>
                <Line
                  type="monotone"
                  dataKey="pm25"
                  name="PM2.5"
                  stroke="#f97316"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="pm10"
                  name="PM10"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                />
              </>
            )}

            {/* View Mode 3: NO2, O3, SO2 */}
            {viewMode === 'gases' && (
              <>
                <Line
                  type="monotone"
                  dataKey="no2"
                  name="NO₂"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="o3"
                  name="O₃"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="so2"
                  name="SO₂"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Feature Importance Section */}
      <div className="pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-slate-500" />
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Machine Learning Atmospheric Feature Importance (Covariates)
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {summary.featureImportance.map((feat) => (
            <div
              key={feat.feature}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200/60"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-800 truncate" title={feat.feature}>
                  {feat.feature}
                </span>
                <span className="text-xs font-bold font-mono text-sky-600">
                  {feat.importance}%
                </span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-sky-600 h-full rounded-full"
                  style={{ width: `${feat.importance * 2.5}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-2 line-clamp-2">
                {feat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
};
