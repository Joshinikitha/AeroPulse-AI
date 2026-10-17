import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AirQualityPayload,
  CityLocation,
  PersonaType,
} from './types';
import { Header, DashboardTab } from './components/Header';
import { AQIGauge } from './components/AQIGauge';
import { PollutantGrid } from './components/PollutantGrid';
import { WeatherBar } from './components/WeatherBar';
import { ForecastSection } from './components/ForecastSection';
import { AIAdvisorCard } from './components/AIAdvisorCard';
import { PersonaSelector } from './components/PersonaSelector';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { AlertDispatchLogs } from './components/AlertDispatchLogs';
import { PrintReportModal } from './components/PrintReportModal';
import { AlertSettingsModal, AlertRuleConfig } from './components/AlertSettingsModal';
import { ChatContainer } from './components/chat/ChatContainer';
import { IndiaTamilNaduMap } from './components/IndiaTamilNaduMap';
import { Globe3DVisualizer } from './components/Globe3DVisualizer';
import { Unified3DGlobeMap } from './components/Unified3DGlobeMap';
import { PollutionHotspotsDashboard } from './components/PollutionHotspotsDashboard';
import { IndiaAirQualityAnalyticsChart } from './components/IndiaAirQualityAnalyticsChart';
import { evaluatePersona } from './utils/personaEngine';
import { INDIAN_STATES } from './data/indianLocations';
import {
  AlertCircle,
  Wind,
  HeartPulse,
  Sliders,
  BarChart3,
  Radio,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Layers,
  Globe,
} from 'lucide-react';

const INITIAL_CITY: CityLocation = {
  name: 'Chennai',
  country: 'India',
  admin1: 'Tamil Nadu',
  latitude: 13.0827,
  longitude: 80.2707,
};

export default function App() {
  const [currentCity, setCurrentCity] = useState<CityLocation>(INITIAL_CITY);
  const [data, setData] = useState<AirQualityPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active View Tab - default to Live Sensor Dashboard as main interface
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  // Sub-view for Map: 3D Globe Visualizer vs Street-Level Sensor Network
  const [mapSubView, setMapSubView] = useState<'3d' | '2d'>('3d');
  // Coordinate focus for deep street-level zoom dives from 3D Globe
  const [streetFocusLocation, setStreetFocusLocation] = useState<{
    lat: number;
    lon: number;
    zoom: number;
    name?: string;
  } | null>(null);

  const handleZoomToStreetLevel = (lat: number, lon: number, zoom = 16, name = '') => {
    setStreetFocusLocation({ lat, lon, zoom, name });
    setMapSubView('2d');
  };

  // Theme state with local persistence
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem('aeropulse_theme') === 'dark';
    } catch {
      return false;
    }
  });

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('aeropulse_theme', next ? 'dark' : 'light');
      } catch (e) {}
      return next;
    });
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Selected Health Risk Persona
  const [selectedPersona, setSelectedPersona] = useState<PersonaType>('general');

  // Indian State & District Filter State
  const [selectedState, setSelectedState] = useState<string>('Tamil Nadu');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Chennai');

  // AI analysis state
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Modals state
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isAlertSettingsOpen, setIsAlertSettingsOpen] = useState(false);

  // Custom alert rules
  const [alertConfig, setAlertConfig] = useState<AlertRuleConfig>({
    aqiWarningThreshold: 100,
    pm25WarningThreshold: 35.4,
    enableSound: false,
    enableForecastDeteriorationAlert: true,
    demographicProfile: 'standard',
  });

  // Fetch Environmental Data
  const fetchAirQuality = useCallback(async (city: CityLocation) => {
    setIsLoading(true);
    setError(null);

    try {
      const url = `/api/air-quality?lat=${city.latitude}&lon=${city.longitude}&city=${encodeURIComponent(
        city.name
      )}&country=${encodeURIComponent(city.country)}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to load data (status ${res.status})`);
      }
      const payload: AirQualityPayload = await res.json();
      setData(payload);
      setCurrentCity(city);

      // Automatically sync Indian state and district dropdowns if applicable
      if (city.admin1) {
        const foundState = INDIAN_STATES.find(
          (s) =>
            s.name.toLowerCase() === city.admin1?.toLowerCase() ||
            s.code.toLowerCase() === city.admin1?.toLowerCase()
        );
        if (foundState) {
          setSelectedState(foundState.name);
          const foundDist = foundState.districts.find(
            (d) =>
              d.name.toLowerCase().includes(city.name.toLowerCase()) ||
              city.name.toLowerCase().includes(d.name.toLowerCase())
          );
          if (foundDist) {
            setSelectedDistrict(foundDist.name);
          }
        }
      }

      // Trigger AI advisory synthesis automatically
      generateAiAnalysis(payload);
    } catch (err: any) {
      console.error('Error fetching air quality:', err);
      setError(err.message || 'Unable to load real-time air telemetry.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handler for state and district selection
  const handleSelectIndianLocation = useCallback(
    (city: CityLocation) => {
      if (city.admin1) {
        setSelectedState(city.admin1);
      }
      setSelectedDistrict(city.name);
      fetchAirQuality(city);
    },
    [fetchAirQuality]
  );

  // Quick switch from state analytics chart
  const handleSelectStateFromChart = useCallback(
    (stateName: string) => {
      const foundState = INDIAN_STATES.find(
        (s) => s.name.toLowerCase() === stateName.toLowerCase()
      );
      if (foundState && foundState.districts[0]) {
        const d = foundState.districts[0];
        handleSelectIndianLocation({
          name: d.name,
          admin1: foundState.name,
          country: 'India',
          latitude: d.latitude,
          longitude: d.longitude,
        });
      }
    },
    [handleSelectIndianLocation]
  );

  // Fetch AI Environmental Analysis
  const generateAiAnalysis = async (currentData?: AirQualityPayload) => {
    const target = currentData || data;
    if (!target) return;

    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: target.city,
          currentAQI: target.current.aqi.overallAQI,
          dominantPollutant: target.current.aqi.dominantPollutant,
          pollutants: target.current.pollutants,
          weather: target.current.weather,
          forecast: target.mlForecast,
        }),
      });

      if (res.ok) {
        const aiResult = await res.json();
        setData((prev) => (prev ? { ...prev, aiAnalysis: aiResult } : null));
      }
    } catch (err) {
      console.warn('AI analysis request warning:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAirQuality(INITIAL_CITY);
  }, [fetchAirQuality]);

  // Geolocation trigger
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const geoRes = await fetch(`/api/geocode?q=${latitude.toFixed(2)},${longitude.toFixed(2)}`);
          let cityName = 'Current Location';
          let countryName = '';

          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (geoData.results && geoData.results[0]) {
              cityName = geoData.results[0].name;
              countryName = geoData.results[0].country;
            }
          }

          const localCity: CityLocation = {
            name: cityName,
            country: countryName,
            latitude,
            longitude,
          };
          fetchAirQuality(localCity);
        } catch (e) {
          fetchAirQuality({
            name: 'Local Coordinates',
            country: '',
            latitude,
            longitude,
          });
        }
      },
      (err) => {
        console.warn('Geolocation permission denied or timed out:', err);
        alert('Could not access device GPS. Please select a city manually.');
        setIsLoading(false);
      },
      { timeout: 8000 }
    );
  };

  // Evaluate current persona risk status
  const personaAssessment = useMemo(() => {
    if (!data) return null;
    return evaluatePersona(
      selectedPersona,
      data.current.aqi.overallAQI,
      data.current.pollutants,
      data.current.weather,
      data.mlForecast,
      data.hourlyTimeline
    );
  }, [data, selectedPersona]);

  // Dynamic alert list incorporating persona-specific triggers
  const customAlerts = useMemo(() => {
    if (!data) return [];
    let list = [...data.alerts];

    // Check if active persona has reached High or Severe risk
    if (personaAssessment && (personaAssessment.currentRiskLevel === 'High' || personaAssessment.currentRiskLevel === 'Severe')) {
      const alreadyHasPersona = list.some((a) => a.id === `persona-${selectedPersona}`);
      if (!alreadyHasPersona) {
        list.unshift({
          id: `persona-${selectedPersona}`,
          severity: personaAssessment.currentRiskLevel === 'Severe' ? 'critical' : 'danger',
          title: `Health Risk Warning for ${personaAssessment.config.name}`,
          message: personaAssessment.personalizedWarning,
          recommendation: personaAssessment.actionProtocol[0] || 'Take immediate preventative precautions.',
          targetGroups: [personaAssessment.config.name],
          timestamp: 'Live Evaluation',
        });
      }
    }

    return list;
  }, [data, personaAssessment, selectedPersona]);

  // Primary View: Conversational AI Chatbot
  if (activeTab === 'chatbot') {
    return (
      <ChatContainer
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onSwitchToDashboard={() => setActiveTab('overview')}
      />
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col selection:bg-sky-500 selection:text-white transition-colors ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* 1. Enhanced Header with Tab Nav and Persona Quick Switcher */}
      <Header
        currentCity={currentCity}
        onSelectCity={handleSelectIndianLocation}
        onLocateUser={handleLocateUser}
        onRefresh={() => fetchAirQuality(currentCity)}
        isLoading={isLoading}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenAlertSettings={() => setIsAlertSettingsOpen(true)}
        dataSourceName={data?.dataSource.name || 'Open-Meteo European CAMS'}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        selectedPersona={selectedPersona}
        onSelectPersona={setSelectedPersona}
        alertCount={customAlerts.length}
        selectedState={selectedState}
        selectedDistrict={selectedDistrict}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error Alert if any */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start justify-between text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchAirQuality(currentCity)}
              className="text-rose-700 font-bold hover:underline ml-3"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !data ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 rounded-full border-3 border-sky-600 border-t-transparent animate-spin" />
            <div className="text-center">
              <p className="text-sm font-bold text-slate-800">
                Fetching Real-Time Environmental Telemetry...
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Querying CAMS atmospheric models, calculating EPA breakpoints, and running regression forecasts
              </p>
            </div>
          </div>
        ) : data ? (
          <>
            {/* TAB VIEW 1: Live Dashboard Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Primary Metrics: Radial AQI Meter, Weather Drivers & 6 Pollutants */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: AQI Radial Gauge & Meteorological Drivers */}
                  <div className="lg:col-span-5 space-y-6">
                    <AQIGauge
                      aqiResult={data.current.aqi}
                      city={data.city}
                      pollutants={data.current.pollutants}
                      updatedAt={data.current.updatedAt}
                    />

                    {/* Meteorological Drivers */}
                    <WeatherBar weather={data.current.weather} />
                  </div>

                  {/* Right Column: 6 Criteria Pollutant Concentration Breakdown */}
                  <div className="lg:col-span-7">
                    <PollutantGrid
                      pollutants={data.current.pollutants}
                      aqiResult={data.current.aqi}
                    />
                  </div>
                </div>

                {/* Overall Pie Chart, State Analytics & District-Level Analytics Filterable by State */}
                <IndiaAirQualityAnalyticsChart
                  onSelectState={handleSelectStateFromChart}
                  selectedState={selectedState}
                  selectedDistrict={selectedDistrict}
                  onSelectDistrict={handleSelectIndianLocation}
                />
              </div>
            )}

            {/* TAB VIEW: Map - 3D Earth Globe & High-Density Station Telemetry */}
            {activeTab === 'map' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Section Header: Map with 3D/2D Mode Switcher */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
                      {mapSubView === '3d' ? (
                        <Globe className="w-5 h-5 stroke-[2.2]" />
                      ) : (
                        <Globe className="w-5 h-5 stroke-[2.2]" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                          Interactive 3D Globe & Street Map
                        </h2>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Unified 3D Model
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Seamless 3D planetary Earth model — rotate or pause rotation, inspect any city or region, and zoom continuously from space into crystal-clear street-level roads and live AQI telemetry.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Single Unified 3D Globe & Street Model */}
                <Unified3DGlobeMap
                  onSelectCity={(city) => {
                    fetchAirQuality(city);
                    setActiveTab('overview');
                  }}
                  initialFocus={streetFocusLocation}
                />
              </div>
            )}

            {/* TAB VIEW 3: Pollution Hotspots & Clean-Air Route Finder */}
            {activeTab === 'hotspots' && (
              <PollutionHotspotsDashboard
                onSelectCity={(city) => {
                  fetchAirQuality(city);
                  setActiveTab('overview');
                }}
                selectedState={selectedState}
                selectedDistrict={selectedDistrict}
              />
            )}

            {/* TAB VIEW 4: Health Risk Persona Advisory Panel */}
            {activeTab === 'persona' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <PersonaSelector
                  selectedPersona={selectedPersona}
                  onSelectPersona={setSelectedPersona}
                  currentAQI={data.current.aqi.overallAQI}
                  pollutants={data.current.pollutants}
                  weather={data.current.weather}
                  forecast={data.mlForecast}
                  hourlyTimeline={data.hourlyTimeline}
                  selectedState={selectedState}
                  selectedDistrict={selectedDistrict}
                  onSelectLocation={handleSelectIndianLocation}
                  currentCity={currentCity}
                />

                {/* Paired AI Diagnostic Analysis */}
                <AIAdvisorCard
                  analysis={data.aiAnalysis}
                  isLoading={isAiLoading}
                  onRegenerate={() => generateAiAnalysis()}
                />
              </div>
            )}

            {/* TAB VIEW 3: Interactive "What-If" Simulator Panel */}
            {activeTab === 'simulator' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <WhatIfSimulator
                  timeline={data.hourlyTimeline}
                  weather={data.current.weather}
                />

                {/* Paired Weather Bar */}
                <WeatherBar weather={data.current.weather} />
              </div>
            )}

            {/* TAB VIEW 4: ML Prediction & Historical Trends */}
            {activeTab === 'forecast' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <ForecastSection
                  timeline={data.hourlyTimeline}
                  summary={data.mlForecast}
                  selectedState={selectedState}
                  selectedDistrict={selectedDistrict}
                  onSelectLocation={handleSelectIndianLocation}
                  currentCity={currentCity}
                />

                <PollutantGrid
                  pollutants={data.current.pollutants}
                  aqiResult={data.current.aqi}
                />
              </div>
            )}

            {/* TAB VIEW 5: Automated Alert Logs & Multi-Channel Dispatch */}
            {activeTab === 'alerts' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <AlertDispatchLogs
                  data={data}
                  alerts={customAlerts}
                  onOpenSettings={() => setIsAlertSettingsOpen(true)}
                />
              </div>
            )}
          </>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-sky-600" />
            <span className="font-bold text-slate-800">AeroPulse AI</span>
            <span>• Production Air Quality Monitoring & Pollution Prediction System</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <button
              onClick={() => setIsReportOpen(true)}
              className="hover:text-sky-600 transition-colors font-semibold"
            >
              Generate Official Report
            </button>
            <span className="text-slate-300">•</span>
            <span>EPA Breakpoints & WMO Standards Compliant</span>
          </div>
        </div>
      </footer>

      {/* Printable Diagnostic Report Modal */}
      {data && (
        <PrintReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          data={data}
        />
      )}

      {/* Alert Thresholds Settings Modal */}
      <AlertSettingsModal
        isOpen={isAlertSettingsOpen}
        onClose={() => setIsAlertSettingsOpen(false)}
        onSave={(newRules) => setAlertConfig(newRules)}
      />

      {/* Floating Action Button (Bottom-Right) to Open AI Chatbot */}
      <button
        onClick={() => setActiveTab('chatbot')}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-700 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-sky-600/35 transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 border border-white/25 group"
        title="Click to Open AI Chatbot Assistant"
        aria-label="Open AI Assistant"
      >
        <div className="relative">
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400" />
        </div>
        <span>chatbot</span>
        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white/20 text-white group-hover:bg-white/30 transition-colors">
          Open
        </span>
      </button>
    </div>
  );
}
