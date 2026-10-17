import React, { useState, useEffect, useRef } from 'react';
import {
  Wind,
  Search,
  MapPin,
  Clock,
  Compass,
  FileText,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Users,
  Activity,
  HeartPulse,
  Baby,
  Dumbbell,
  Radio,
  BarChart3,
  Layers,
  Globe,
  Flame,
} from 'lucide-react';
import { CityLocation, PersonaType } from '../types';
import { IndiaLocationFilter } from './IndiaLocationFilter';

export type DashboardTab =
  | 'chatbot'
  | 'overview'
  | 'map'
  | 'hotspots'
  | 'persona'
  | 'simulator'
  | 'forecast'
  | 'alerts';

interface HeaderProps {
  currentCity: CityLocation;
  onSelectCity: (city: CityLocation) => void;
  onLocateUser: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  onOpenReport: () => void;
  onOpenAlertSettings: () => void;
  dataSourceName: string;
  activeTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  selectedPersona: PersonaType;
  onSelectPersona: (p: PersonaType) => void;
  alertCount?: number;
  selectedState?: string;
  selectedDistrict?: string;
}

const POPULAR_CITIES: CityLocation[] = [
  { name: 'New Delhi', country: 'India', admin1: 'Delhi', latitude: 28.6139, longitude: 77.209 },
  { name: 'Los Angeles', country: 'United States', admin1: 'California', latitude: 34.0522, longitude: -118.2437 },
  { name: 'London', country: 'United Kingdom', admin1: 'England', latitude: 51.5074, longitude: -0.1278 },
  { name: 'Washington D.C.', country: 'United States', admin1: 'District of Columbia', latitude: 38.9072, longitude: -77.0369 },
  { name: 'Paris', country: 'France', admin1: 'Île-de-France', latitude: 48.8566, longitude: 2.3522 },
  { name: 'Tokyo', country: 'Japan', admin1: 'Tokyo', latitude: 35.6762, longitude: 139.6503 },
  { name: 'Beijing', country: 'China', admin1: 'Beijing', latitude: 39.9042, longitude: 116.4074 },
  { name: 'Berlin', country: 'Germany', admin1: 'Berlin', latitude: 52.52, longitude: 13.405 },
  { name: 'Rome', country: 'Italy', admin1: 'Lazio', latitude: 41.9028, longitude: 12.4964 },
  { name: 'Singapore', country: 'Singapore', admin1: 'Singapore', latitude: 1.3521, longitude: 103.8198 },
  { name: 'Dubai', country: 'United Arab Emirates', admin1: 'Dubai', latitude: 25.2048, longitude: 55.2708 },
  { name: 'Sydney', country: 'Australia', admin1: 'New South Wales', latitude: -33.8688, longitude: 151.2093 },
  { name: 'New York', country: 'United States', admin1: 'New York', latitude: 40.7128, longitude: -74.006 },
  { name: 'Bangkok', country: 'Thailand', admin1: 'Bangkok', latitude: 13.7563, longitude: 100.5018 },
];

export const Header: React.FC<HeaderProps> = ({
  currentCity,
  onSelectCity,
  onLocateUser,
  onRefresh,
  isLoading,
  onOpenReport,
  onOpenAlertSettings,
  dataSourceName,
  activeTab,
  onSelectTab,
  selectedPersona,
  onSelectPersona,
  alertCount = 0,
  selectedState,
  selectedDistrict,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CityLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle outside click for search dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const handler = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
          setIsDropdownOpen(true);
        }
      } catch (e) {
        console.error('Geocode search failed', e);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  const getPersonaLabel = (type: PersonaType) => {
    switch (type) {
      case 'asthma':
        return 'Asthma Patient';
      case 'athlete':
        return 'Outdoor Athlete';
      case 'senior':
        return 'Senior Citizen';
      case 'children':
        return 'Children';
      default:
        return 'General Public';
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Navigation Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3.5 gap-3">
          {/* Brand Logo & Telemetry Indicator */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-sm ring-2 ring-sky-100">
              <Wind className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                  AeroPulse <span className="text-sky-600 font-semibold">AI</span>
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
                  Live CAMS
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                AI Air Quality Monitoring & Pollution Prediction System
              </p>
            </div>
          </div>

          {/* Search, Persona Selector & System Controls */}
          <div className="flex flex-wrap lg:flex-nowrap items-center justify-start lg:justify-end gap-2 shrink-0">
            {/* City Search Bar */}
            <div ref={searchContainerRef} className="relative w-32 sm:w-40 lg:w-44 shrink-0">
              <div className="relative flex items-center h-8">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchResults.length > 0) setIsDropdownOpen(true);
                  }}
                  placeholder="Search city..."
                  className="w-full h-8 pl-8 pr-7 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-colors"
                />
                {isSearching && (
                  <RefreshCw className="w-3 h-3 text-sky-500 animate-spin absolute right-2.5 top-1/2 -translate-y-1/2" />
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {isDropdownOpen && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden max-h-64 overflow-y-auto divide-y divide-slate-100">
                  {searchResults.map((city, idx) => (
                    <button
                      key={`${city.name}-${city.latitude}-${idx}`}
                      type="button"
                      onClick={() => {
                        onSelectCity(city);
                        setSearchQuery('');
                        setIsDropdownOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-sky-50 transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors" />
                        <div>
                          <p className="text-sm font-semibold text-slate-800 group-hover:text-sky-900">
                            {city.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {[city.admin1, city.country].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-400 group-hover:text-sky-600 font-mono">
                        {city.latitude.toFixed(1)}°, {city.longitude.toFixed(1)}°
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* GPS Geolocation Button */}
            <button
              type="button"
              onClick={onLocateUser}
              title="Use current GPS coordinates"
              className="inline-flex items-center justify-center gap-1 px-2.5 h-8 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-lg transition-colors border border-slate-200 shrink-0"
            >
              <Compass className="w-3.5 h-3.5 text-sky-600" />
              <span className="hidden sm:inline">GPS</span>
            </button>

            {/* Global Capitals Dropdown List (Short & Compact) */}
            <div className="flex items-center gap-1 px-2 h-8 bg-slate-50 border border-slate-200 rounded-lg shadow-2xs shrink-0">
              <Globe className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <select
                value={
                  POPULAR_CITIES.find(
                    (c) => c.name.toLowerCase() === currentCity.name.toLowerCase()
                  )?.name || ''
                }
                onChange={(e) => {
                  const targetCity = POPULAR_CITIES.find((c) => c.name === e.target.value);
                  if (targetCity) {
                    onSelectCity(targetCity);
                  }
                }}
                aria-label="Select Capital"
                title="Select Capital (New Delhi, Los Angeles, London, etc.)"
                className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer w-20 sm:w-24 max-w-[96px] truncate"
              >
                <option value="" disabled>
                  Capitals
                </option>
                {POPULAR_CITIES.map((city) => (
                  <option key={city.name} value={city.name}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh environmental telemetry"
              className="inline-flex items-center justify-center w-8 h-8 text-slate-600 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-sky-600' : ''}`} />
            </button>

            <div className="h-5 w-px bg-slate-200 mx-0.5 hidden sm:block shrink-0" />

            {/* Indian State & District Dropdown Filter */}
            <div className="shrink-0 flex items-center h-8">
              <IndiaLocationFilter
                selectedState={selectedState}
                selectedDistrict={selectedDistrict}
                onSelectLocation={onSelectCity}
                variant="header"
              />
            </div>

            {/* Export Diagnostic Report (Properly aligned in full screen) */}
            <button
              type="button"
              onClick={onOpenReport}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 h-8 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors shrink-0 whitespace-nowrap self-center"
            >
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>Report</span>
            </button>
          </div>
        </div>

        {/* View / Module Tab Navigation */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-1 pb-2 overflow-x-auto scrollbar-none gap-2">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onSelectTab('overview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'overview'
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Live Dashboard</span>
            </button>

            {/* Tab: Map */}
            <button
              onClick={() => onSelectTab('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'map'
                  ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-2xs'
                  : 'text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-indigo-500" />
              <span>Map</span>
              <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono ${
                activeTab === 'map' ? 'bg-white/25 text-white' : 'bg-indigo-600 text-white'
              }`}>3D</span>
            </button>

            {/* Tab: Pollution Hotspots (NEW) */}
            <button
              onClick={() => onSelectTab('hotspots')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'hotspots'
                  ? 'bg-gradient-to-r from-rose-600 via-orange-600 to-amber-600 text-white shadow-2xs'
                  : 'text-rose-700 bg-rose-50/70 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-rose-500" />
              <span>Pollution Hotspots</span>
              <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono ${
                activeTab === 'hotspots' ? 'bg-white/25 text-white' : 'bg-rose-600 text-white'
              }`}>Live</span>
            </button>

            <button
              onClick={() => onSelectTab('persona')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'persona'
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
              <span>Health Persona Advisory</span>
            </button>

            <button
              onClick={() => onSelectTab('simulator')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'simulator'
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-500" />
              <span>"What-If" Simulator</span>
            </button>

            <button
              onClick={() => onSelectTab('forecast')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'forecast'
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
              <span>ML Trends & Analytics</span>
            </button>

            <button
              onClick={() => onSelectTab('alerts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'alerts'
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-amber-500" />
              <span>Notification Logs</span>
              {alertCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono transition-colors ${
                    activeTab === 'alerts'
                      ? 'bg-white text-sky-700'
                      : 'bg-amber-500 text-white'
                  }`}
                  title={`${alertCount} active warnings`}
                >
                  {alertCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
