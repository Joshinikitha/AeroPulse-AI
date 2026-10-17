import React, { useState } from 'react';
import { X, Sliders, Bell, Check, ShieldCheck } from 'lucide-react';

interface AlertSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (settings: AlertRuleConfig) => void;
}

export interface AlertRuleConfig {
  aqiWarningThreshold: number;
  pm25WarningThreshold: number;
  enableSound: boolean;
  enableForecastDeteriorationAlert: boolean;
  demographicProfile: 'standard' | 'sensitive-respiratory' | 'pediatric' | 'athletic';
}

export const AlertSettingsModal: React.FC<AlertSettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [config, setConfig] = useState<AlertRuleConfig>({
    aqiWarningThreshold: 100,
    pm25WarningThreshold: 35.4,
    enableSound: false,
    enableForecastDeteriorationAlert: true,
    demographicProfile: 'standard',
  });
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    if (onSave) onSave(config);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Custom Alert Threshold Rules
              </h3>
              <p className="text-xs text-slate-500">
                Configure automated safe-limit triggers & sensitivity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          {/* AQI Trigger Threshold Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800">
                Trigger AQI Warning Banner When Exceeding:
              </label>
              <span className="font-mono font-bold text-sky-600 text-sm">
                AQI {config.aqiWarningThreshold}
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="250"
              step="5"
              value={config.aqiWarningThreshold}
              onChange={(e) =>
                setConfig({ ...config, aqiWarningThreshold: Number(e.target.value) })
              }
              className="w-full accent-sky-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>50 (Strict WHO)</span>
              <span>100 (EPA Moderate)</span>
              <span>150 (Sensitive)</span>
              <span>200+ (Hazardous)</span>
            </div>
          </div>

          {/* PM2.5 Trigger Threshold Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800">
                Fine Particulate (PM2.5) Safety Limit:
              </label>
              <span className="font-mono font-bold text-sky-600 text-sm">
                {config.pm25WarningThreshold} µg/m³
              </span>
            </div>
            <input
              type="range"
              min="15"
              max="100"
              step="1"
              value={config.pm25WarningThreshold}
              onChange={(e) =>
                setConfig({ ...config, pm25WarningThreshold: Number(e.target.value) })
              }
              className="w-full accent-sky-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>15 (WHO 24h)</span>
              <span>35.4 (EPA NAAQS)</span>
              <span>55.4 (Unhealthy)</span>
            </div>
          </div>

          {/* Demographic Exposure Profile */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 block">
              Personalized Risk Vulnerability Profile:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'standard', label: 'General Public', desc: 'Standard WHO/EPA thresholds' },
                { id: 'sensitive-respiratory', label: 'Asthma / Respiratory', desc: 'Heightened sensitivity (+25%)' },
                { id: 'pediatric', label: 'Children & Elderly', desc: 'Strict early threshold warnings' },
                { id: 'athletic', label: 'Outdoor Athlete', desc: 'Focus on clean training windows' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setConfig({ ...config, demographicProfile: p.id as any })}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    config.demographicProfile === p.id
                      ? 'border-sky-500 bg-sky-50 text-sky-950 ring-1 ring-sky-300'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <p className="font-bold text-xs">{p.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Machine Learning Forecast Deterioration Alert Toggle */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 block">
                Predictive Spike Warning
              </span>
              <span className="text-[11px] text-slate-500 block">
                Trigger alerts if ML models forecast &gt;20 point AQI jump in 24h
              </span>
            </div>
            <input
              type="checkbox"
              checked={config.enableForecastDeteriorationAlert}
              onChange={(e) =>
                setConfig({ ...config, enableForecastDeteriorationAlert: e.target.checked })
              }
              className="w-4 h-4 accent-sky-600 rounded cursor-pointer"
            />
          </div>
        </div>

        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-sky-600 text-white font-semibold hover:bg-sky-500 transition-colors shadow-2xs"
          >
            {isSaved ? <Check className="w-4 h-4 text-white" /> : <ShieldCheck className="w-4 h-4" />}
            {isSaved ? 'Rules Applied!' : 'Save Rules'}
          </button>
        </div>
      </div>
    </div>
  );
};
