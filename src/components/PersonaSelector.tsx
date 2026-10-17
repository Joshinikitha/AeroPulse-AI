import React from 'react';
import {
  HealthPersonaAssessment,
  HourlyDataPoint,
  MLForecastSummary,
  PersonaType,
  PollutantValues,
  WeatherConditions,
  CityLocation,
} from '../types';
import { HEALTH_PERSONAS, evaluatePersona } from '../utils/personaEngine';
import { IndiaLocationFilter } from './IndiaLocationFilter';
import {
  Users,
  Activity,
  HeartPulse,
  Baby,
  Dumbbell,
  ShieldAlert,
  Wind,
  Fan,
  CheckCircle2,
  Clock,
  Pill,
  Sparkles,
} from 'lucide-react';

interface PersonaSelectorProps {
  selectedPersona: PersonaType;
  onSelectPersona: (persona: PersonaType) => void;
  currentAQI: number;
  pollutants: PollutantValues;
  weather: WeatherConditions;
  forecast?: MLForecastSummary;
  hourlyTimeline?: HourlyDataPoint[];
  selectedState?: string;
  selectedDistrict?: string;
  onSelectLocation?: (city: CityLocation) => void;
  currentCity?: CityLocation;
}

export const PersonaSelector: React.FC<PersonaSelectorProps> = ({
  selectedPersona,
  onSelectPersona,
  currentAQI,
  pollutants,
  weather,
  forecast,
  hourlyTimeline = [],
  selectedState,
  selectedDistrict,
  onSelectLocation,
  currentCity,
}) => {
  const assessment: HealthPersonaAssessment = evaluatePersona(
    selectedPersona,
    currentAQI,
    pollutants,
    weather,
    forecast,
    hourlyTimeline
  );

  const getPersonaIcon = (id: PersonaType) => {
    switch (id) {
      case 'asthma':
        return <Activity className="w-4 h-4" />;
      case 'athlete':
        return <Dumbbell className="w-4 h-4" />;
      case 'senior':
        return <HeartPulse className="w-4 h-4" />;
      case 'children':
        return <Baby className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getGuidanceBadgeClass = (status: string) => {
    if (status.includes('Safe') || status.includes('None') || status.includes('Open')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (status.includes('Reduce') || status.includes('Low') || status.includes('Morning') || status.includes('Recommended')) {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }
    return 'bg-rose-50 text-rose-800 border-rose-200';
  };

  return (
    <div className="space-y-4">
      {/* Indian State & District Filter Bar for Persona Advisory */}
      {onSelectLocation && (
        <IndiaLocationFilter
          selectedState={selectedState}
          selectedDistrict={selectedDistrict}
          onSelectLocation={onSelectLocation}
          variant="section"
        />
      )}

      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
        {/* Header & Description */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-2xs">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Health Risk Persona Recommender
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                  <Sparkles className="w-3 h-3 text-sky-500" />
                  Adaptive Safety Engine
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Select your physiological exposure profile to adapt safety thresholds and clinical advisories
                {currentCity && (
                  <span className="font-semibold text-sky-700 ml-1">
                    • Active for {currentCity.name}{currentCity.admin1 ? `, ${currentCity.admin1}` : ''}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-1.5 self-start sm:self-auto bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60">
            <span className="text-slate-400">Current Ambient:</span>
            <span className="font-bold text-slate-800 font-mono">AQI {currentAQI}</span>
          </div>
        </div>

      {/* Persona Toggle Bar (Horizontal Scroll / Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {(Object.keys(HEALTH_PERSONAS) as PersonaType[]).map((type) => {
          const cfg = HEALTH_PERSONAS[type];
          const isSelected = selectedPersona === type;
          return (
            <button
              key={type}
              onClick={() => onSelectPersona(type)}
              className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                isSelected
                  ? 'border-sky-600 bg-sky-50/70 text-slate-900 ring-2 ring-sky-500/20 shadow-2xs'
                  : 'border-slate-200 bg-slate-50/40 hover:bg-slate-100/60 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-sky-600 text-white' : 'bg-white text-slate-500 border border-slate-200'
                  }`}
                >
                  {getPersonaIcon(type)}
                </div>
                <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-white/80 border border-slate-200 text-slate-500">
                  Limit: {cfg.aqiSafeLimit}
                </span>
              </div>
              <div>
                <span className="text-xs font-bold block leading-tight">{cfg.name}</span>
                <span className="text-[10px] text-slate-500 block truncate mt-0.5">{cfg.subtitle}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Persona Clinical Evaluation Card */}
      <div className="p-5 rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50/50 to-white space-y-5">
        {/* Risk Level Banner & Score Meter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/70">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${assessment.riskBadgeClass}`}>
                {assessment.currentRiskLevel} Risk Status
              </span>
              <span className="text-xs text-slate-500">
                for <strong className="text-slate-800">{assessment.config.name}</strong>
              </span>
            </div>
            <p className="text-xs text-slate-600 max-w-xl">
              {assessment.config.clinicalRationale}
            </p>
          </div>

          {/* Risk Score Gauge Meter */}
          <div className="sm:text-right bg-white p-3 rounded-xl border border-slate-200 shadow-2xs min-w-44">
            <div className="flex items-center justify-between sm:justify-end gap-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Vulnerability Index
              </span>
              <span className="text-base font-black font-mono" style={{ color: assessment.riskColor }}>
                {assessment.riskScore} / 100
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-1.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${assessment.riskScore}%`,
                  backgroundColor: assessment.riskColor,
                }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 mt-1">
              <span>Safe (&lt;{assessment.config.aqiSafeLimit})</span>
              <span>Hazard (&gt;{assessment.config.aqiHazardLimit})</span>
            </div>
          </div>
        </div>

        {/* Personalized Diagnostic Warning Callout */}
        <div
          className="p-4 rounded-xl border leading-relaxed text-xs font-medium"
          style={{
            backgroundColor: `${assessment.riskColor}0d`,
            borderColor: `${assessment.riskColor}33`,
            color: assessment.riskColor === '#10b981' ? '#065f46' : '#881337',
          }}
        >
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-xs uppercase tracking-wider mb-1">
                Personalized Exposure Diagnostic
              </p>
              <p>{assessment.personalizedWarning}</p>
            </div>
          </div>
        </div>

        {/* 4-Pillar Action Guidance Grid */}
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Wind className="w-3.5 h-3.5 text-sky-600" />
            Personalized Daily Activity & Protection Protocols
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Outdoor Workout</span>
                <Dumbbell className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className={`px-2 py-1 rounded text-xs font-bold border ${getGuidanceBadgeClass(assessment.activityGuidance.outdoorExercise)}`}>
                {assessment.activityGuidance.outdoorExercise}
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Protective Respirator</span>
                <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className={`px-2 py-1 rounded text-xs font-bold border ${getGuidanceBadgeClass(assessment.activityGuidance.maskRequirement)}`}>
                {assessment.activityGuidance.maskRequirement}
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Home Ventilation</span>
                <Wind className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className={`px-2 py-1 rounded text-xs font-bold border ${getGuidanceBadgeClass(assessment.activityGuidance.windowVentilation)}`}>
                {assessment.activityGuidance.windowVentilation}
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Air Purifier Fan</span>
                <Fan className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className={`px-2 py-1 rounded text-xs font-bold border ${getGuidanceBadgeClass(assessment.activityGuidance.airPurifierSetting)}`}>
                {assessment.activityGuidance.airPurifierSetting}
              </div>
            </div>
          </div>
        </div>

        {/* Action Protocol Checklist */}
        <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-sky-400" />
            Clinical Action Checklist for {assessment.config.name}
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {assessment.actionProtocol.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-sky-950 border border-sky-700 text-sky-400 flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-bold">
                  {idx + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Medication or Safe Window Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-600 border-t border-slate-100">
          {assessment.medicationAlert ? (
            <div className="flex items-center gap-2 text-amber-700 font-medium">
              <Pill className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{assessment.medicationAlert}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-500">
              <Activity className="w-4 h-4 text-slate-400" />
              <span>Standard maintenance health protocol active</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-sky-700 font-medium">
            <Clock className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span>{assessment.safeWindowRecommendation}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};
