import React from 'react';
import { AIAnalysisResult } from '../types';
import {
  Brain,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Wind,
  Flame,
  Clock,
} from 'lucide-react';

interface AIAdvisorCardProps {
  analysis?: AIAnalysisResult;
  isLoading: boolean;
  onRegenerate: () => void;
}

export const AIAdvisorCard: React.FC<AIAdvisorCardProps> = ({
  analysis,
  isLoading,
  onRegenerate,
}) => {
  if (!analysis && !isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs text-center py-8">
        <Brain className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <h4 className="text-sm font-bold text-slate-800">No AI Environmental Analysis Yet</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
          Generate an intelligent epidemiological diagnostic report based on live atmospheric sensor telemetry and ML forecasts.
        </p>
        <button
          onClick={onRegenerate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 shadow-sm transition-all"
        >
          <Sparkles className="w-4 h-4" />
          Generate AI Environmental Advisory
        </button>
      </div>
    );
  }

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'Severe':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'High':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Moderate':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <div className="bg-gradient-to-b from-white to-slate-50/60 rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-sky-100/40 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-2xs">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                AI Environmental Scientist & Public Health Advisory
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                {analysis?.isAiGenerated ? 'Gemini 3.8 Flash' : 'Expert System'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Deep clinical and meteorological synthesis generated from live sensor telemetry
            </p>
          </div>
        </div>

        <button
          onClick={onRegenerate}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition-colors self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-sky-600' : ''}`} />
          {isLoading ? 'Analyzing Telemetry...' : 'Refresh AI Diagnosis'}
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-3 border-sky-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-600">
            Synthesizing atmospheric chemistry and epidemiological health risks...
          </p>
        </div>
      ) : analysis ? (
        <div className="space-y-5 relative z-10">
          {/* Executive Summary */}
          <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-100/80">
            <h4 className="text-xs font-bold text-sky-950 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              Executive Atmospheric Diagnosis
            </h4>
            <p className="text-xs leading-relaxed text-sky-900 font-medium">
              {analysis.summary}
            </p>
          </div>

          {/* Primary Driver & Meteorological Impact Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <Flame className="w-4 h-4 text-orange-500" />
                Primary Pollution Origin & Driver
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {analysis.primaryDriver}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <Wind className="w-4 h-4 text-sky-500" />
                Atmospheric Dynamics & Boundary Layer
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {analysis.meteorologicalImpact}
              </p>
            </div>
          </div>

          {/* Vulnerable Groups Risk Assessment Matrix */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Demographic Exposure & Preventative Guidance Matrix
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(analysis.vulnerableGroups || []).map((group, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      {group.group}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getRiskBadge(group.riskLevel)}`}>
                      {group.riskLevel} Risk
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {group.guidance}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Preventative Steps */}
          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              Recommended Preventative Protocols
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {(analysis.actionSteps || []).map((step, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 48-Hour Forecast Verdict */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <strong className="text-slate-700">48h Outlook:</strong> {analysis.forecastVerdict}
            </span>
            <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
              Analyzed {new Date(analysis.generatedAt).toLocaleTimeString()}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
};
