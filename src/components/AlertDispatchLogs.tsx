import React, { useState } from 'react';
import {
  AirQualityPayload,
  NotificationChannel,
  SimulatedNotification,
  SmartAlert,
} from '../types';
import { SmartAlertsBanner } from './SmartAlertsBanner';
import {
  Bell,
  MessageSquare,
  Mail,
  Radio,
  Send,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Clock,
  Smartphone,
  ShieldAlert,
  Sparkles,
  Filter,
  Sliders,
} from 'lucide-react';

interface AlertDispatchLogsProps {
  data: AirQualityPayload;
  alerts?: SmartAlert[];
  onOpenSettings?: () => void;
}

export const AlertDispatchLogs: React.FC<AlertDispatchLogsProps> = ({
  data,
  alerts = [],
  onOpenSettings,
}) => {
  const [activeChannel, setActiveChannel] = useState<NotificationChannel | 'ALL'>('ALL');
  const [customToast, setCustomToast] = useState<string | null>(null);

  const initialNotifications: SimulatedNotification[] = [
    {
      id: 'notif-01',
      timestamp: '2 mins ago',
      channel: 'SMS',
      recipientGroup: 'Vulnerable Respiratory Cohort (n=1,240)',
      severity: data.current.aqi.overallAQI > 150 ? 'danger' : data.current.aqi.overallAQI > 100 ? 'warning' : 'info',
      title: `Air Safety Alert: AQI ${data.current.aqi.overallAQI} in ${data.city.name}`,
      body: `ALERT: Ambient fine particulate levels (${data.current.pollutants.pm25} µg/m³) exceed WHO guidelines. Please ensure your inhaler is accessible and avoid strenuous outdoor exercise.`,
      status: 'Delivered',
      aqiTrigger: data.current.aqi.overallAQI,
    },
    {
      id: 'notif-02',
      timestamp: '14 mins ago',
      channel: 'PUSH',
      recipientGroup: 'Mobile App Subscribers (Active Geofence: 15km)',
      severity: data.current.aqi.overallAQI > 120 ? 'warning' : 'info',
      title: `AeroPulse Forecast: ${data.mlForecast.trendDirection === 'improving' ? 'Air Clearing Expected' : 'Pollution Peak Ahead'}`,
      body: `ML models forecast peak AQI reaching ${data.mlForecast.predictedPeakAQI} around ${data.mlForecast.predictedPeakHour}. Cleanest window: ${data.mlForecast.safeWindowRecommendation}.`,
      status: 'Delivered',
      aqiTrigger: data.mlForecast.predictedPeakAQI,
    },
    {
      id: 'notif-03',
      timestamp: '42 mins ago',
      channel: 'EMAIL',
      recipientGroup: 'School Athletics & Physical Education Staff (n=112)',
      severity: data.current.aqi.overallAQI > 100 ? 'warning' : 'info',
      title: `School District Recess & Outdoor Sports Advisory`,
      body: `Daily atmospheric evaluation: Current AQI is ${data.current.aqi.overallAQI} (${data.current.aqi.category.label}). Limit student outdoor continuous exertion during afternoon peak hours.`,
      status: 'Sent',
      aqiTrigger: data.current.aqi.overallAQI,
    },
    {
      id: 'notif-04',
      timestamp: '1 hour ago',
      channel: 'BROADCAST',
      recipientGroup: 'Municipal Smart City Digital Signage & Sirens',
      severity: data.current.aqi.overallAQI > 200 ? 'critical' : data.current.aqi.overallAQI > 150 ? 'danger' : 'warning',
      title: `Public Transit Digital Signboard Broadcast`,
      body: `City Environmental Board: Air Quality Index: ${data.current.aqi.overallAQI} [${data.current.aqi.category.label}]. High-emission trucks restricted from inner ring road.`,
      status: 'Broadcasting',
      aqiTrigger: data.current.aqi.overallAQI,
    },
  ];

  const [notifications, setNotifications] = useState<SimulatedNotification[]>(initialNotifications);

  const handleTriggerManualBroadcast = () => {
    const newAlert: SimulatedNotification = {
      id: `manual-${Date.now()}`,
      timestamp: 'Just now',
      channel: 'BROADCAST',
      recipientGroup: 'Emergency Public Safety Broadcast Network',
      severity: data.current.aqi.overallAQI > 150 ? 'critical' : 'warning',
      title: `MANUAL EMERGENCY TEST: Citywide Environmental Health Advisory`,
      body: `Automated test trigger verified. Live sensor status: AQI ${data.current.aqi.overallAQI} (${data.current.aqi.category.label}). PM2.5: ${data.current.pollutants.pm25} µg/m³. All automated failover gateways operational.`,
      status: 'Broadcasting',
      aqiTrigger: data.current.aqi.overallAQI,
    };

    setNotifications([newAlert, ...notifications]);
    setCustomToast('Emergency broadcast alert simulated and added to log queue!');
    setTimeout(() => setCustomToast(null), 3500);
  };

  const filteredNotifications = notifications.filter((n) =>
    activeChannel === 'ALL' ? true : n.channel === activeChannel
  );

  const getChannelIcon = (channel: NotificationChannel) => {
    switch (channel) {
      case 'SMS':
        return <Smartphone className="w-3.5 h-3.5 text-emerald-600" />;
      case 'PUSH':
        return <Bell className="w-3.5 h-3.5 text-sky-600" />;
      case 'EMAIL':
        return <Mail className="w-3.5 h-3.5 text-indigo-600" />;
      case 'BROADCAST':
        return <Radio className="w-3.5 h-3.5 text-purple-600" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-rose-950 text-rose-200 border-rose-800';
      case 'danger':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'warning':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      default:
        return 'bg-sky-100 text-sky-800 border-sky-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Real-Time Safety Warnings & Health Exceedance Alerts (Dedicated in Notification Logs) */}
      {alerts && alerts.length > 0 ? (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <SmartAlertsBanner alerts={alerts} onOpenSettings={onOpenSettings} />
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">
              Zero active safe limit exceedance warnings. All monitored air parameters are within nominal thresholds.
            </span>
          </div>
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              <Sliders className="w-3.5 h-3.5" />
              Adjust Thresholds
            </button>
          )}
        </div>
      )}

      {/* 2. Multi-Channel Notification Dispatch Audit Trail */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 text-white flex items-center justify-center shadow-2xs">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Automated Alert & Multi-Channel Notification Dispatch Logs
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Response Loop
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Audit trail of automated SMS, push notifications, emails, and emergency broadcast sirens
            </p>
          </div>
        </div>

        <button
          onClick={handleTriggerManualBroadcast}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-2xs self-start sm:self-auto"
        >
          <Send className="w-3.5 h-3.5 text-sky-400" />
          Trigger Simulated Broadcast
        </button>
      </div>

      {/* Toast Notification */}
      {customToast && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{customToast}</span>
        </div>
      )}

      {/* Gateway Telemetry Status Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Dispatch Gateways</span>
          <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            4 Active Channels
          </span>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Gateway Latency</span>
          <span className="text-sm font-bold font-mono text-slate-800 mt-0.5">142 ms avg</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Cohorts</span>
          <span className="text-sm font-bold text-slate-800 mt-0.5">46,452 Citizens</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Auto-Trigger Rules</span>
          <span className="text-sm font-bold text-sky-700 mt-0.5">EPA NAAQS & WHO Active</span>
        </div>
      </div>

      {/* Channel Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">Filter Channel:</span>
          {(['ALL', 'SMS', 'PUSH', 'EMAIL', 'BROADCAST'] as (NotificationChannel | 'ALL')[]).map(
            (channel) => (
              <button
                key={channel}
                onClick={() => setActiveChannel(channel)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  activeChannel === channel
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {channel}
              </button>
            )
          )}
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Showing {filteredNotifications.length} log events
        </span>
      </div>

      {/* Notification Dispatch Feed */}
      <div className="space-y-3">
        {filteredNotifications.map((n) => (
          <div
            key={n.id}
            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-2.5 shadow-2xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200">
                  {getChannelIcon(n.channel)}
                </div>
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {n.channel}
                </span>
                <span className="text-xs font-bold text-slate-900">
                  {n.recipientGroup}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getSeverityBadge(n.severity)}`}>
                  {n.severity}
                </span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" />
                  {n.timestamp}
                </span>
              </div>
            </div>

            <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/70 text-xs space-y-1">
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span>{n.title}</span>
                <span className="font-mono text-[10px] text-slate-500 font-normal">
                  Trigger: AQI {n.aqiTrigger}
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed font-sans">
                {n.body}
              </p>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Status: <strong className="text-slate-700">{n.status}</strong></span>
              </span>
              <span className="font-mono text-slate-400 text-[10px]">
                Event ID: {n.id}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
  );
};
