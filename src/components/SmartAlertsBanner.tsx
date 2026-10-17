import React, { useState } from 'react';
import { SmartAlert } from '../types';
import {
  AlertTriangle,
  ShieldAlert,
  AlertCircle,
  Info,
  ChevronRight,
  Sliders,
  CheckCircle2,
  X,
  Bell,
  Users,
} from 'lucide-react';

interface SmartAlertsBannerProps {
  alerts: SmartAlert[];
  onOpenSettings?: () => void;
}

export const SmartAlertsBanner: React.FC<SmartAlertsBannerProps> = ({
  alerts,
  onOpenSettings,
}) => {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const activeAlerts = alerts.filter((a) => !dismissedIds.includes(a.id));

  if (activeAlerts.length === 0) return null;

  const getAlertStyles = (severity: SmartAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return {
          container: 'bg-rose-950 text-rose-100 border-rose-800 shadow-md',
          badge: 'bg-rose-900 text-rose-200 border-rose-700',
          icon: <ShieldAlert className="w-5 h-5 text-rose-300 shrink-0" />,
          button: 'text-rose-300 hover:text-white',
        };
      case 'danger':
        return {
          container: 'bg-rose-50 text-rose-950 border-rose-200 shadow-xs',
          badge: 'bg-rose-100 text-rose-800 border-rose-300',
          icon: <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />,
          button: 'text-rose-600 hover:text-rose-900',
        };
      case 'warning':
        return {
          container: 'bg-amber-50 text-amber-950 border-amber-200 shadow-xs',
          badge: 'bg-amber-100 text-amber-900 border-amber-300',
          icon: <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />,
          button: 'text-amber-700 hover:text-amber-900',
        };
      default:
        return {
          container: 'bg-sky-50 text-sky-950 border-sky-200 shadow-xs',
          badge: 'bg-sky-100 text-sky-900 border-sky-300',
          icon: <Info className="w-5 h-5 text-sky-600 shrink-0" />,
          button: 'text-sky-700 hover:text-sky-900',
        };
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-slate-700" />
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Automated Health Alerts & Safe Limit Warnings ({activeAlerts.length})
          </h3>
        </div>
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1"
          >
            <Sliders className="w-3.5 h-3.5" />
            Adjust Threshold Rules
          </button>
        )}
      </div>

      {activeAlerts.map((alert) => {
        const style = getAlertStyles(alert.severity);

        return (
          <div
            key={alert.id}
            className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start justify-between gap-3 ${style.container}`}
          >
            <div className="flex items-start gap-3 w-full">
              <div className="mt-0.5">{style.icon}</div>
              <div className="space-y-1 w-full">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-bold text-sm tracking-tight">{alert.title}</h4>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${style.badge}`}>
                    {alert.severity}
                  </span>
                  <span className="text-[11px] opacity-70 font-mono ml-auto">
                    {alert.timestamp}
                  </span>
                </div>

                <p className="text-xs leading-relaxed opacity-90">
                  {alert.message}
                </p>

                {/* Target Demographics */}
                {alert.targetGroups.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-semibold opacity-75 flex items-center gap-1">
                      <Users className="w-3 h-3" /> Vulnerable:
                    </span>
                    {alert.targetGroups.map((group) => (
                      <span
                        key={group}
                        className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[11px] font-medium"
                      >
                        {group}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actionable Recommendation */}
                <div className="pt-1.5 text-xs font-medium flex items-baseline gap-1.5">
                  <span className="font-bold underline decoration-dotted">Recommended Action:</span>
                  <span>{alert.recommendation}</span>
                </div>
              </div>
            </div>

            {/* Dismiss Button */}
            <button
              onClick={() => setDismissedIds((prev) => [...prev, alert.id])}
              className={`p-1 rounded-md transition-colors shrink-0 ${style.button}`}
              title="Acknowledge and dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
