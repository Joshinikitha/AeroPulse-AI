import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Layers,
  Search,
  Filter,
  RefreshCw,
  Info,
  ShieldAlert,
  Wind,
  Thermometer,
  Droplets,
  ExternalLink,
  ChevronRight,
  Compass,
  CheckCircle,
  Eye,
  Sliders,
  Sparkles,
  Radio,
  ArrowUpRight,
  Globe,
  Navigation,
  Crosshair,
  ArrowLeft,
} from 'lucide-react';
import { AirMonitoringStation, CityLocation } from '../types';
import { GLOBAL_AQI_LOCATIONS, toAirMonitoringStation } from '../data/globalLocations';

export interface StreetFocusLocation {
  lat: number;
  lon: number;
  zoom: number;
  name?: string;
}

interface IndiaTamilNaduMapProps {
  initialFocus?: StreetFocusLocation | null;
  onSelectStationAsCity?: (city: CityLocation) => void;
  onSwitchTo3DGlobe?: () => void;
}

type MetricMode = 'aqi' | 'pm25' | 'pm10' | 'no2' | 'temp';
type RegionView =
  | 'all'
  | 'india'
  | 'tamilnadu'
  | 'americas'
  | 'europe'
  | 'asia'
  | 'middle-east'
  | 'africa'
  | 'oceania';

export type BaseMapStyle = 'esri_street' | 'osm' | 'satellite' | 'esri_gray';

export const BASE_MAP_PROVIDERS: Record<
  BaseMapStyle,
  { name: string; label: string; url: string; attribution: string; maxZoom: number }
> = {
  esri_street: {
    name: 'ESRI World Street Map (Street Names & Road Network)',
    label: '🛣️ Streets',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, METI, TomTom',
    maxZoom: 19,
  },
  osm: {
    name: 'OpenStreetMap Standard (Free Street Tiles)',
    label: 'Standard',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  satellite: {
    name: 'High-Resolution Satellite Imagery with Streets',
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, USDA, USGS',
    maxZoom: 19,
  },
  esri_gray: {
    name: 'Minimal Light Canvas',
    label: 'Light Gray',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    maxZoom: 16,
  },
};

// Global & Regional Presets for rapid street-level exploration
const GLOBAL_PRESETS = [
  // India & Tamil Nadu
  { name: 'Chennai', lat: 13.0827, lon: 80.2707, zoom: 15, tag: 'TN' },
  { name: 'Coimbatore', lat: 11.0168, lon: 76.9558, zoom: 15, tag: 'TN' },
  { name: 'Madurai', lat: 9.9252, lon: 78.1198, zoom: 15, tag: 'TN' },
  { name: 'Salem', lat: 11.6643, lon: 78.146, zoom: 15, tag: 'TN' },
  { name: 'New Delhi', lat: 28.6139, lon: 77.209, zoom: 15, tag: 'India' },
  { name: 'Mumbai', lat: 19.076, lon: 72.8777, zoom: 15, tag: 'India' },
  { name: 'Bengaluru', lat: 12.9716, lon: 77.5946, zoom: 15, tag: 'India' },
  // World Capitals & Major Metros across Globe
  { name: 'New York', lat: 40.7128, lon: -74.006, zoom: 15, tag: 'USA' },
  { name: 'London', lat: 51.5074, lon: -0.1278, zoom: 15, tag: 'UK' },
  { name: 'Paris', lat: 48.8566, lon: 2.3522, zoom: 15, tag: 'FR' },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503, zoom: 15, tag: 'JP' },
  { name: 'Los Angeles', lat: 34.0522, lon: -118.2437, zoom: 15, tag: 'USA' },
  { name: 'Beijing', lat: 39.9042, lon: 116.4074, zoom: 15, tag: 'CN' },
  { name: 'Sydney', lat: -33.8688, lon: 151.2093, zoom: 15, tag: 'AU' },
  { name: 'Dubai', lat: 25.2048, lon: 55.2708, zoom: 15, tag: 'UAE' },
  { name: 'São Paulo', lat: -23.5505, lon: -46.6333, zoom: 15, tag: 'BR' },
  { name: 'Berlin', lat: 52.52, lon: 13.405, zoom: 15, tag: 'DE' },
  { name: 'Singapore', lat: 1.3521, lon: 103.8198, zoom: 15, tag: 'SG' },
];

export const IndiaTamilNaduMap: React.FC<IndiaTamilNaduMapProps> = ({
  initialFocus,
  onSelectStationAsCity,
  onSwitchTo3DGlobe,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const waqiTileLayerRef = useRef<L.TileLayer | null>(null);

  // Default to ESRI World Street Map for razor-sharp streets down to zoom 19
  const [baseMapStyle, setBaseMapStyle] = useState<BaseMapStyle>('esri_street');
  const [stations, setStations] = useState<AirMonitoringStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<AirMonitoringStation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [regionView, setRegionView] = useState<RegionView>('all');
  const [metricMode, setMetricMode] = useState<MetricMode>('aqi');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hasWaqiToken, setHasWaqiToken] = useState(false);
  const [showWaqiTiles, setShowWaqiTiles] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [currentZoom, setCurrentZoom] = useState<number>(initialFocus?.zoom || 15);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodedSuggestions, setGeocodedSuggestions] = useState<
    { name: string; country: string; lat: number; lon: number }[]
  >([]);

  // Base built-in global stations
  const globalBaseline = useMemo(() => GLOBAL_AQI_LOCATIONS.map(toAirMonitoringStation), []);

  // Check saved token on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let savedToken = localStorage.getItem('aeropulse_waqi_token');
      if (!savedToken) {
        savedToken = 'b604e14fe0673e97b77a0d38a35c81e346abd563';
        localStorage.setItem('aeropulse_waqi_token', savedToken);
      }
      setHasWaqiToken(Boolean(savedToken));
    }
  }, []);

  // Fetch stations from server and merge with global locations
  const fetchStations = async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('aeropulse_waqi_token') || ''
          : '';
      const url = `/api/map/stations?region=all${token ? `&token=${encodeURIComponent(token)}` : ''}${forceRefresh ? '&refresh=true' : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const mergedMap = new Map<string, AirMonitoringStation>();
      // 1. Add global stations
      globalBaseline.forEach((st) => mergedMap.set(st.id, st));

      // 2. Add API stations (India + Tamil Nadu + WAQI)
      if (Array.isArray(data.stations)) {
        data.stations.forEach((st: AirMonitoringStation) => mergedMap.set(st.id, st));
      }

      const allStations = Array.from(mergedMap.values());
      setStations(allStations);
      setLastUpdated(data.updatedAt || new Date().toISOString());

      // Select default station (or matching initialFocus)
      if (initialFocus) {
        const match = allStations.find(
          (s) =>
            Math.abs(s.latitude - initialFocus.lat) < 0.1 &&
            Math.abs(s.longitude - initialFocus.lon) < 0.1
        );
        if (match) setSelectedStation(match);
      } else if (!selectedStation && allStations.length > 0) {
        const defaultSt =
          allStations.find((s) => s.id === 'tn-chn-01') || allStations[0];
        setSelectedStation(defaultSt);
      }
    } catch (err) {
      console.warn('Failed to load stations from server, falling back to global baseline:', err);
      setStations(globalBaseline);
      if (!selectedStation && globalBaseline.length > 0) {
        setSelectedStation(globalBaseline[0]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  // Filter stations based on region, search query, and category
  const filteredStations = useMemo(() => {
    return stations.filter((station) => {
      // Region filter
      if (regionView === 'tamilnadu' && station.state !== 'Tamil Nadu') {
        return false;
      }
      if (regionView === 'india' && station.country !== 'India') {
        return false;
      }
      if (regionView === 'americas') {
        const americas = ['United States', 'Canada', 'Brazil', 'Mexico', 'Argentina', 'Chile', 'Colombia', 'Peru'];
        if (!americas.includes(station.country)) return false;
      }
      if (regionView === 'europe') {
        const europe = ['United Kingdom', 'France', 'Germany', 'Italy', 'Spain', 'Netherlands', 'Poland', 'Sweden', 'Greece'];
        if (!europe.includes(station.country)) return false;
      }
      if (regionView === 'asia') {
        const asia = ['India', 'China', 'Japan', 'South Korea', 'Singapore', 'Thailand', 'Indonesia', 'Malaysia', 'Vietnam'];
        if (!asia.includes(station.country)) return false;
      }
      if (regionView === 'middle-east') {
        const me = ['United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Oman', 'Israel', 'Turkey'];
        if (!me.includes(station.country)) return false;
      }
      if (regionView === 'africa') {
        const africa = ['Egypt', 'South Africa', 'Kenya', 'Nigeria', 'Morocco', 'Ghana', 'Ethiopia'];
        if (!africa.includes(station.country)) return false;
      }
      if (regionView === 'oceania') {
        const oceania = ['Australia', 'New Zealand'];
        if (!oceania.includes(station.country)) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = station.stationName.toLowerCase().includes(q);
        const matchesCity = station.city.toLowerCase().includes(q);
        const matchesDistrict = (station.district || '').toLowerCase().includes(q);
        const matchesState = (station.state || '').toLowerCase().includes(q);
        const matchesCountry = (station.country || '').toLowerCase().includes(q);
        const matchesAgency = (station.operatingAgency || '').toLowerCase().includes(q);
        if (
          !matchesName &&
          !matchesCity &&
          !matchesDistrict &&
          !matchesState &&
          !matchesCountry &&
          !matchesAgency
        ) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'good' && station.aqi > 50) return false;
        if (selectedCategory === 'moderate' && (station.aqi <= 50 || station.aqi > 100))
          return false;
        if (selectedCategory === 'unhealthy' && (station.aqi <= 100 || station.aqi > 200))
          return false;
        if (selectedCategory === 'severe' && station.aqi <= 200) return false;
      }

      return true;
    });
  }, [stations, regionView, searchQuery, selectedCategory]);

  // Color helper based on AQI
  const getAqiColor = (aqi: number) => {
    if (aqi <= 50)
      return { bg: '#10b981', text: '#ffffff', label: 'Good', border: '#059669' };
    if (aqi <= 100)
      return { bg: '#0ea5e9', text: '#ffffff', label: 'Moderate', border: '#0284c7' };
    if (aqi <= 150)
      return {
        bg: '#f59e0b',
        text: '#ffffff',
        label: 'Unhealthy for Sensitive',
        border: '#d97706',
      };
    if (aqi <= 200)
      return { bg: '#f97316', text: '#ffffff', label: 'Unhealthy', border: '#ea580c' };
    if (aqi <= 300)
      return { bg: '#ef4444', text: '#ffffff', label: 'Very Unhealthy', border: '#dc2626' };
    return { bg: '#881337', text: '#ffffff', label: 'Hazardous', border: '#4c0519' };
  };

  // Helper for marker display value
  const getMarkerValue = (station: AirMonitoringStation) => {
    if (metricMode === 'pm25') return `${Math.round(station.pollutants.pm25)}`;
    if (metricMode === 'pm10') return `${Math.round(station.pollutants.pm10)}`;
    if (metricMode === 'no2') return `${Math.round(station.pollutants.no2)}`;
    if (metricMode === 'temp') return `${Math.round(station.weather.temperature)}°`;
    return `${station.aqi}`;
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const startLat = initialFocus?.lat ?? 13.0827; // Chennai
    const startLon = initialFocus?.lon ?? 80.2707;
    const startZoom = initialFocus?.zoom ?? 15; // Street Level Zoom

    // Create Leaflet map with global coverage and zoom up to 19 (street level)
    const map = L.map(mapContainerRef.current, {
      center: [startLat, startLon],
      zoom: startZoom,
      minZoom: 2,
      maxZoom: 19,
      zoomControl: true,
      worldCopyJump: true,
    });

    // Default ESRI World Street Map (shows streets, avenues, pedestrian paths & road labels)
    const initialProvider = BASE_MAP_PROVIDERS.esri_street;
    const baseLayer = L.tileLayer(initialProvider.url, {
      attribution: initialProvider.attribution,
      maxZoom: initialProvider.maxZoom,
    }).addTo(map);
    baseTileLayerRef.current = baseLayer;

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    // Track zoom level dynamically
    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Base Map Style dynamically without resetting markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
      baseTileLayerRef.current = null;
    }

    const provider = BASE_MAP_PROVIDERS[baseMapStyle] || BASE_MAP_PROVIDERS.esri_street;
    const newBaseLayer = L.tileLayer(provider.url, {
      attribution: provider.attribution,
      maxZoom: provider.maxZoom,
    });
    newBaseLayer.addTo(map);
    if ((newBaseLayer as any).bringToBack) {
      (newBaseLayer as any).bringToBack();
    }
    baseTileLayerRef.current = newBaseLayer;
  }, [baseMapStyle]);

  // Handle external focus changes (e.g. from 3D Globe zoom dive)
  useEffect(() => {
    if (initialFocus && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(
        [initialFocus.lat, initialFocus.lon],
        initialFocus.zoom || 16,
        { duration: 1.5 }
      );
      // Select matching station if found
      const match = stations.find(
        (s) =>
          Math.abs(s.latitude - initialFocus.lat) < 0.08 &&
          Math.abs(s.longitude - initialFocus.lon) < 0.08
      );
      if (match) {
        setSelectedStation(match);
      }
    }
  }, [initialFocus, stations]);

  // Update WAQI Tile Layer when toggled
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (showWaqiTiles) {
      const DEFAULT_WAQI_TOKEN = 'b604e14fe0673e97b77a0d38a35c81e346abd563';
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('aeropulse_waqi_token') || DEFAULT_WAQI_TOKEN
          : DEFAULT_WAQI_TOKEN;
      const tileUrl = `https://tiles.aqicn.org/tiles/usepa-aqi/{z}/{x}/{y}.png?token=${encodeURIComponent(token)}`;
      const waqiLayer = L.tileLayer(tileUrl, {
        opacity: 0.65,
        zIndex: 50,
      });
      waqiLayer.addTo(map);
      waqiTileLayerRef.current = waqiLayer;
    } else {
      if (waqiTileLayerRef.current) {
        map.removeLayer(waqiTileLayerRef.current);
        waqiTileLayerRef.current = null;
      }
    }
  }, [showWaqiTiles]);

  // Update Markers whenever filtered stations or metric mode changes
  useEffect(() => {
    const markersGroup = markersLayerRef.current;
    if (!markersGroup || !mapInstanceRef.current) return;

    markersGroup.clearLayers();

    filteredStations.forEach((station) => {
      const color = getAqiColor(station.aqi);
      const displayVal = getMarkerValue(station);
      const isSelected = selectedStation?.id === station.id;
      const isHazardous = station.aqi > 150;

      // Custom HTML Marker Icon
      const customIcon = L.divIcon({
        className: 'custom-aqi-marker',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer transition-transform duration-200 ${
            isSelected ? 'scale-125 z-50' : 'hover:scale-110'
          }">
            ${
              isHazardous
                ? `<span class="absolute inline-flex h-10 w-10 rounded-full animate-ping opacity-40" style="background-color: ${color.bg}"></span>`
                : ''
            }
            <div 
              style="background-color: ${color.bg}; border-color: ${isSelected ? '#ffffff' : color.border}; color: ${color.text};"
              class="relative flex flex-col items-center justify-center rounded-full shadow-lg border-2 ${
                isSelected ? 'w-11 h-11' : 'w-9 h-9'
              }"
            >
              <span class="font-extrabold text-[11px] leading-none">${displayVal}</span>
              <span class="text-[7px] uppercase font-bold tracking-tight opacity-90">${metricMode}</span>
            </div>
            ${
              isSelected
                ? `<div class="absolute -bottom-1 w-2 h-2 rotate-45" style="background-color: ${color.bg}"></div>`
                : ''
            }
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      const marker = L.marker([station.latitude, station.longitude], {
        icon: customIcon,
      });

      marker.on('click', () => {
        setSelectedStation(station);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([station.latitude, station.longitude], Math.max(currentZoom, 15), {
            duration: 0.8,
          });
        }
      });

      markersGroup.addLayer(marker);
    });
  }, [filteredStations, selectedStation, metricMode, currentZoom]);

  // Handle Preset Jump to District or Global City
  const handleFlyToPreset = (preset: { name: string; lat: number; lon: number; zoom: number }) => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([preset.lat, preset.lon], preset.zoom, {
      duration: 1.2,
    });
    // Find matching station if available
    const match = stations.find(
      (s) =>
        s.city.toLowerCase().includes(preset.name.toLowerCase()) ||
        s.stationName.toLowerCase().includes(preset.name.toLowerCase())
    );
    if (match) {
      setSelectedStation(match);
    }
  };

  // Perform Worldwide Geocoding search (for streets, avenues, landmarks worldwide)
  const handleGlobalSearch = async (query: string) => {
    if (!query || query.trim().length < 2) return;
    setIsGeocoding(true);
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.results)) {
          setGeocodedSuggestions(
            data.results.map((r: any) => ({
              name: `${r.name}${r.admin1 ? `, ${r.admin1}` : ''}`,
              country: r.country || '',
              lat: r.latitude,
              lon: r.longitude,
            }))
          );
        }
      }
    } catch {
      // fallback
    } finally {
      setIsGeocoding(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* MAP CONTROLS & FILTER BAR */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
        {/* Top Header Row with Return to 3D Globe, Street Clarity Indicator, and Mode Switchers */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <Navigation className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight font-display">
                  Interactive Street-Level AQI Map
                </h3>
                {/* Dynamic Street View Status Badge */}
                {currentZoom >= 14 ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Street View: Roads & Labels Active ({currentZoom}x)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                    Regional View ({currentZoom}x) • Zoom in for Streets
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Explore crystal-clear street networks, road names, and live criteria pollutants across all cities and countries worldwide
              </p>
            </div>
          </div>

          {/* Action: Return to 3D Orbital Globe Button */}
          {onSwitchTo3DGlobe && (
            <button
              type="button"
              onClick={onSwitchTo3DGlobe}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950 hover:from-slate-800 hover:to-indigo-900 text-white font-bold text-xs shadow-md border border-slate-700 transition-all cursor-pointer shrink-0 self-start lg:self-auto"
            >
              <Globe className="w-4 h-4 text-sky-400" />
              <span>Back to 3D Globe Orbit</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-300" />
            </button>
          )}
        </div>

        {/* Region & Continent Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-semibold shrink-0 flex items-center gap-1 text-[11px]">
            <Globe className="w-3.5 h-3.5" /> Region:
          </span>
          {[
            { id: 'all', label: '🌍 All Globe' },
            { id: 'tamilnadu', label: '🌴 Tamil Nadu' },
            { id: 'india', label: '🇮🇳 India' },
            { id: 'asia', label: '🌏 Asia' },
            { id: 'europe', label: '🌍 Europe' },
            { id: 'americas', label: '🌎 Americas' },
            { id: 'middle-east', label: '🌍 Middle East' },
            { id: 'africa', label: '🌍 Africa' },
            { id: 'oceania', label: '🌏 Oceania' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRegionView(tab.id as RegionView)}
              className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                regionView === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search, Metric Selector & Quick Jumper Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
          {/* Global Search Bar (Stations & Street Geocoding) */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.length > 2) {
                  handleGlobalSearch(e.target.value);
                } else {
                  setGeocodedSuggestions([]);
                }
              }}
              placeholder="Search any street, city, country, or monitoring station..."
              className="w-full pl-9 pr-8 py-2 bg-slate-100 focus:bg-white rounded-xl border border-transparent focus:border-indigo-400 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setGeocodedSuggestions([]);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-mono"
              >
                ✕
              </button>
            )}

            {/* Geocoding Dropdown Suggestions */}
            {geocodedSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden py-1 max-h-48 overflow-y-auto">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                  Worldwide Street / City Geocoder
                </div>
                {geocodedSuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (mapInstanceRef.current) {
                        mapInstanceRef.current.flyTo([item.lat, item.lon], 16, { duration: 1.2 });
                      }
                      setSearchQuery(item.name);
                      setGeocodedSuggestions([]);
                    }}
                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-indigo-50 flex items-center justify-between group transition-colors"
                  >
                    <span className="font-semibold text-slate-800 group-hover:text-indigo-700">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-slate-400">{item.country}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Metric Selector Buttons */}
          <div className="md:col-span-6 flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {[
              { id: 'aqi', label: 'Overall AQI' },
              { id: 'pm25', label: 'PM2.5' },
              { id: 'pm10', label: 'PM10' },
              { id: 'no2', label: 'NO₂' },
              { id: 'temp', label: 'Temperature' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMetricMode(m.id as MetricMode)}
                className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                  metricMode === m.id
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Presets Jumper (India + Global Metros) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
          <span className="text-slate-400 font-semibold shrink-0 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5" /> Jump to Street Level:
          </span>
          {GLOBAL_PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => handleFlyToPreset(p)}
              className="px-2.5 py-0.5 rounded-full bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 border border-slate-200 transition-colors whitespace-nowrap shrink-0 font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>{p.name}</span>
              <span className="text-[9px] text-slate-400 font-mono">({p.tag})</span>
            </button>
          ))}

          {/* WAQI Heatmap Tile Layer Toggle */}
          <button
            onClick={() => setShowWaqiTiles(!showWaqiTiles)}
            className={`ml-auto px-3 py-0.5 rounded-full border text-[11px] font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
              showWaqiTiles
                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                : 'bg-white text-purple-700 border-purple-200 hover:bg-purple-50'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>WAQI Heatmap Overlay: {showWaqiTiles ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* MAIN MAP CANVAS & STATION INSPECTOR SIDE PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Map Container */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs relative h-[540px] sm:h-[640px] flex flex-col">
          {/* Map canvas */}
          <div ref={mapContainerRef} className="w-full h-full z-10" />

          {/* Top Right Floating Basemap Switcher */}
          <div className="absolute top-4 right-4 z-20 flex flex-wrap items-center justify-end gap-2 max-w-[calc(100%-4rem)]">
            <div className="bg-white/95 backdrop-blur-md p-1 rounded-xl border border-slate-200 shadow-lg flex items-center gap-1 text-[11px]">
              {(['esri_street', 'osm', 'satellite', 'esri_gray'] as BaseMapStyle[]).map(
                (style) => (
                  <button
                    key={style}
                    onClick={() => setBaseMapStyle(style)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      baseMapStyle === style
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                    title={BASE_MAP_PROVIDERS[style].name}
                  >
                    {BASE_MAP_PROVIDERS[style].label}
                  </button>
                )
              )}
            </div>

            {/* Active Stations Counter */}
            <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-md text-xs font-semibold text-slate-700 flex items-center gap-2 shrink-0">
              <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span>{filteredStations.length} Active Stations</span>
            </div>
          </div>

          {/* Bottom Left Floating AQI Scale Legend */}
          <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md p-2.5 rounded-xl border border-slate-200 shadow-lg text-[10px] space-y-1.5 max-w-[280px]">
            <div className="font-bold text-slate-900 flex items-center justify-between">
              <span>National AQI Standard</span>
              <span className="text-slate-400 font-mono">CPCB / EPA</span>
            </div>
            <div className="grid grid-cols-6 gap-1 text-center font-bold text-white text-[9px]">
              <div className="bg-[#10b981] py-0.5 rounded">0-50</div>
              <div className="bg-[#0ea5e9] py-0.5 rounded">51-100</div>
              <div className="bg-[#f59e0b] py-0.5 rounded">101-150</div>
              <div className="bg-[#f97316] py-0.5 rounded">151-200</div>
              <div className="bg-[#ef4444] py-0.5 rounded">201-300</div>
              <div className="bg-[#881337] py-0.5 rounded">300+</div>
            </div>
            <div className="flex items-center justify-between text-[9px] text-slate-500">
              <span>Good</span>
              <span>Moderate</span>
              <span>Unhealthy</span>
              <span>Hazardous</span>
            </div>
          </div>
        </div>

        {/* Station Telemetry Inspector Sidepanel */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
          {selectedStation ? (
            <div className="space-y-4">
              {/* Station Header */}
              <div className="border-b border-slate-100 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 inline-block mb-1">
                      {selectedStation.country} • {selectedStation.state}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 font-display">
                      {selectedStation.stationName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Operated by:{' '}
                      <span className="font-semibold text-slate-700">
                        {selectedStation.operatingAgency}
                      </span>
                    </p>
                  </div>
                  <span className="px-2 py-1 rounded-lg text-[10px] font-mono bg-slate-100 text-slate-600 shrink-0">
                    {selectedStation.stationType || 'Continuous CAAQMS'}
                  </span>
                </div>
              </div>

              {/* Real-Time AQI Card */}
              {(() => {
                const color = getAqiColor(selectedStation.aqi);
                return (
                  <div
                    className="p-4 rounded-2xl border flex items-center justify-between shadow-xs"
                    style={{
                      backgroundColor: `${color.bg}12`,
                      borderColor: `${color.bg}40`,
                    }}
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Ambient Air Quality Index
                      </span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span
                          className="text-3xl font-extrabold font-display"
                          style={{ color: color.bg }}
                        >
                          {selectedStation.aqi}
                        </span>
                        <span className="font-bold text-sm" style={{ color: color.bg }}>
                          {color.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">
                        Dominant Pollutant:{' '}
                        <strong className="text-slate-800">
                          {selectedStation.dominantPollutant}
                        </strong>
                      </p>
                    </div>

                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md font-bold text-lg"
                      style={{ backgroundColor: color.bg }}
                    >
                      {selectedStation.aqi}
                    </div>
                  </div>
                );
              })()}

              {/* Criteria Pollutants Concentrations Grid */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-sky-600" />
                  Criteria Pollutants Breakdown
                </span>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 block">PM2.5</span>
                    <span className="text-sm font-extrabold text-slate-900 font-mono">
                      {selectedStation.pollutants.pm25}
                    </span>
                    <span className="text-[9px] text-slate-400 block">µg/m³</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 block">PM10</span>
                    <span className="text-sm font-extrabold text-slate-900 font-mono">
                      {selectedStation.pollutants.pm10}
                    </span>
                    <span className="text-[9px] text-slate-400 block">µg/m³</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 block">NO₂</span>
                    <span className="text-sm font-extrabold text-slate-900 font-mono">
                      {selectedStation.pollutants.no2}
                    </span>
                    <span className="text-[9px] text-slate-400 block">µg/m³</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 block">SO₂</span>
                    <span className="text-sm font-extrabold text-slate-900 font-mono">
                      {selectedStation.pollutants.so2}
                    </span>
                    <span className="text-[9px] text-slate-400 block">µg/m³</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 block">CO</span>
                    <span className="text-sm font-extrabold text-slate-900 font-mono">
                      {selectedStation.pollutants.co}
                    </span>
                    <span className="text-[9px] text-slate-400 block">µg/m³</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 block">Ozone (O₃)</span>
                    <span className="text-sm font-extrabold text-slate-900 font-mono">
                      {selectedStation.pollutants.o3}
                    </span>
                    <span className="text-[9px] text-slate-400 block">µg/m³</span>
                  </div>
                </div>
              </div>

              {/* Weather & Micro-Climate Readings */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-around">
                <div className="flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4 text-amber-500" />
                  <div>
                    <span className="text-[10px] text-slate-500 block">Temperature</span>
                    <span className="font-bold text-slate-800">
                      {selectedStation.weather.temperature}°C
                    </span>
                  </div>
                </div>

                <div className="h-6 w-px bg-slate-200" />

                <div className="flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-sky-500" />
                  <div>
                    <span className="text-[10px] text-slate-500 block">Humidity</span>
                    <span className="font-bold text-slate-800">
                      {selectedStation.weather.humidity}%
                    </span>
                  </div>
                </div>

                <div className="h-6 w-px bg-slate-200" />

                <div className="flex items-center gap-1.5">
                  <Wind className="w-4 h-4 text-emerald-500" />
                  <div>
                    <span className="text-[10px] text-slate-500 block">Wind Speed</span>
                    <span className="font-bold text-slate-800">
                      {selectedStation.weather.windSpeed} km/h
                    </span>
                  </div>
                </div>
              </div>

              {/* Health Advisory Note */}
              <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-100 text-sky-950 text-xs space-y-1">
                <span className="font-bold text-sky-900 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-sky-600" />
                  Health Advisory & Guidelines:
                </span>
                <p className="text-[11px] leading-relaxed text-sky-800">
                  {selectedStation.aqi <= 50
                    ? 'Air quality is satisfactory and poses little or no risk to all groups. Great conditions for outdoor sports and open ventilation.'
                    : selectedStation.aqi <= 100
                    ? 'Acceptable air quality. Unusually sensitive individuals with pre-existing respiratory or cardiac conditions should consider reducing heavy outdoor exertion.'
                    : selectedStation.aqi <= 200
                    ? 'Members of sensitive groups (children, pregnant individuals, seniors) should limit prolonged outdoor exertion. Wear N95/FFP2 masks along traffic corridors.'
                    : 'Health alert: Everyone may experience more serious health effects. Keep windows sealed and operate indoor HEPA purifiers.'}
                </p>
              </div>

              {/* Station Coordinates & Source */}
              <div className="text-[10px] text-slate-400 space-y-0.5 pt-1 border-t border-slate-100">
                <p>
                  <span className="font-semibold text-slate-600">Coordinates:</span>{' '}
                  {selectedStation.latitude.toFixed(4)}°N, {selectedStation.longitude.toFixed(4)}°E
                </p>
                <p>
                  <span className="font-semibold text-slate-600">Verification Feed:</span>{' '}
                  {selectedStation.source === 'waqi-live' ? 'Live WAQI Global Feed' : 'Continuous CAAQMS'}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <Compass className="w-10 h-10 stroke-1 text-slate-300" />
              <p className="text-xs font-medium">
                Click on any station marker on the map to inspect live criteria pollutants and environmental metrics.
              </p>
            </div>
          )}

          {/* Action: Set as active dashboard city */}
          {selectedStation && onSelectStationAsCity && (
            <button
              onClick={() => {
                onSelectStationAsCity({
                  name: selectedStation.city,
                  country: selectedStation.country || 'India',
                  admin1: selectedStation.state || '',
                  latitude: selectedStation.latitude,
                  longitude: selectedStation.longitude,
                });
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Set {selectedStation.city} as Active Dashboard City</span>
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
