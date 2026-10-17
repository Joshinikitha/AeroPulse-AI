import React from 'react';
import { AQIResult, CityLocation, PollutantValues } from '../types';
import { ShieldAlert, AlertTriangle, CheckCircle, Info, Sparkles, Activity } from 'lucide-react';

interface AQIGaugeProps {
  aqiResult: AQIResult;
  city: CityLocation;
  pollutants: PollutantValues;
  updatedAt: string;
}

export const AQIGauge: React.FC<AQIGaugeProps> = ({
  aqiResult,
  city,
  pollutants,
  updatedAt,
}) => {
  const { overallAQI, category, dominantPollutant } = aqiResult;

  // Clamped AQI for SVG circular gauge angle (0 - 500 max range)
  const clampedAQI = Math.min(500, Math.max(0, overallAQI));
  
  // Angle for semi-circular arch: 180 degrees total (from -90 to +90 or 0 to 180)
  // Let's use SVG stroke-dasharray on an arc:
  // Radius = 85, Arc length = Math.PI * 85 ≈ 267
  const radius = 88;
  const strokeWidth = 14;
  const circumference = Math.PI * radius; // Half circle arc
  const progressRatio = Math.min(1, clampedAQI / 500);
  const strokeDashoffset = circumference * (1 - progressRatio);

  const getStatusIcon = (level: string) => {
    switch (level) {
      case 'good':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'moderate':
        return <Info className="w-5 h-5 text-amber-500" />;
      case 'sensitive':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'unhealthy':
      case 'very-unhealthy':
        return <AlertTriangle className="w-5 h-5 text-rose-500" />;
      default:
        return <ShieldAlert className="w-5 h-5 text-rose-800" />;
    }
  };

  const formattedDate = new Date(updatedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden">
      {/* Background soft ambient glow based on AQI color */}
      <div
        className="absolute -top-24 -right-24 w-60 h-60 rounded-full blur-3xl opacity-15 pointer-events-none transition-colors duration-700"
        style={{ backgroundColor: category.color }}
      />

      {/* Card Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5 text-sky-500" />
            Air Quality Index (EPA Standard)
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            {city.name}, <span className="font-normal text-slate-600">{city.country}</span>
          </h2>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Updated {formattedDate}
          </span>
        </div>
      </div>

      {/* SVG Semicircular Gauge Display */}
      <div className="flex flex-col items-center justify-center my-2 relative">
        <svg
          viewBox="0 0 220 135"
          className="w-64 max-w-full overflow-visible"
        >
          <defs>
            {/* Multi-stop atmospheric standard gradient */}
            <linearGradient id="aqiArcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="20%" stopColor="#eab308" />
              <stop offset="40%" stopColor="#f97316" />
              <stop offset="60%" stopColor="#ef4444" />
              <stop offset="80%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#881337" />
            </linearGradient>
          </defs>

          {/* Background Arc */}
          <path
            d="M 22 118 A 88 88 0 0 1 198 118"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Active Colored Arc */}
          <path
            d="M 22 118 A 88 88 0 0 1 198 118"
            fill="none"
            stroke="url(#aqiArcGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />

          {/* Indicator Dot at tip */}
          {clampedAQI > 0 && (
            <circle
              cx={110 - radius * Math.cos((progressRatio * Math.PI))}
              cy={118 - radius * Math.sin((progressRatio * Math.PI))}
              r="6.5"
              fill="#ffffff"
              stroke={category.color}
              strokeWidth="3.5"
              className="transition-all duration-1000 ease-out shadow-md"
            />
          )}

          {/* Scale Reference Tick Marks */}
          <text x="20" y="132" fontSize="9" fill="#94a3b8" fontWeight="600" textAnchor="middle">0</text>
          <text x="60" y="44" fontSize="9" fill="#94a3b8" fontWeight="600" textAnchor="middle">100</text>
          <text x="110" y="20" fontSize="9" fill="#94a3b8" fontWeight="600" textAnchor="middle">200</text>
          <text x="160" y="44" fontSize="9" fill="#94a3b8" fontWeight="600" textAnchor="middle">300</text>
          <text x="200" y="132" fontSize="9" fill="#94a3b8" fontWeight="600" textAnchor="middle">500</text>
        </svg>

        {/* Gauge Inner Numeric Readout */}
        <div className="absolute top-14 flex flex-col items-center text-center">
          <span className="text-5xl font-extrabold text-slate-900 tracking-tight font-display">
            {overallAQI}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
            US EPA AQI
          </span>
        </div>
      </div>

      {/* Category Pill & Primary Pollutant */}
      <div className="mt-2 flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
        <div className="flex items-center gap-2.5">
          {getStatusIcon(category.level)}
          <div>
            <div className="flex items-center gap-2">
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border shadow-2xs"
                style={{
                  backgroundColor: `${category.color}18`,
                  color: category.color,
                  borderColor: `${category.color}40`,
                }}
              >
                {category.label}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">
              {category.description}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0 border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-3.5 w-full sm:w-auto">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
            Primary Driver
          </span>
          <span className="text-sm font-bold text-slate-800 uppercase font-mono">
            {dominantPollutant} ({pollutants[dominantPollutant]} µg/m³)
          </span>
        </div>
      </div>

      {/* Immediate Health Cautionary Statement */}
      <div className="mt-3 flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-700">
        <Sparkles className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-900">Health Implication: </span>
          <span>{category.healthImplications} </span>
          <span className="text-slate-500 font-medium block mt-0.5">
            Recommendation: {category.cautionaryStatement}
          </span>
        </div>
      </div>
    </div>
  );
};
