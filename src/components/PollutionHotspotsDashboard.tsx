import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Flame,
  Navigation,
  Route as RouteIcon,
  ShieldAlert,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  Activity,
  Layers,
  Search,
  RefreshCw,
  Sliders,
  Wind,
  Thermometer,
  Droplets,
  ArrowUpRight,
  ChevronRight,
  Info,
  Car,
  Bike,
  Sparkles,
  Clock,
  Compass,
  ArrowLeft,
  X,
  ExternalLink,
  ChevronDown,
  Radio,
} from 'lucide-react';
import { AirMonitoringStation, CityLocation } from '../types';
import { BASE_MAP_PROVIDERS, BaseMapStyle } from './IndiaTamilNaduMap';
import { INDIAN_STATES } from '../data/indianLocations';

// EPA / CPCB Standard AQI Breakpoints & Styles
export function getAQIColorInfo(aqi: number) {
  if (aqi <= 50) {
    return {
      category: 'Good',
      hex: '#10B981',
      bgClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      badgeBg: 'bg-emerald-500 text-white',
      desc: 'Air quality is satisfactory with little or no health risk.',
    };
  }
  if (aqi <= 100) {
    return {
      category: 'Moderate',
      hex: '#F59E0B',
      bgClass: 'bg-amber-50 text-amber-800 border-amber-200',
      badgeBg: 'bg-amber-500 text-white',
      desc: 'Acceptable; sensitive individuals may experience minor symptoms.',
    };
  }
  if (aqi <= 150) {
    return {
      category: 'Unhealthy for Sensitive Groups',
      hex: '#F97316',
      bgClass: 'bg-orange-50 text-orange-800 border-orange-200',
      badgeBg: 'bg-orange-500 text-white',
      desc: 'Sensitive individuals (asthmatics, elderly, children) should reduce exertion.',
    };
  }
  if (aqi <= 200) {
    return {
      category: 'Unhealthy',
      hex: '#EF4444',
      bgClass: 'bg-rose-50 text-rose-800 border-rose-200',
      badgeBg: 'bg-rose-500 text-white',
      desc: 'Everyone may begin to experience health effects; wear N95 outdoors.',
    };
  }
  if (aqi <= 300) {
    return {
      category: 'Very Unhealthy',
      hex: '#8B5CF6',
      bgClass: 'bg-purple-50 text-purple-800 border-purple-200',
      badgeBg: 'bg-purple-600 text-white',
      desc: 'Health alert: serious risk of respiratory symptoms for all residents.',
    };
  }
  return {
    category: 'Hazardous',
    hex: '#881337',
    bgClass: 'bg-red-950/20 text-rose-900 border-rose-900/30',
    badgeBg: 'bg-rose-950 text-white',
    desc: 'Emergency health warning: Entire population affected. Avoid all outdoor exposure.',
  };
}

export interface EvaluatedRoute {
  id: string;
  name: string;
  isRecommended: boolean;
  distanceKm: number;
  durationMins: number;
  avgAqi: number;
  maxAqi: number;
  avgPm25: number;
  exposureIndex: number;
  coordinates: [number, number][]; // [lat, lon]
  nearbyStations: {
    id: string;
    stationName: string;
    city: string;
    district: string;
    aqi: number;
    category: string;
    dominantPollutant: string;
    pm25: number;
    distanceToRouteKm: number;
  }[];
  contributingStationCount: number;
  roadType: string;
}

export interface RoutePreset {
  id: string;
  name: string;
  city: string;
  state: string;
  start: { name: string; lat: number; lon: number };
  end: { name: string; lat: number; lon: number };
}

export const COMMUTER_PRESETS: RoutePreset[] = [
  {
    id: 'chn-airport',
    name: 'Chennai Central ➔ Chennai International Airport',
    city: 'Chennai',
    state: 'Tamil Nadu',
    start: { name: 'MGR Chennai Central Railway Station', lat: 13.0827, lon: 80.2707 },
    end: { name: 'Chennai International Airport (MAA)', lat: 12.9941, lon: 80.1709 },
  },
  {
    id: 'chn-omr',
    name: 'T. Nagar Commercial Hub ➔ OMR IT Expressway Corridor',
    city: 'Chennai',
    state: 'Tamil Nadu',
    start: { name: 'T. Nagar Bus Terminus', lat: 13.0418, lon: 80.2341 },
    end: { name: 'Sholinganallur OMR Junction', lat: 12.901, lon: 80.2279 },
  },
  {
    id: 'cbe-airport',
    name: 'Coimbatore Gandhipuram ➔ Coimbatore Airport (CJB)',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    start: { name: 'Gandhipuram Central Bus Stand', lat: 11.0168, lon: 76.9558 },
    end: { name: 'Coimbatore International Airport', lat: 11.0304, lon: 77.0434 },
  },
  {
    id: 'mdu-mattuthavani',
    name: 'Madurai Meenakshi Temple ➔ Mattuthavani Bus Terminus',
    city: 'Madurai',
    state: 'Tamil Nadu',
    start: { name: 'Meenakshi Amman Temple / Periyar', lat: 9.9195, lon: 78.1193 },
    end: { name: 'Mattuthavani Integrated Bus Terminal', lat: 9.9463, lon: 78.1636 },
  },
  {
    id: 'del-noida',
    name: 'Delhi Connaught Place ➔ Noida Sector 62 Tech Zone',
    city: 'New Delhi',
    state: 'Delhi',
    start: { name: 'Connaught Place Central', lat: 28.6315, lon: 77.2167 },
    end: { name: 'Noida Sector 62 Electronic City', lat: 28.6256, lon: 77.3715 },
  },
];

interface PollutionHotspotsDashboardProps {
  onSelectCity?: (city: CityLocation) => void;
  selectedState?: string;
  selectedDistrict?: string;
}

export const PollutionHotspotsDashboard: React.FC<PollutionHotspotsDashboardProps> = ({
  onSelectCity,
  selectedState: initialSelectedState,
  selectedDistrict: initialSelectedDistrict,
}) => {
  // Navigation sub-tab: Hotspots Intelligence vs Clean-Air Route Finder
  const [activeSubTab, setActiveSubTab] = useState<'hotspots' | 'routes'>('hotspots');

  // Region Mode: Tamil Nadu vs All India
  const [regionMode, setRegionMode] = useState<'tamilnadu' | 'all'>('tamilnadu');

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>(initialSelectedState || 'Tamil Nadu');
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState<string>(initialSelectedDistrict || 'all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedPollutantFilter, setSelectedPollutantFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'highest' | 'lowest' | 'alphabetical'>('highest');

  // Data States
  const [stations, setStations] = useState<AirMonitoringStation[]>([]);
  const [isLoadingStations, setIsLoadingStations] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [selectedStation, setSelectedStation] = useState<AirMonitoringStation | null>(null);

  // Map States
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routePolylinesLayerRef = useRef<L.LayerGroup | null>(null);
  const baseMapTileRef = useRef<L.TileLayer | null>(null);
  const [baseMapStyle, setBaseMapStyle] = useState<BaseMapStyle>('esri_street');
  const [showHotspotHalos, setShowHotspotHalos] = useState<boolean>(true);

  // Route Finder States
  const [selectedPreset, setSelectedPreset] = useState<string>('chn-airport');
  const [startPoint, setStartPoint] = useState<{ name: string; lat: number; lon: number }>(COMMUTER_PRESETS[0].start);
  const [endPoint, setEndPoint] = useState<{ name: string; lat: number; lon: number }>(COMMUTER_PRESETS[0].end);
  const [routeTravelMode, setRouteTravelMode] = useState<'driving' | 'cycling'>('driving');
  const [evaluatedRoutes, setEvaluatedRoutes] = useState<EvaluatedRoute[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('route-2');
  const [isCalculatingRoutes, setIsCalculatingRoutes] = useState<boolean>(false);
  const [routeRecommendation, setRouteRecommendation] = useState<{
    cleanestRouteId: string;
    cleanestRouteName: string;
    exposureReductionPercent: number;
    rationale: string;
  } | null>(null);
  const [routingProviderName, setRoutingProviderName] = useState<string>('OSRM (Open Source Routing Machine)');

  // Fetch Live WAQI / CAAQMS Monitoring Stations from API
  const fetchStations = useCallback(async (force = false) => {
    setIsLoadingStations(true);
    try {
      const url = `/api/map/stations?region=all${force ? '&refresh=true' : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.stations)) {
          setStations(data.stations);
          setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      }
    } catch (err) {
      console.error('Failed to load live pollution station telemetry:', err);
    } finally {
      setIsLoadingStations(false);
    }
  }, []);

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  // Sync region mode with state filter
  useEffect(() => {
    if (regionMode === 'tamilnadu') {
      setSelectedStateFilter('Tamil Nadu');
    } else {
      setSelectedStateFilter('all');
    }
    setSelectedDistrictFilter('all');
  }, [regionMode]);

  // Available districts for the selected state
  const availableDistricts = useMemo(() => {
    const stateName = selectedStateFilter === 'all' ? 'Tamil Nadu' : selectedStateFilter;
    const stateObj = INDIAN_STATES.find((s) => s.name === stateName);
    return stateObj ? stateObj.districts.map((d) => d.name) : [];
  }, [selectedStateFilter]);

  // Filtered stations based on user selections
  const filteredStations = useMemo(() => {
    return stations.filter((st) => {
      // Region / State filter
      if (regionMode === 'tamilnadu' && st.state !== 'Tamil Nadu') return false;
      if (selectedStateFilter !== 'all' && st.state !== selectedStateFilter) return false;

      // District filter
      if (selectedDistrictFilter !== 'all') {
        const dQuery = selectedDistrictFilter.toLowerCase();
        const matchesDistrict = (st.district && st.district.toLowerCase().includes(dQuery)) ||
                                (st.city && st.city.toLowerCase().includes(dQuery));
        if (!matchesDistrict) return false;
      }

      // AQI Category filter
      if (selectedCategoryFilter !== 'all') {
        const cat = getAQIColorInfo(st.aqi).category.toLowerCase();
        if (!cat.includes(selectedCategoryFilter.toLowerCase())) return false;
      }

      // Dominant Pollutant filter
      if (selectedPollutantFilter !== 'all') {
        if (st.dominantPollutant?.toLowerCase() !== selectedPollutantFilter.toLowerCase()) return false;
      }

      // Search Query (matches city, station name, or district)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          st.city.toLowerCase().includes(q) ||
          st.stationName.toLowerCase().includes(q) ||
          (st.district && st.district.toLowerCase().includes(q)) ||
          (st.state && st.state.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortOrder === 'highest') return b.aqi - a.aqi;
      if (sortOrder === 'lowest') return a.aqi - b.aqi;
      return a.stationName.localeCompare(b.stationName);
    });
  }, [
    stations,
    regionMode,
    selectedStateFilter,
    selectedDistrictFilter,
    selectedCategoryFilter,
    selectedPollutantFilter,
    searchQuery,
    sortOrder,
  ]);

  // Top Ranked Hotspots (Highest AQI stations)
  const topHotspots = useMemo(() => {
    return [...filteredStations].sort((a, b) => b.aqi - a.aqi).slice(0, 10);
  }, [filteredStations]);

  // District Aggregation (Arithmetic mean of active CAAQMS stations per district)
  const districtRankings = useMemo(() => {
    const map = new Map<string, { totalAqi: number; count: number; maxAqi: number; peakStation: string; dominantPollutants: string[] }>();

    filteredStations.forEach((st) => {
      const distName = st.district || st.city;
      if (!distName) return;

      const existing = map.get(distName) || {
        totalAqi: 0,
        count: 0,
        maxAqi: 0,
        peakStation: st.stationName,
        dominantPollutants: [],
      };

      existing.totalAqi += st.aqi;
      existing.count += 1;
      if (st.aqi >= existing.maxAqi) {
        existing.maxAqi = st.aqi;
        existing.peakStation = st.stationName;
      }
      if (st.dominantPollutant) existing.dominantPollutants.push(st.dominantPollutant);

      map.set(distName, existing);
    });

    const list = Array.from(map.entries()).map(([district, stats]) => {
      const avgAqi = Math.round(stats.totalAqi / stats.count);
      return {
        district,
        avgAqi,
        maxAqi: stats.maxAqi,
        peakStation: stats.peakStation,
        stationCount: stats.count,
        colorInfo: getAQIColorInfo(avgAqi),
      };
    });

    return list.sort((a, b) => b.avgAqi - a.avgAqi);
  }, [filteredStations]);

  // Metrics Overview Calculations
  const overviewMetrics = useMemo(() => {
    if (filteredStations.length === 0) {
      return {
        totalStations: 0,
        highestAqi: 0,
        highestStation: null,
        unhealthyCount: 0,
        cleanestAqi: 0,
        cleanestStation: null,
      };
    }

    const sorted = [...filteredStations].sort((a, b) => b.aqi - a.aqi);
    const highest = sorted[0];
    const lowest = sorted[sorted.length - 1];
    const unhealthy = sorted.filter((s) => s.aqi > 100).length;

    return {
      totalStations: filteredStations.length,
      highestAqi: highest.aqi,
      highestStation: highest,
      unhealthyCount: unhealthy,
      cleanestAqi: lowest.aqi,
      cleanestStation: lowest,
    };
  }, [filteredStations]);

  // Calculate Clean-Air Routes using backend proxy (OSRM + CAAQMS Telemetry Evaluation)
  const calculateCleanAirRoutes = useCallback(async () => {
    setIsCalculatingRoutes(true);
    try {
      const res = await fetch('/api/routes/clean-air', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startLat: startPoint.lat,
          startLon: startPoint.lon,
          endLat: endPoint.lat,
          endLon: endPoint.lon,
          mode: routeTravelMode,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.routes) && data.routes.length > 0) {
          setEvaluatedRoutes(data.routes);
          if (data.recommendation) {
            setRouteRecommendation(data.recommendation);
            setSelectedRouteId(data.recommendation.cleanestRouteId);
          } else {
            setSelectedRouteId(data.routes[0].id);
          }
          if (data.routingProvider) {
            setRoutingProviderName(data.routingProvider);
          }
        }
      }
    } catch (err) {
      console.error('Failed to calculate clean-air routes:', err);
    } finally {
      setIsCalculatingRoutes(false);
    }
  }, [startPoint, endPoint, routeTravelMode]);

  // Preset Selection Handler
  const handleSelectPreset = (presetId: string) => {
    const preset = COMMUTER_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setSelectedPreset(preset.id);
      setStartPoint(preset.start);
      setEndPoint(preset.end);
    }
  };

  // Trigger route calculation on preset change or when switching to routes tab
  useEffect(() => {
    if (activeSubTab === 'routes') {
      calculateCleanAirRoutes();
    }
  }, [activeSubTab, startPoint, endPoint, routeTravelMode, calculateCleanAirRoutes]);

  // Initialize and Sync Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = regionMode === 'tamilnadu' ? 11.1271 : 20.5937;
      const initialLon = regionMode === 'tamilnadu' ? 78.6569 : 78.9629;
      const initialZoom = regionMode === 'tamilnadu' ? 7 : 5;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLon],
        zoom: initialZoom,
        zoomControl: true,
      });

      const provider = BASE_MAP_PROVIDERS[baseMapStyle];
      const tileLayer = L.tileLayer(provider.url, {
        attribution: provider.attribution,
        maxZoom: provider.maxZoom,
      });
      tileLayer.addTo(map);
      baseMapTileRef.current = tileLayer;

      markersLayerRef.current = L.layerGroup().addTo(map);
      routePolylinesLayerRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [regionMode]);

  // Update Base Map Style
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (baseMapTileRef.current) {
      mapInstanceRef.current.removeLayer(baseMapTileRef.current);
    }
    const provider = BASE_MAP_PROVIDERS[baseMapStyle];
    const newLayer = L.tileLayer(provider.url, {
      attribution: provider.attribution,
      maxZoom: provider.maxZoom,
    });
    newLayer.addTo(mapInstanceRef.current);
    baseMapTileRef.current = newLayer;
  }, [baseMapStyle]);

  // Render Hotspot Markers and Halos on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = markersLayerRef.current;
    if (!map || !group) return;

    group.clearLayers();

    filteredStations.forEach((st) => {
      const colorInfo = getAQIColorInfo(st.aqi);
      const isSevereHotspot = st.aqi > 150;
      const isSelected = selectedStation?.id === st.id;

      // Pulsing Halo for severe hotspots
      if (showHotspotHalos && isSevereHotspot) {
        const halo = L.circle([st.latitude, st.longitude], {
          radius: 12000,
          color: colorInfo.hex,
          fillColor: colorInfo.hex,
          fillOpacity: 0.18,
          weight: 1.5,
          dashArray: '4, 4',
        });
        group.addLayer(halo);
      }

      // Station Beacon Marker
      const markerHtml = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          ${
            isSevereHotspot
              ? `<div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: ${colorInfo.hex}; opacity: 0.4; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
              : ''
          }
          <div style="
            width: ${isSelected ? '28px' : '22px'};
            height: ${isSelected ? '28px' : '22px'};
            border-radius: 50%;
            background: ${colorInfo.hex};
            border: 2px solid #ffffff;
            box-shadow: 0 4px 10px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: 10px;
            font-weight: 800;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            transition: transform 0.2s ease;
            transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'};
          ">
            ${st.aqi}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'aqi-hotspot-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([st.latitude, st.longitude], { icon: customIcon });

      marker.on('click', () => {
        setSelectedStation(st);
        map.setView([st.latitude, st.longitude], 13, { animate: true });
      });

      // Tooltip
      marker.bindTooltip(
        `<div style="font-size: 11px; padding: 2px 4px;">
          <strong>${st.stationName}</strong> (${st.city})<br/>
          AQI: <b style="color: ${colorInfo.hex};">${st.aqi} • ${colorInfo.category}</b><br/>
          PM2.5: <b>${st.pollutants?.pm25 ?? 'N/A'} µg/m³</b> • Dominant: ${st.dominantPollutant || 'PM2.5'}
        </div>`,
        { direction: 'top', offset: [0, -14] }
      );

      group.addLayer(marker);
    });
  }, [filteredStations, selectedStation, showHotspotHalos]);

  // Render Route Polylines when in "routes" mode
  useEffect(() => {
    const map = mapInstanceRef.current;
    const routeGroup = routePolylinesLayerRef.current;
    if (!map || !routeGroup) return;

    routeGroup.clearLayers();

    if (activeSubTab !== 'routes' || evaluatedRoutes.length === 0) return;

    // Add Start and End Markers
    const startIcon = L.divIcon({
      html: `
        <div style="background: #10B981; color: white; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
          A
        </div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });
    const endIcon = L.divIcon({
      html: `
        <div style="background: #EF4444; color: white; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
          B
        </div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });

    const startMarker = L.marker([startPoint.lat, startPoint.lon], { icon: startIcon }).bindTooltip(`<b>Start:</b> ${startPoint.name}`);
    const endMarker = L.marker([endPoint.lat, endPoint.lon], { icon: endIcon }).bindTooltip(`<b>Destination:</b> ${endPoint.name}`);
    routeGroup.addLayer(startMarker);
    routeGroup.addLayer(endMarker);

    // Draw Routes
    const bounds = L.latLngBounds([
      [startPoint.lat, startPoint.lon],
      [endPoint.lat, endPoint.lon],
    ]);

    evaluatedRoutes.forEach((r) => {
      const isSelected = r.id === selectedRouteId;
      const isRecommended = r.isRecommended;

      // Color: Emerald for Clean Air Route, Amber/Red for Arterial Route
      const routeColor = isRecommended ? '#10B981' : '#F97316';

      const polyline = L.polyline(r.coordinates, {
        color: routeColor,
        weight: isSelected ? 6 : 4,
        opacity: isSelected ? 0.95 : 0.5,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: isRecommended ? undefined : '6, 6',
      });

      polyline.on('click', () => {
        setSelectedRouteId(r.id);
      });

      polyline.bindTooltip(
        `<strong>${r.name}</strong><br/>Avg AQI: <b>${r.avgAqi}</b> • ${r.distanceKm} km • ${r.durationMins} mins`,
        { sticky: true }
      );

      routeGroup.addLayer(polyline);

      r.coordinates.forEach(([lat, lon]) => bounds.extend([lat, lon]));
    });

    map.fitBounds(bounds, { padding: [40, 40], animate: true });
  }, [activeSubTab, evaluatedRoutes, selectedRouteId, startPoint, endPoint]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header & Navigation Toolbar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-rose-600 via-orange-600 to-amber-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20 shrink-0">
            <Flame className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Pollution Hotspots & Clean-Air Route Finder
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                <Activity className="w-3 h-3 text-rose-500 animate-pulse" />
                Live WAQI Intelligence
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
              Pinpoint high-exposure industrial and vehicular pollution clusters across Tamil Nadu & India, rank district severity, and compare lower-pollution commuter travel routes.
            </p>
          </div>
        </div>

        {/* Tab & Region Quick Switches */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
          {/* Main SubTab Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveSubTab('hotspots')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'hotspots'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-rose-500" />
              <span>Hotspot Map & Rankings</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('routes')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'routes'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <RouteIcon className="w-3.5 h-3.5 text-emerald-200" />
              <span>Clean-Air Route Finder</span>
            </button>
          </div>

          {/* Region Switcher: Tamil Nadu vs All India */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => setRegionMode('tamilnadu')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                regionMode === 'tamilnadu'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Focus exclusively on Tamil Nadu state & its 38 districts"
            >
              🌟 Tamil Nadu Focus
            </button>
            <button
              type="button"
              onClick={() => setRegionMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                regionMode === 'all'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Expand coverage across all 28 states and union territories in India"
            >
              🇮🇳 All India
            </button>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => fetchStations(true)}
            disabled={isLoadingStations}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 hover:text-sky-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            title="Refresh Live WAQI Station Telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStations ? 'animate-spin text-sky-600' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Top Live Pollution Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Reporting Stations */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Stations
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900 font-mono">
                {overviewMetrics.totalStations}
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                {regionMode === 'tamilnadu' ? 'Tamil Nadu CAAQMS' : 'National Grid'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Refreshed: {lastRefreshed || 'Real-Time'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Severe Hotspot Peak */}
        <div className="bg-white rounded-2xl p-4 border border-rose-200 bg-gradient-to-br from-white to-rose-50/30 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider block flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-rose-600" />
              Peak Hotspot AQI
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-rose-600 font-mono">
                {overviewMetrics.highestAqi || '--'}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                {overviewMetrics.highestStation ? getAQIColorInfo(overviewMetrics.highestAqi).category : 'Moderate'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 font-semibold truncate max-w-[190px] mt-1" title={overviewMetrics.highestStation?.stationName}>
              📍 {overviewMetrics.highestStation?.city || 'Chennai'} ({overviewMetrics.highestStation?.district || 'TN'})
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Stations in Unhealthy Categories */}
        <div className="bg-white rounded-2xl p-4 border border-amber-200 bg-gradient-to-br from-white to-amber-50/30 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
              Above Safe Limits (AQI &gt; 100)
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-amber-600 font-mono">
                {overviewMetrics.unhealthyCount}
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                of {overviewMetrics.totalStations} stations
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Requires sensitive group precautions
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Cleanest Sanctuary */}
        <div className="bg-white rounded-2xl p-4 border border-emerald-200 bg-gradient-to-br from-white to-emerald-50/30 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              Cleanest Location
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-600 font-mono">
                {overviewMetrics.cleanestAqi || '--'}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Good
              </span>
            </div>
            <p className="text-[11px] text-slate-600 font-semibold truncate max-w-[190px] mt-1" title={overviewMetrics.cleanestStation?.stationName}>
              🌿 {overviewMetrics.cleanestStation?.city || 'Ooty'} ({overviewMetrics.cleanestStation?.state || 'TN'})
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. SUBTAB CONTENT 1: Hotspot Map & Analytics */}
      {activeSubTab === 'hotspots' && (
        <div className="space-y-6">
          {/* Filter & Search Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
              {/* Search Box */}
              <div className="relative min-w-[200px] flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search city, district, station..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* State Filter (When in All-India mode) */}
              {regionMode === 'all' && (
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
                  <span className="text-[11px] font-bold text-slate-400">State:</span>
                  <select
                    value={selectedStateFilter}
                    onChange={(e) => {
                      setSelectedStateFilter(e.target.value);
                      setSelectedDistrictFilter('all');
                    }}
                    className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
                  >
                    <option value="all">All States</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* District Filter */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
                <span className="text-[11px] font-bold text-slate-400">District:</span>
                <select
                  value={selectedDistrictFilter}
                  onChange={(e) => setSelectedDistrictFilter(e.target.value)}
                  className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none cursor-pointer max-w-[150px] truncate"
                >
                  <option value="all">All Districts ({availableDistricts.length})</option>
                  {availableDistricts.map((d: string) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* AQI Severity Filter */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
                <span className="text-[11px] font-bold text-slate-400">Severity:</span>
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  <option value="good">0–50 Good</option>
                  <option value="moderate">51–100 Moderate</option>
                  <option value="sensitive">101–150 Sensitive (USG)</option>
                  <option value="unhealthy">151–200 Unhealthy</option>
                  <option value="very">201–300 Very Unhealthy</option>
                  <option value="hazardous">300+ Hazardous</option>
                </select>
              </div>

              {/* Dominant Pollutant Filter */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
                <span className="text-[11px] font-bold text-slate-400">Driver:</span>
                <select
                  value={selectedPollutantFilter}
                  onChange={(e) => setSelectedPollutantFilter(e.target.value)}
                  className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="all">All Pollutants</option>
                  <option value="pm25">PM2.5</option>
                  <option value="pm10">PM10</option>
                  <option value="no2">NO₂ (Nitrogen Dioxide)</option>
                  <option value="so2">SO₂ (Sulfur Dioxide)</option>
                  <option value="o3">O₃ (Ozone)</option>
                  <option value="co">CO (Carbon Monoxide)</option>
                </select>
              </div>
            </div>

            {/* Sort Order & Hotspot Halos Toggle */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowHotspotHalos(!showHotspotHalos)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  showHotspotHalos
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}
                title="Toggle visual radar halos around severe pollution hotspots"
              >
                Hotspot Halos: {showHotspotHalos ? 'ON' : 'OFF'}
              </button>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 cursor-pointer focus:outline-none"
              >
                <option value="highest">Sort: Highest AQI First</option>
                <option value="lowest">Sort: Lowest AQI First</option>
                <option value="alphabetical">Sort: Alphabetical</option>
              </select>
            </div>
          </div>

          {/* Interactive Map & Selected Station Sidebar */}
          <div className="relative w-full h-[520px] lg:h-[600px] rounded-3xl bg-slate-900 border border-slate-200 shadow-lg overflow-hidden">
            {/* Map Canvas */}
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* Map Top Bar Controls */}
            <div className="absolute top-4 left-4 z-[400] flex items-center gap-2">
              {/* Tile Provider Switcher */}
              <div className="flex items-center p-0.5 rounded-xl bg-white/90 backdrop-blur-md border border-slate-200 shadow-md">
                <button
                  type="button"
                  onClick={() => setBaseMapStyle('esri_street')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    baseMapStyle === 'esri_street' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Streets
                </button>
                <button
                  type="button"
                  onClick={() => setBaseMapStyle('osm')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    baseMapStyle === 'osm' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  OSM
                </button>
                <button
                  type="button"
                  onClick={() => setBaseMapStyle('satellite')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    baseMapStyle === 'satellite' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Satellite
                </button>
              </div>

              {/* Station Count Pill */}
              <div className="px-3 py-1 rounded-xl bg-white/90 backdrop-blur-md border border-slate-200 text-xs font-bold text-slate-800 shadow-md">
                Showing {filteredStations.length} of {stations.length} Stations
              </div>
            </div>

            {/* Map Bottom Legend */}
            <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200 shadow-md flex flex-wrap items-center gap-2.5 text-[10px] font-semibold text-slate-700">
              <span className="font-bold text-slate-900 uppercase">AQI Scale:</span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>0-50 Good</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>51-100 Mod</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span>101-150 USG</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>151-200 Unhealthy</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                <span>201-300 Very</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-950" />
                <span>300+ Hazardous</span>
              </span>
            </div>

            {/* Floating Station Telemetry Detail Drawer */}
            {selectedStation && (
              <div className="absolute top-4 right-4 z-[450] w-80 sm:w-96 max-h-[92%] overflow-y-auto p-4 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700 text-white shadow-2xl space-y-3 animate-in fade-in slide-in-from-right-4 duration-200 scrollbar-none">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-sky-400 font-bold">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{selectedStation.city}, {selectedStation.district || selectedStation.state}</span>
                    </div>
                    <h3 className="text-sm font-black text-white mt-0.5 leading-snug">
                      {selectedStation.stationName}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedStation(null)}
                    className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* AQI Metric Gauge Header */}
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Live Station AQI</span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-3xl font-black font-mono text-white">
                        {selectedStation.aqi}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getAQIColorInfo(selectedStation.aqi).badgeBg}`}>
                        {getAQIColorInfo(selectedStation.aqi).category}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Primary Driver</span>
                    <p className="text-xs font-mono font-bold text-amber-400 mt-0.5 uppercase">
                      {selectedStation.dominantPollutant || 'PM2.5'}
                    </p>
                  </div>
                </div>

                {/* Criteria Pollutants Grid */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                    Live Criteria Pollutants (µg/m³)
                  </span>
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                      <span className="text-[10px] text-slate-400 block font-mono">PM2.5</span>
                      <span className="text-xs font-bold font-mono text-white">
                        {selectedStation.pollutants?.pm25 ?? 'N/A'}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                      <span className="text-[10px] text-slate-400 block font-mono">PM10</span>
                      <span className="text-xs font-bold font-mono text-white">
                        {selectedStation.pollutants?.pm10 ?? 'N/A'}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                      <span className="text-[10px] text-slate-400 block font-mono">NO₂</span>
                      <span className="text-xs font-bold font-mono text-white">
                        {selectedStation.pollutants?.no2 ?? 'N/A'}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                      <span className="text-[10px] text-slate-400 block font-mono">SO₂</span>
                      <span className="text-xs font-bold font-mono text-white">
                        {selectedStation.pollutants?.so2 ?? 'N/A'}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                      <span className="text-[10px] text-slate-400 block font-mono">O₃</span>
                      <span className="text-xs font-bold font-mono text-white">
                        {selectedStation.pollutants?.o3 ?? 'N/A'}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                      <span className="text-[10px] text-slate-400 block font-mono">CO</span>
                      <span className="text-xs font-bold font-mono text-white">
                        {selectedStation.pollutants?.co ?? 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Health Advisory Statement */}
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
                  <span className="font-bold text-amber-400 block mb-0.5">Precautionary Guidance:</span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {getAQIColorInfo(selectedStation.aqi).desc}
                  </p>
                </div>

                {/* Metadata & Operating Agency */}
                <div className="text-[10px] text-slate-400 space-y-0.5 pt-1 border-t border-slate-800">
                  <p>
                    <span className="font-semibold text-slate-300">Station Type:</span> {selectedStation.stationType || 'Continuous Ambient CAAQMS'}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-300">Operating Agency:</span> {selectedStation.operatingAgency || 'TNPCB / CPCB'}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-300">Coordinates:</span> {selectedStation.latitude.toFixed(4)}°N, {selectedStation.longitude.toFixed(4)}°E
                  </p>
                </div>

                {onSelectCity && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectCity({
                        name: selectedStation.city,
                        country: selectedStation.country,
                        admin1: selectedStation.state || '',
                        latitude: selectedStation.latitude,
                        longitude: selectedStation.longitude,
                      });
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    <span>View in Main Dashboard Overview</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 4. Two-Column Analytics: Top Hotspots vs District Rankings */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Ranked Hotspots Leaderboard (7 Cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-rose-600" />
                    <span>Top Pollution Hotspots Leaderboard</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ranked by highest live ambient AQI measurements across active monitoring stations.
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600">
                  Top {topHotspots.length} Reporting
                </span>
              </div>

              <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto pr-1">
                {topHotspots.map((st, index) => {
                  const colorInfo = getAQIColorInfo(st.aqi);
                  return (
                    <div
                      key={st.id}
                      onClick={() => {
                        setSelectedStation(st);
                        if (mapInstanceRef.current) {
                          mapInstanceRef.current.setView([st.latitude, st.longitude], 13, { animate: true });
                        }
                      }}
                      className="py-3 px-2 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Rank Badge */}
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                            index === 0
                              ? 'bg-rose-600 text-white shadow-xs'
                              : index === 1
                              ? 'bg-orange-500 text-white shadow-xs'
                              : index === 2
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          #{index + 1}
                        </span>

                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 group-hover:text-sky-600 transition-colors truncate">
                            {st.stationName}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            📍 {st.city}, {st.district || st.state} • <span className="font-medium text-slate-400">{st.operatingAgency || 'CAAQMS'}</span>
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                            <span>PM2.5: <b className="text-slate-700">{st.pollutants?.pm25 ?? 'N/A'} µg/m³</b></span>
                            <span>•</span>
                            <span>Driver: <b className="text-rose-600 uppercase">{st.dominantPollutant || 'PM2.5'}</b></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black font-mono inline-block ${colorInfo.badgeBg}`}>
                            {st.aqi} AQI
                          </span>
                          <span className="block text-[10px] font-semibold text-slate-500 mt-0.5">
                            {colorInfo.category}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-sky-600 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: District Pollution Rankings & Aggregation (5 Cols) */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-sky-600" />
                    <span>District Severity Ranking</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Aggregated arithmetic mean of contributing CAAQMS telemetry per district boundary.
                  </p>
                </div>
              </div>

              {/* Aggregation Documentation Callout */}
              <div className="p-3 rounded-xl bg-sky-50 border border-sky-100 text-[11px] text-sky-800 space-y-1">
                <span className="font-bold flex items-center gap-1 text-sky-900">
                  <Info className="w-3.5 h-3.5" />
                  Aggregation Methodology Disclosure:
                </span>
                <p className="text-sky-700 leading-relaxed">
                  District AQI values represent the arithmetic mean of contributing active CAAQMS monitoring stations within each administrative district boundary. Individual stations reflect localized microclimates.
                </p>
              </div>

              {/* District Table */}
              <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto">
                {districtRankings.map((d, idx) => (
                  <div
                    key={d.district}
                    onClick={() => {
                      setSelectedDistrictFilter(d.district);
                      const matched = filteredStations.find((s) => s.district === d.district || s.city === d.district);
                      if (matched && mapInstanceRef.current) {
                        mapInstanceRef.current.setView([matched.latitude, matched.longitude], 11, { animate: true });
                      }
                    }}
                    className="py-2.5 px-2 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer group text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-slate-400 font-bold w-5 shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="truncate">
                        <p className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors truncate">
                          {d.district}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {d.stationCount} {d.stationCount === 1 ? 'Station' : 'Stations'} reporting • Peak: {d.maxAqi}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${d.colorInfo.badgeBg}`}>
                        {d.avgAqi}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 w-20 truncate text-right">
                        {d.colorInfo.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. SUBTAB CONTENT 2: Clean-Air Route Finder */}
      {activeSubTab === 'routes' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Commuter Route Configuration Bar */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <RouteIcon className="w-5 h-5 text-emerald-600" />
                  <span>Clean-Air Navigation & Commuter Route Comparison</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Calculates alternative driving or two-wheeler routes, evaluates nearby CAAQMS station pollution readings along each path, and recommends the lower-pollution exposure route.
                </p>
              </div>

              {/* Routing Service Provider Status Badge */}
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-800 shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Engine: {routingProviderName}</span>
              </div>
            </div>

            {/* Quick Presets Carousel */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Quick Commute Presets:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {COMMUTER_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      selectedPreset === p.id
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    📍 {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Origin & Destination Coordinate Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-slate-100">
              <div className="md:col-span-5 relative">
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  🟢 Origin / Starting Point:
                </label>
                <input
                  type="text"
                  value={startPoint.name}
                  onChange={(e) => setStartPoint({ ...startPoint, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="md:col-span-5 relative">
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  🏁 Destination / End Point:
                </label>
                <input
                  type="text"
                  value={endPoint.name}
                  onChange={(e) => setEndPoint({ ...endPoint, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="md:col-span-2 flex items-end">
                <button
                  type="button"
                  onClick={calculateCleanAirRoutes}
                  disabled={isCalculatingRoutes}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCalculatingRoutes ? 'animate-spin' : ''}`} />
                  <span>{isCalculatingRoutes ? 'Comparing...' : 'Recalculate'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Route Recommendation Banner */}
          {routeRecommendation && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-sky-600 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-yellow-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                      Recommended Route Verdict
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white text-emerald-800">
                      -{routeRecommendation.exposureReductionPercent}% Less Exposure
                    </span>
                  </div>
                  <h4 className="text-sm font-black mt-0.5">
                    {routeRecommendation.cleanestRouteName}
                  </h4>
                  <p className="text-xs text-emerald-50 mt-0.5 max-w-2xl leading-relaxed">
                    {routeRecommendation.rationale}
                  </p>
                </div>
              </div>

              <div className="bg-white/15 px-3 py-2 rounded-xl text-center shrink-0">
                <span className="text-[10px] font-bold text-emerald-100 block uppercase">Clean Air Advantage</span>
                <span className="text-xl font-black font-mono">{routeRecommendation.exposureReductionPercent}%</span>
                <span className="text-[10px] block text-emerald-100">Lower PM2.5 Inhaled</span>
              </div>
            </div>
          )}

          {/* Interactive Route Map & Alternative Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Alternative Route Cards (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Calculated Route Options:
              </h3>

              {evaluatedRoutes.map((route) => {
                const isSelected = selectedRouteId === route.id;
                const isRecommended = route.isRecommended;

                return (
                  <div
                    key={route.id}
                    onClick={() => setSelectedRouteId(route.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? isRecommended
                          ? 'bg-emerald-50/50 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                          : 'bg-amber-50/50 border-amber-500 shadow-md ring-2 ring-amber-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {isRecommended && (
                      <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white shadow-xs flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        CLEANEST AIR ROUTE
                      </span>
                    )}

                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          {route.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {route.roadType}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                          isRecommended ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          AQI {route.avgAqi}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Peak: {route.maxAqi}
                        </span>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-center text-xs">
                      <div className="bg-white/80 p-1.5 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 block">Distance</span>
                        <span className="font-bold text-slate-800 font-mono">{route.distanceKm} km</span>
                      </div>
                      <div className="bg-white/80 p-1.5 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 block">Est. Time</span>
                        <span className="font-bold text-slate-800 font-mono">{route.durationMins} mins</span>
                      </div>
                      <div className="bg-white/80 p-1.5 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 block">PM2.5 Exposure</span>
                        <span className={`font-bold font-mono ${isRecommended ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {route.avgPm25} µg/m³
                        </span>
                      </div>
                    </div>

                    {/* Contributing Stations on Route */}
                    {route.nearbyStations.length > 0 && (
                      <div className="mt-3 pt-2 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700">Stations along corridor: </span>
                        {route.nearbyStations.map((s, idx) => (
                          <span key={s.id}>
                            {s.stationName} (AQI {s.aqi}){idx < route.nearbyStations.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Commuter Health Recommendations Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-sky-600" />
                  Commuter Pollution Reduction Guidelines:
                </span>
                <ul className="space-y-1.5 text-slate-600 text-[11px] leading-relaxed list-disc list-inside">
                  <li>
                    <strong>Car Cabins:</strong> Activate internal cabin air recirculation (recirculate mode) to prevent roadside diesel particulates from entering.
                  </li>
                  <li>
                    <strong>Two-Wheelers & Cyclists:</strong> Always wear a certified N95 or FFP2 respirator mask when taking arterial transit corridors during peak traffic.
                  </li>
                  <li>
                    <strong>Thermal Inversion Window:</strong> Ground-level pollution peaks between 7:00 AM and 9:30 AM. Planning commutes 30 minutes earlier or later avoids maximum particulate concentration.
                  </li>
                </ul>
              </div>
            </div>

            {/* Interactive Leaflet Route Map (7 Cols) */}
            <div className="lg:col-span-7 relative h-[500px] lg:h-[620px] rounded-3xl bg-slate-900 border border-slate-200 shadow-lg overflow-hidden">
              <div ref={mapContainerRef} className="w-full h-full" />

              {/* Map Route Legend Floating Overlay */}
              <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-md text-xs space-y-1">
                <span className="font-bold text-slate-900 block text-[11px]">Map Route Key:</span>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[11px] text-slate-700 font-semibold">Recommended Clean-Air Route (Lower Exposure)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-1.5 rounded-full bg-orange-500 border border-dashed" />
                  <span className="text-[11px] text-slate-700 font-semibold">Primary Highway Corridor (High Particulate Exposure)</span>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="absolute top-4 left-4 z-[400] max-w-sm bg-white/90 backdrop-blur-md p-2 rounded-xl border border-slate-200 text-[10px] text-slate-600 shadow-md">
                <strong>Notice:</strong> Route AQI readings are calculated using ambient CAAQMS sensors within 4 km of the road network and serve as an indicative comparative guide.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
