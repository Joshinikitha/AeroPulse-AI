import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';
import {
  Globe,
  MapPin,
  Compass,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Activity,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  Info,
  Maximize2,
  CheckCircle2,
  ExternalLink,
  Search,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  X,
  Play,
  Pause,
  ArrowLeft,
  Wind,
  Thermometer,
  Droplets,
  RefreshCw,
  Eye,
  Sliders,
  Radio,
  Navigation,
} from 'lucide-react';
import { AirMonitoringStation, CityLocation } from '../types';
import { GLOBAL_AQI_LOCATIONS, toAirMonitoringStation } from '../data/globalLocations';
import { BASE_MAP_PROVIDERS, BaseMapStyle } from './IndiaTamilNaduMap';

export interface UnifiedGlobeMapProps {
  onSelectCity?: (city: CityLocation) => void;
  initialFocus?: {
    lat: number;
    lon: number;
    zoom: number;
    name?: string;
  } | null;
}

export function getAQIColorCss(aqi: number): {
  bg: string;
  text: string;
  border: string;
  label: string;
  hex: string;
} {
  if (aqi <= 50) {
    return {
      bg: 'bg-emerald-500',
      text: 'text-emerald-400',
      border: 'border-emerald-500/40',
      label: 'Good',
      hex: '#10b981',
    };
  }
  if (aqi <= 100) {
    return {
      bg: 'bg-yellow-500',
      text: 'text-yellow-400',
      border: 'border-yellow-500/40',
      label: 'Moderate',
      hex: '#eab308',
    };
  }
  if (aqi <= 150) {
    return {
      bg: 'bg-orange-500',
      text: 'text-orange-400',
      border: 'border-orange-500/40',
      label: 'Unhealthy for Sensitive',
      hex: '#f97316',
    };
  }
  if (aqi <= 200) {
    return {
      bg: 'bg-red-500',
      text: 'text-red-400',
      border: 'border-red-500/40',
      label: 'Unhealthy',
      hex: '#ef4444',
    };
  }
  if (aqi <= 300) {
    return {
      bg: 'bg-purple-600',
      text: 'text-purple-400',
      border: 'border-purple-500/40',
      label: 'Very Unhealthy',
      hex: '#9333ea',
    };
  }
  return {
    bg: 'bg-rose-900',
    text: 'text-rose-400',
    border: 'border-rose-700/50',
    label: 'Hazardous',
    hex: '#881337',
  };
}

// Continents vectorized coordinates for 3D sphere projection
const CONTINENT_POLYGONS: [number, number][][] = [
  // Indian Subcontinent
  [
    [35, 74], [34, 78], [32, 80], [28, 88], [27, 92], [28, 97],
    [24, 94], [22, 90], [22, 86], [19, 85], [16, 82], [13, 80],
    [10, 79], [8.1, 77.5], [10, 76], [13, 74.8], [15, 73.8], [19, 72.8],
    [21, 72.5], [23, 69], [25, 68], [28, 70], [32, 73], [35, 74]
  ],
  // Tamil Nadu Region
  [
    [13.5, 80.3], [12, 80], [10.5, 79.8], [9.2, 79.2], [8.1, 77.5],
    [8.5, 77.2], [10, 76.5], [11.5, 76.6], [12.8, 78.5], [13.5, 80.3]
  ],
  // Africa
  [
    [37, 10], [32, 32], [27, 34], [12, 44], [10, 51], [0, 42],
    [-11, 40], [-25, 33], [-34, 26], [-34, 18], [-23, 14], [-12, 13],
    [-5, 12], [4, 9], [6, 2], [5, -4], [10, -14], [15, -17],
    [21, -17], [28, -10], [35, -6], [36, 1], [37, 10]
  ],
  // Europe
  [
    [36, -9], [43, -9], [44, -1], [48, -5], [51, 2], [54, 8],
    [58, 6], [62, 5], [71, 28], [67, 34], [60, 30], [55, 21],
    [45, 14], [40, 18], [38, 24], [40, 26], [45, 29], [42, 28],
    [36, 22], [36, -5], [36, -9]
  ],
  // Asia
  [
    [71, 30], [77, 105], [70, 170], [60, 165], [54, 140], [45, 135],
    [40, 128], [36, 120], [30, 122], [22, 114], [21, 107], [10, 104],
    [1, 103], [8, 98], [16, 96], [22, 92], [27, 88], [32, 70],
    [40, 55], [42, 38], [55, 38], [60, 50], [65, 60], [71, 30]
  ],
  // North America
  [
    [70, -160], [72, -130], [70, -85], [60, -65], [47, -53], [44, -66],
    [35, -75], [25, -80], [22, -97], [16, -93], [8, -77], [14, -92],
    [20, -105], [30, -115], [34, -120], [40, -124], [49, -125],
    [58, -136], [60, -148], [65, -168], [70, -160]
  ],
  // South America
  [
    [11, -74], [10, -62], [5, -52], [-3, -40], [-8, -35], [-18, -39],
    [-23, -44], [-33, -53], [-42, -64], [-53, -68], [-55, -73],
    [-45, -75], [-35, -73], [-20, -70], [-5, -81], [5, -77], [11, -74]
  ],
  // Australia
  [
    [-12, 132], [-14, 142], [-22, 150], [-28, 153], [-37, 150],
    [-38, 145], [-35, 137], [-32, 132], [-35, 117], [-30, 115],
    [-22, 114], [-17, 122], [-14, 126], [-12, 132]
  ],
];

function projectToSphere(
  lat: number,
  lon: number,
  yaw: number,
  pitch: number,
  radius: number,
  cx: number,
  cy: number
): { x: number; y: number; z: number; visible: boolean } {
  const phi = (lat * Math.PI) / 180;
  const lambda = (lon * Math.PI) / 180 + yaw;
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const cosLambda = Math.cos(lambda);
  const sinLambda = Math.sin(lambda);

  const x0 = cosPhi * sinLambda;
  const y0 = sinPhi;
  const z0 = cosPhi * cosLambda;

  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);
  const x = x0;
  const y = y0 * cosP - z0 * sinP;
  const z = y0 * sinP + z0 * cosP;

  return {
    x: cx + x * radius,
    y: cy - y * radius,
    z,
    visible: z > 0.02,
  };
}

export const Unified3DGlobeMap: React.FC<UnifiedGlobeMapProps> = ({
  onSelectCity,
  initialFocus,
}) => {
  // Container & Canvas references
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const leafletContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);

  // Unified Zoom Continuum: 1.0 (Orbit) to 19.0 (Street View)
  // Transition threshold between 3D Globe and Street Level is 4.5
  const [zoomLevel, setZoomLevel] = useState<number>(() => initialFocus ? initialFocus.zoom : 1.2);
  const [centerCoord, setCenterCoord] = useState<{ lat: number; lon: number; name: string }>(() => {
    if (initialFocus) {
      return { lat: initialFocus.lat, lon: initialFocus.lon, name: initialFocus.name || 'Target Location' };
    }
    return { lat: 11.1271, lon: 78.6569, name: 'Tamil Nadu, India' };
  });

  // 3D Globe Rotation states and refs
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(true);
  const yawRef = useRef<number>(-(centerCoord.lon * Math.PI) / 180);
  const pitchRef = useRef<number>((centerCoord.lat * Math.PI) / 180);
  const zoomLevelRef = useRef<number>(zoomLevel);
  const isAutoRotatingRef = useRef<boolean>(true);
  const continuousRotateRef = useRef<'left' | 'right' | null>(null);

  useEffect(() => {
    zoomLevelRef.current = zoomLevel;
  }, [zoomLevel]);

  useEffect(() => {
    isAutoRotatingRef.current = isAutoRotating;
  }, [isAutoRotating]);

  // Step Rotate Globe Left/Right
  const handleStepRotate = useCallback((dir: 'left' | 'right') => {
    setIsAutoRotating(false);
    isAutoRotatingRef.current = false;
    targetFlightRef.current.active = false;
    const delta = dir === 'left' ? -0.16 : 0.16;
    yawRef.current += delta;
    while (yawRef.current > Math.PI) yawRef.current -= Math.PI * 2;
    while (yawRef.current < -Math.PI) yawRef.current += Math.PI * 2;
  }, []);

  // Tilt North/South
  const handleTilt = useCallback((dir: 'up' | 'down') => {
    targetFlightRef.current.active = false;
    const delta = dir === 'up' ? 0.12 : -0.12;
    pitchRef.current = Math.max(-1.3, Math.min(1.3, pitchRef.current + delta));
  }, []);

  // Continuous Hold Rotate
  const startContinuousRotate = useCallback((dir: 'left' | 'right') => {
    setIsAutoRotating(false);
    isAutoRotatingRef.current = false;
    targetFlightRef.current.active = false;
    continuousRotateRef.current = dir;
  }, []);

  const stopContinuousRotate = useCallback(() => {
    continuousRotateRef.current = null;
  }, []);

  // Keyboard shortcut listener for Left/Right arrow keys, A/D, Up/Down, Space
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        handleStepRotate('left');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        handleStepRotate('right');
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        handleTilt('up');
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleTilt('down');
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsAutoRotating((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleStepRotate, handleTilt]);

  // Map and Data states
  const [stations, setStations] = useState<AirMonitoringStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<AirMonitoringStation | null>(null);
  const [hoveredStation, setHoveredStation] = useState<AirMonitoringStation | null>(null);
  const [baseMapStyle, setBaseMapStyle] = useState<BaseMapStyle>('esri_street');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingStations, setIsLoadingStations] = useState(false);

  // Drag interaction
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const animFrameRef = useRef<number | null>(null);

  // Target flight animation
  const targetFlightRef = useRef<{
    lat: number;
    lon: number;
    zoom: number;
    active: boolean;
  }>({
    lat: centerCoord.lat,
    lon: centerCoord.lon,
    zoom: zoomLevel,
    active: false,
  });

  // Altitude label calculated from continuous zoomLevel
  const altitudeInfo = useMemo(() => {
    if (zoomLevel <= 1.5) return { km: '36,000 km', label: 'Planetary Orbit', level: 'orbit' };
    if (zoomLevel <= 3.0) return { km: '1,000 km', label: 'Exosphere Orbit', level: 'orbit' };
    if (zoomLevel <= 4.4) return { km: '50 km', label: 'Stratosphere Approach', level: 'approach' };
    if (zoomLevel <= 7.0) return { km: '25 km', label: 'Country & State View', level: 'state' };
    if (zoomLevel <= 11.0) return { km: '10 km', label: 'City & District View', level: 'city' };
    if (zoomLevel <= 15.0) return { km: '1 km', label: 'Street-Level Network', level: 'street' };
    return { km: '100 m', label: 'Ultra-Clear Street View (Roads & Buildings)', level: 'street' };
  }, [zoomLevel]);

  // Determine whether current view is in 3D Globe mode or Street Map mode
  const isStreetLevel = zoomLevel >= 4.5;

  // Baseline global stations
  const baselineStations = useMemo(() => GLOBAL_AQI_LOCATIONS.map(toAirMonitoringStation), []);

  // Fetch stations from server
  const fetchStations = async () => {
    setIsLoadingStations(true);
    try {
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('aeropulse_waqi_token') || 'b604e14fe0673e97b77a0d38a35c81e346abd563' : '';
      const res = await fetch(`/api/map/stations?region=all&token=${encodeURIComponent(token)}`);
      if (res.ok) {
        const data = await res.json();
        const map = new Map<string, AirMonitoringStation>();
        baselineStations.forEach((s) => map.set(s.id, s));
        if (Array.isArray(data.stations)) {
          data.stations.forEach((s: AirMonitoringStation) => map.set(s.id, s));
        }
        setStations(Array.from(map.values()));
      } else {
        setStations(baselineStations);
      }
    } catch {
      setStations(baselineStations);
    } finally {
      setIsLoadingStations(false);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  // Smooth flight transition to coordinates and target zoom
  const flyToLocation = useCallback((lat: number, lon: number, targetZoom = 15.0, name = '') => {
    setIsAutoRotating(false);
    setCenterCoord({ lat, lon, name: name || `${lat.toFixed(2)}°, ${lon.toFixed(2)}°` });

    targetFlightRef.current = {
      lat,
      lon,
      zoom: targetZoom,
      active: true,
    };
  }, []);

  // Initialize and synchronize Leaflet Street Map
  useEffect(() => {
    if (!leafletContainerRef.current) return;

    if (!leafletMapRef.current) {
      const map = L.map(leafletContainerRef.current, {
        center: [centerCoord.lat, centerCoord.lon],
        zoom: Math.max(5, Math.round(zoomLevel)),
        minZoom: 4,
        maxZoom: 19,
        zoomControl: false,
        attributionControl: false,
      });

      // Default to ESRI World Street Map for clear roads, avenues, and building footprints
      const provider = BASE_MAP_PROVIDERS[baseMapStyle];
      const tileLayer = L.tileLayer(provider.url, {
        maxZoom: provider.maxZoom,
        attribution: provider.attribution,
      }).addTo(map);

      baseTileLayerRef.current = tileLayer;
      markersLayerRef.current = L.layerGroup().addTo(map);

      // Listen for Leaflet zoom and move events
      map.on('zoomend', () => {
        const currentZ = map.getZoom();
        setZoomLevel(currentZ);
        // If user zooms out past zoom 4, transition back to 3D Globe
        if (currentZ <= 4) {
          setZoomLevel(3.8);
        }
      });

      map.on('moveend', () => {
        const center = map.getCenter();
        setCenterCoord((prev) => ({
          ...prev,
          lat: center.lat,
          lon: center.lng,
        }));
        // Sync 3D globe rotation angles
        yawRef.current = -(center.lng * Math.PI) / 180;
        pitchRef.current = (center.lat * Math.PI) / 180;
      });

      leafletMapRef.current = map;
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Update base map tile provider when baseMapStyle changes
  useEffect(() => {
    if (!leafletMapRef.current) return;
    if (baseTileLayerRef.current) {
      leafletMapRef.current.removeLayer(baseTileLayerRef.current);
    }
    const provider = BASE_MAP_PROVIDERS[baseMapStyle];
    const newLayer = L.tileLayer(provider.url, {
      maxZoom: provider.maxZoom,
      attribution: provider.attribution,
    }).addTo(leafletMapRef.current);
    baseTileLayerRef.current = newLayer;
  }, [baseMapStyle]);

  // Synchronize Leaflet view when entering street mode or when centerCoord / zoomLevel updates
  useEffect(() => {
    if (!leafletMapRef.current) return;
    if (isStreetLevel) {
      leafletMapRef.current.invalidateSize();
      const currentCenter = leafletMapRef.current.getCenter();
      const dist = Math.hypot(currentCenter.lat - centerCoord.lat, currentCenter.lng - centerCoord.lon);
      const targetZ = Math.max(5, Math.min(19, Math.round(zoomLevel)));

      if (dist > 0.05 || Math.abs(leafletMapRef.current.getZoom() - targetZ) > 0.5) {
        leafletMapRef.current.setView([centerCoord.lat, centerCoord.lon], targetZ, {
          animate: true,
        });
      }
    }
  }, [isStreetLevel, centerCoord.lat, centerCoord.lon, zoomLevel]);

  // Render Leaflet Station Markers
  useEffect(() => {
    if (!leafletMapRef.current || !markersLayerRef.current) return;
    const group = markersLayerRef.current;
    group.clearLayers();

    stations.forEach((st) => {
      const cat = getAQIColorCss(st.aqi);
      const isSelected = selectedStation?.id === st.id;

      // Clean custom SVG & HTML pin with AQI number and pulse animation
      const iconHtml = `
        <div class="relative group cursor-pointer" style="transform: translate(-50%, -50%);">
          <div class="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black text-white shadow-xl border ${
            isSelected ? 'border-white scale-110 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'border-white/40'
          }" style="background-color: ${cat.hex};">
            <span>${st.aqi}</span>
            <span class="text-[9px] font-semibold opacity-95 max-w-[70px] truncate hidden sm:inline">${st.city}</span>
          </div>
          <div class="w-1.5 h-1.5 rounded-full mx-auto mt-0.5 shadow-sm" style="background-color: ${cat.hex};"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'aqi-station-marker',
        html: iconHtml,
        iconSize: [80, 30],
        iconAnchor: [40, 15],
      });

      const marker = L.marker([st.latitude, st.longitude], { icon: customIcon });

      marker.on('click', () => {
        setSelectedStation(st);
        setCenterCoord({ lat: st.latitude, lon: st.longitude, name: st.city });
      });

      marker.bindTooltip(
        `<strong>${st.city} (${st.stationName})</strong><br/>AQI: <b>${st.aqi}</b> • ${cat.label}<br/>Dominant: ${st.dominantPollutant}`,
        { direction: 'top', offset: [0, -10] }
      );

      group.addLayer(marker);
    });
  }, [stations, selectedStation]);

  // 3D Canvas Planetary Render Loop (Active when in orbit or transitioning)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const width = rect.width;
      const height = rect.height;
      const cx = width / 2;
      const cy = height / 2;
      const baseRadius = Math.min(width, height) * 0.38;

      // Handle Flight Animation (Smooth descent or orientation change)
      if (targetFlightRef.current.active) {
        const tgt = targetFlightRef.current;
        const targetYaw = -(tgt.lon * Math.PI) / 180;
        const targetPitch = (tgt.lat * Math.PI) / 180;

        let dy = targetYaw - yawRef.current;
        while (dy > Math.PI) dy -= Math.PI * 2;
        while (dy < -Math.PI) dy += Math.PI * 2;

        yawRef.current += dy * 0.08;
        pitchRef.current += (targetPitch - pitchRef.current) * 0.08;
        zoomLevelRef.current += (tgt.zoom - zoomLevelRef.current) * 0.08;

        if (Math.abs(dy) < 0.005 && Math.abs(targetPitch - pitchRef.current) < 0.005 && Math.abs(tgt.zoom - zoomLevelRef.current) < 0.1) {
          targetFlightRef.current.active = false;
        }
        setZoomLevel(zoomLevelRef.current);
      } else {
        if (continuousRotateRef.current === 'left') {
          yawRef.current -= 0.024;
        } else if (continuousRotateRef.current === 'right') {
          yawRef.current += 0.024;
        } else if (isAutoRotatingRef.current && !isDraggingRef.current && zoomLevelRef.current < 4.0) {
          yawRef.current += 0.0016; // Gentle planetary spin
        }
      }

      // Normalization
      while (yawRef.current > Math.PI) yawRef.current -= Math.PI * 2;
      while (yawRef.current < -Math.PI) yawRef.current += Math.PI * 2;
      pitchRef.current = Math.max(-1.3, Math.min(1.3, pitchRef.current));

      const currentYaw = yawRef.current;
      const currentPitch = pitchRef.current;
      const currentZoom = zoomLevelRef.current;

      if (!targetFlightRef.current.active && currentZoom < 4.5) {
        setZoomLevel(currentZoom);
      }

      // Effective 3D radius on canvas (expands exponentially as altitude decreases)
      const visualRadius = baseRadius * Math.min(3.8, currentZoom);

      // CLEAR BACKGROUND
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, width, height);

      // STARFIELD
      ctx.save();
      for (let i = 0; i < 90; i++) {
        const sx = (Math.sin(i * 123) * 0.5 + 0.5) * width;
        const sy = (Math.cos(i * 45) * 0.5 + 0.5) * height;
        const sr = (Math.sin(i * 14) * 0.5 + 0.5) * 1.5 + 0.5;
        const opacity = Math.sin(i * 9 + Date.now() * 0.0012) * 0.3 + 0.65;
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.75})`;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // ATMOSPHERIC HALO
      const atmoGrad = ctx.createRadialGradient(cx, cy, visualRadius * 0.98, cx, cy, visualRadius * 1.25);
      atmoGrad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
      atmoGrad.addColorStop(0.3, 'rgba(14, 165, 233, 0.25)');
      atmoGrad.addColorStop(0.7, 'rgba(3, 105, 161, 0.08)');
      atmoGrad.addColorStop(1, 'rgba(2, 6, 23, 0)');

      ctx.fillStyle = atmoGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, visualRadius * 1.25, 0, Math.PI * 2);
      ctx.fill();

      // GLOBE SPHERE
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, visualRadius, 0, Math.PI * 2);
      ctx.clip();

      // Ocean base gradient
      const oceanGrad = ctx.createRadialGradient(
        cx - visualRadius * 0.35,
        cy - visualRadius * 0.35,
        visualRadius * 0.05,
        cx,
        cy,
        visualRadius
      );
      oceanGrad.addColorStop(0, '#0c4a6e');
      oceanGrad.addColorStop(0.5, '#072e49');
      oceanGrad.addColorStop(0.85, '#031726');
      oceanGrad.addColorStop(1, '#010a12');

      ctx.fillStyle = oceanGrad;
      ctx.fillRect(cx - visualRadius, cy - visualRadius, visualRadius * 2, visualRadius * 2);

      // Graticules
      ctx.lineWidth = 0.75;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.16)';
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        let first = true;
        for (let lon = -180; lon <= 180; lon += 5) {
          const pt = projectToSphere(lat, lon, currentYaw, currentPitch, visualRadius, cx, cy);
          if (pt.visible) {
            if (first) {
              ctx.moveTo(pt.x, pt.y);
              first = false;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          } else {
            first = true;
          }
        }
        ctx.stroke();
      }

      // Continents
      CONTINENT_POLYGONS.forEach((poly, polyIdx) => {
        const isIndia = polyIdx === 0;
        const isTamilNadu = polyIdx === 1;

        ctx.beginPath();
        let hasVisiblePoint = false;
        let started = false;

        for (let i = 0; i <= poly.length; i++) {
          const [lat, lon] = poly[i % poly.length];
          const pt = projectToSphere(lat, lon, currentYaw, currentPitch, visualRadius, cx, cy);
          if (pt.visible) {
            hasVisiblePoint = true;
            if (!started) {
              ctx.moveTo(pt.x, pt.y);
              started = true;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          }
        }

        if (hasVisiblePoint && started) {
          ctx.closePath();
          if (isTamilNadu) {
            ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
            ctx.fill();
            ctx.strokeStyle = '#34d399';
            ctx.lineWidth = 1.8;
            ctx.stroke();
          } else if (isIndia) {
            ctx.fillStyle = 'rgba(30, 95, 75, 0.88)';
            ctx.fill();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.4;
            ctx.stroke();
          } else {
            ctx.fillStyle = 'rgba(20, 55, 45, 0.72)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(74, 222, 128, 0.35)';
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      });

      // Day/Night Shading
      const shadeGrad = ctx.createLinearGradient(
        cx - visualRadius * 0.9,
        cy - visualRadius * 0.9,
        cx + visualRadius * 0.9,
        cy + visualRadius * 0.9
      );
      shadeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
      shadeGrad.addColorStop(0.45, 'rgba(0, 0, 0, 0)');
      shadeGrad.addColorStop(0.8, 'rgba(0, 0, 0, 0.5)');
      shadeGrad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');

      ctx.fillStyle = shadeGrad;
      ctx.fillRect(cx - visualRadius, cy - visualRadius, visualRadius * 2, visualRadius * 2);
      ctx.restore();

      // Atmospheric Rim
      ctx.beginPath();
      ctx.arc(cx, cy, visualRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 3D AQI Beacons & Laser Pillars
      const pulsePhase = (Date.now() % 2000) / 2000;
      stations.forEach((st) => {
        const pt = projectToSphere(st.latitude, st.longitude, currentYaw, currentPitch, visualRadius, cx, cy);
        if (!pt.visible) return;

        const cat = getAQIColorCss(st.aqi);
        const maxPillarPx = 36 * Math.min(2.5, currentZoom);
        const pillarHeight = Math.max(8, Math.min(maxPillarPx, (st.aqi / 300) * maxPillarPx));

        const dx = pt.x - cx;
        const dy = pt.y - cy;
        const d = Math.hypot(dx, dy);
        const nx = d > 0 ? dx / d : 0;
        const ny = d > 0 ? dy / d : -1;

        const topX = pt.x + nx * pillarHeight;
        const topY = pt.y + ny * pillarHeight;

        // Pulsing base ring
        ctx.beginPath();
        const ringR = (3 + pulsePhase * 7) * Math.min(1.5, currentZoom);
        ctx.arc(pt.x, pt.y, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = cat.hex;
        ctx.globalAlpha = Math.max(0, 1 - pulsePhase);
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Laser pillar
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
        ctx.lineTo(topX, topY);
        ctx.strokeStyle = cat.hex;
        ctx.lineWidth = st.state === 'Tamil Nadu' ? 2.6 : 1.8;
        ctx.stroke();

        // Tip sphere
        ctx.beginPath();
        ctx.arc(topX, topY, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = cat.hex;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Floating AQI Badge
        if (currentZoom >= 1.6 || selectedStation?.id === st.id || hoveredStation?.id === st.id) {
          const badgeText = `${st.aqi} ${st.city}`;
          ctx.font = 'bold 10px monospace';
          const w = ctx.measureText(badgeText).width + 12;
          const h = 16;
          const bx = topX - w / 2;
          const by = topY - h - 3;

          ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
          ctx.strokeStyle = cat.hex;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.roundRect(bx, by, w, h, 8);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = cat.hex;
          ctx.beginPath();
          ctx.arc(bx + 8, by + h / 2, 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.fillText(badgeText, bx + 15, by + 11.5);
        }
      });

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [stations, isAutoRotating, selectedStation, hoveredStation, zoomLevel]);

  // Pointer drag events for 3D Globe
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    setIsAutoRotating(false); // Pause rotation automatically when user interacts
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const baseRadius = Math.min(rect.width, rect.height) * 0.38;
    const visualRadius = baseRadius * Math.min(3.8, zoomLevel);

    if (isDraggingRef.current) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };

      const sensitivity = 0.005 / Math.min(3.5, zoomLevel);
      yawRef.current += dx * sensitivity;
      pitchRef.current = Math.max(-1.3, Math.min(1.3, pitchRef.current - dy * sensitivity));
    } else {
      // Station hover detection
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      let closest: AirMonitoringStation | null = null;
      let minDist = 18;

      stations.forEach((st) => {
        const pt = projectToSphere(st.latitude, st.longitude, yawRef.current, pitchRef.current, visualRadius, cx, cy);
        if (!pt.visible) return;
        const d = Math.hypot(mx - pt.x, my - pt.y);
        if (d < minDist) {
          minDist = d;
          closest = st;
        }
      });
      setHoveredStation(closest);
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  // Mousewheel Zoom across the entire continuum
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.85;
    const newZoom = Math.max(1.0, Math.min(19.0, zoomLevel * factor));
    setZoomLevel(newZoom);
  };

  // Click on globe to center a location or select a station
  const handleCanvasClick = () => {
    if (hoveredStation) {
      setSelectedStation(hoveredStation);
      flyToLocation(hoveredStation.latitude, hoveredStation.longitude, 15.0, hoveredStation.city);
    }
  };

  // Search Results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return stations
      .filter(
        (st) =>
          st.city.toLowerCase().includes(q) ||
          st.stationName.toLowerCase().includes(q) ||
          st.country.toLowerCase().includes(q) ||
          (st.state && st.state.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [stations, searchQuery]);

  // Handle Location Select from Search
  const handleSelectSearchResult = (st: AirMonitoringStation) => {
    setSelectedStation(st);
    setSearchQuery('');
    flyToLocation(st.latitude, st.longitude, 16.0, st.city);
  };

  return (
    <div className="space-y-3 select-none">
      {/* DEDICATED CONTROL DOCK PLACED OUT OF THE MAP: Rotation Controls (Left/Right Keys & Buttons) + Target Shortcuts */}
      <div className="bg-slate-900/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-3 text-white">
        {/* Left: Directional Rotation Controls & Keys */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
            <Compass className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Globe Rotation:</span>
          </span>

          {/* ROTATE LEFT (WEST) BUTTON */}
          <button
            type="button"
            onClick={() => handleStepRotate('left')}
            onMouseDown={() => startContinuousRotate('left')}
            onMouseUp={stopContinuousRotate}
            onMouseLeave={stopContinuousRotate}
            onTouchStart={() => startContinuousRotate('left')}
            onTouchEnd={stopContinuousRotate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 active:scale-95 transition-all cursor-pointer shadow-xs"
            title="Rotate Globe Left (West) - Click or Hold [Keyboard: ← Arrow or A]"
          >
            <ChevronLeft className="w-4 h-4 text-sky-400" />
            <span>Rotate Left</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono text-slate-400 bg-slate-900 rounded border border-slate-700">←</kbd>
          </button>

          {/* PAUSE / PLAY ROTATION BUTTON */}
          <button
            type="button"
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
              !isAutoRotating
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30'
                : 'bg-slate-800 text-sky-300 border border-slate-700 hover:bg-slate-750 hover:text-white'
            }`}
            title={isAutoRotating ? 'Click to Pause 3D Planetary Rotation [Spacebar]' : 'Click to Resume Planetary Rotation [Spacebar]'}
          >
            {!isAutoRotating ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-sky-400" />}
            <span>{!isAutoRotating ? 'Paused' : 'Auto-Spin'}</span>
          </button>

          {/* ROTATE RIGHT (EAST) BUTTON */}
          <button
            type="button"
            onClick={() => handleStepRotate('right')}
            onMouseDown={() => startContinuousRotate('right')}
            onMouseUp={stopContinuousRotate}
            onMouseLeave={stopContinuousRotate}
            onTouchStart={() => startContinuousRotate('right')}
            onTouchEnd={stopContinuousRotate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 active:scale-95 transition-all cursor-pointer shadow-xs"
            title="Rotate Globe Right (East) - Click or Hold [Keyboard: → Arrow or D]"
          >
            <span>Rotate Right</span>
            <ChevronRight className="w-4 h-4 text-sky-400" />
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono text-slate-400 bg-slate-900 rounded border border-slate-700">→</kbd>
          </button>

          {/* TILT CONTROLS */}
          <div className="flex items-center gap-1 border-l border-slate-800 pl-2 ml-0.5">
            <button
              type="button"
              onClick={() => handleTilt('up')}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer transition-colors"
              title="Tilt North [Keyboard: ↑ Arrow or W]"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleTilt('down')}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer transition-colors"
              title="Tilt South [Keyboard: ↓ Arrow or S]"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Region Focus Shortcuts */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden lg:inline mr-1">
            Focus:
          </span>

          {/* FULL EARTH (Orbit View) */}
          <button
            type="button"
            onClick={() => {
              setZoomLevel(1.2);
              setIsAutoRotating(true);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              zoomLevel <= 2.0 ? 'bg-sky-600 text-white shadow' : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700'
            }`}
            title="Return to Planetary Orbit in Space"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Full Earth</span>
          </button>

          {/* LOCATE INDIA */}
          <button
            type="button"
            onClick={() => flyToLocation(21.5, 78.96, 5.5, 'India')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-emerald-600 hover:from-orange-400 hover:to-emerald-500 shadow transition-all cursor-pointer"
            title="Focus camera directly on India"
          >
            <span>🇮🇳</span>
            <span>Locate India</span>
          </button>

          {/* TAMIL NADU FOCUS */}
          <button
            type="button"
            onClick={() => flyToLocation(11.1271, 78.6569, 7.8, 'Tamil Nadu')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-100 bg-emerald-600/90 hover:bg-emerald-500 border border-emerald-400/40 shadow transition-all cursor-pointer"
            title="Dive into Tamil Nadu state & its 38 districts"
          >
            <span>🌟</span>
            <span>Tamil Nadu</span>
          </button>

          {/* ZOOM TO STREETS SHORTCUT / BACK TO GLOBE */}
          {!isStreetLevel ? (
            <button
              type="button"
              onClick={() => {
                const target = selectedStation || stations.find((s) => s.state === 'Tamil Nadu') || stations[0];
                if (target) {
                  flyToLocation(target.latitude, target.longitude, 16.0, target.city);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600/90 hover:bg-indigo-500 text-indigo-100 border border-indigo-400/40 shadow transition-all cursor-pointer"
              title="Dive immediately into high-resolution street view"
            >
              <MapPin className="w-3.5 h-3.5 text-sky-300" />
              <span>Street View</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setZoomLevel(1.5);
                setIsAutoRotating(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white border border-sky-400/40 shadow transition-all cursor-pointer"
              title="Return to 3D Globe Planetary Orbit"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Back to Globe</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. MAP CANVAS VIEWPORT CONTAINER */}
      <div
        ref={containerRef}
        className="relative w-full h-[700px] lg:h-[760px] rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden flex flex-col justify-between select-none"
      >
      {/* 1. 3D GLOBE CANVAS (Active when in orbit or stratosphere) */}
      <div
        className={`absolute inset-0 z-0 transition-opacity duration-700 ease-in-out ${
          isStreetLevel ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
        }`}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onClick={handleCanvasClick}
          onWheel={handleWheel}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        />
      </div>

      {/* 2. LEAFLET STREET-LEVEL MAP (Active when zoomed in past altitude threshold) */}
      <div
        className={`absolute inset-0 z-10 transition-opacity duration-700 ease-in-out ${
          isStreetLevel ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div ref={leafletContainerRef} className="w-full h-full" />
        {/* Subtle 3D atmospheric vignetting over street view for atmospheric depth */}
        <div className="absolute inset-0 pointer-events-none bg-radial from-transparent via-transparent to-slate-950/40" />
      </div>

      {/* TOP BAR: Title, Search, Layer Toggle & Settings */}
      <div className="relative z-30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pointer-events-none">
        {/* Title & Altitude Status Badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 shrink-0">
            <Globe className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black tracking-tight text-white">
                3D Globe & Street Explorer
              </h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30 font-mono">
                {altitudeInfo.label} • {altitudeInfo.km}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isStreetLevel
                ? 'High-resolution street view active: clear road names, avenues, and localized CAAQMS sensors'
                : 'Planetary 3D model: rotate, pause, and zoom continuously from space into street-level view'}
            </p>
          </div>
        </div>

        {/* Search Bar & Base Map Style Selector */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          {/* Universal Search Bar */}
          <div className="relative w-52 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search world cities, streets..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900/90 text-white placeholder-slate-400 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-md backdrop-blur-md"
            />

            {/* Search Dropdown */}
            {searchQuery.trim().length > 0 && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-800 max-h-60 overflow-y-auto">
                {searchResults.map((hit) => {
                  const cat = getAQIColorCss(hit.aqi);
                  return (
                    <button
                      key={hit.id}
                      type="button"
                      onClick={() => handleSelectSearchResult(hit)}
                      className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center justify-between text-xs text-white transition-colors cursor-pointer"
                    >
                      <div className="truncate mr-2">
                        <p className="font-bold truncate">{hit.city}</p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {[hit.district, hit.state, hit.country].filter(Boolean).join(', ')}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold text-white ${cat.bg}`}>
                        AQI {hit.aqi}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Base Map Style (When in street view or ready to dive) */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-900/80 border border-slate-700 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setBaseMapStyle('esri_street')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                baseMapStyle === 'esri_street' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="ESRI World Street Map (Sharp Road Names & Streets)"
            >
              🛣️ Streets
            </button>
            <button
              type="button"
              onClick={() => setBaseMapStyle('osm')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                baseMapStyle === 'osm' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="OpenStreetMap Standard Tiles"
            >
              🗺️ OSM
            </button>
            <button
              type="button"
              onClick={() => setBaseMapStyle('satellite')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                baseMapStyle === 'satellite' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Satellite Imagery"
            >
              🛰️ Satellite
            </button>
          </div>
        </div>
      </div>



      {/* FLOATING SIDE PANEL: Comprehensive AQI Telemetry & Health Diagnostics */}
      {selectedStation && (
        <div className="absolute top-20 right-4 z-30 w-80 sm:w-96 max-h-[85%] overflow-y-auto p-4 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700 text-white shadow-2xl space-y-3 pointer-events-auto animate-in fade-in slide-in-from-right-4 duration-200 scrollbar-none">
          {/* Header & Close */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-sky-400 font-bold">
                <MapPin className="w-3.5 h-3.5" />
                <span>
                  {selectedStation.state === 'Tamil Nadu'
                    ? `Tamil Nadu • ${selectedStation.district || selectedStation.city}`
                    : selectedStation.country === 'India'
                    ? `India • ${selectedStation.state || selectedStation.city}`
                    : selectedStation.country}
                </span>
              </div>
              <h4 className="text-lg font-black text-white mt-0.5">{selectedStation.city}</h4>
              <p className="text-[11px] text-slate-400">{selectedStation.stationName}</p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedStation(null)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Primary AQI Meter Card */}
          {(() => {
            const cat = getAQIColorCss(selectedStation.aqi);
            return (
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Current Air Quality
                  </span>
                  <span className="text-3xl font-black font-mono" style={{ color: cat.hex }}>
                    {selectedStation.aqi}
                  </span>
                  <span className="text-xs font-semibold block text-slate-300 mt-0.5">AQI (US EPA Standard)</span>
                </div>

                <div className="text-right">
                  <span
                    className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold shadow-xs text-white"
                    style={{ backgroundColor: cat.hex }}
                  >
                    {cat.label}
                  </span>
                  <div className="flex items-center justify-end gap-1 mt-1.5 text-[10px] text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{selectedStation.source === 'waqi-live' ? 'Live WAQI' : 'Live CPCB CAAQMS'}</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 6 Pollutants Concentrations Grid */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1.5">
              <span>Pollutant Concentrations</span>
              <span className="text-sky-400">Dominant: {selectedStation.dominantPollutant}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block font-semibold">PM2.5</span>
                <span className="font-mono font-bold text-slate-100">{selectedStation.pollutants?.pm25 ?? 25} µg/m³</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block font-semibold">PM10</span>
                <span className="font-mono font-bold text-slate-100">{selectedStation.pollutants?.pm10 ?? 50} µg/m³</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block font-semibold">NO₂</span>
                <span className="font-mono font-bold text-slate-100">{selectedStation.pollutants?.no2 ?? 20} µg/m³</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block font-semibold">SO₂</span>
                <span className="font-mono font-bold text-slate-100">{selectedStation.pollutants?.so2 ?? 8} µg/m³</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block font-semibold">CO</span>
                <span className="font-mono font-bold text-slate-100">{selectedStation.pollutants?.co ?? 450} ppb</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block font-semibold">Ozone (O₃)</span>
                <span className="font-mono font-bold text-slate-100">{selectedStation.pollutants?.o3 ?? 30} µg/m³</span>
              </div>
            </div>
          </div>

          {/* Meteorological Ambient Drivers */}
          <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-amber-400" />
              <span>{selectedStation.weather?.temperature ?? 28}°C</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-sky-400" />
              <span>{selectedStation.weather?.humidity ?? 65}% Humidity</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5 text-emerald-400" />
              <span>{selectedStation.weather?.windSpeed ?? 11} km/h</span>
            </div>
          </div>

          {/* Health Advisory & Precautionary Protocol */}
          <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-indigo-300">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Health Precautions & Advisory</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {selectedStation.aqi <= 50
                ? 'Air quality is satisfactory. Outdoor activities pose virtually zero risk for all sensitive groups.'
                : selectedStation.aqi <= 100
                ? 'Acceptable air quality. Unusually sensitive individuals should consider limiting prolonged outdoor exertion.'
                : selectedStation.aqi <= 150
                ? 'Sensitive groups (asthmatics, seniors, children) should reduce prolonged or heavy outdoor exertion.'
                : selectedStation.aqi <= 200
                ? 'Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.'
                : 'Emergency health warning: All individuals should wear N95 respirators and activate indoor HEPA filtration.'}
            </p>
          </div>

          {/* Station Metadata & Agency */}
          <div className="text-[10px] text-slate-400 space-y-0.5 pt-1 border-t border-slate-800">
            <p>
              <span className="font-semibold text-slate-300">Operating Agency:</span>{' '}
              {selectedStation.operatingAgency || 'Continuous Ambient CAAQMS'}
            </p>
            <p>
              <span className="font-semibold text-slate-300">Coordinates:</span> {selectedStation.latitude.toFixed(3)}°N,{' '}
              {selectedStation.longitude.toFixed(3)}°E
            </p>
            <p>
              <span className="font-semibold text-slate-300">Verification:</span> {selectedStation.lastUpdated}
            </p>
          </div>

          {/* Actions: Street Dive & Dashboard */}
          <div className="space-y-2 pt-1">
            {!isStreetLevel ? (
              <button
                type="button"
                onClick={() => flyToLocation(selectedStation.latitude, selectedStation.longitude, 16.0, selectedStation.city)}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-emerald-200" />
                <span>Zoom into Street Level (View Road Network)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setZoomLevel(1.5);
                  setIsAutoRotating(true);
                }}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 shadow transition-all cursor-pointer"
              >
                <Globe className="w-4 h-4 text-sky-400" />
                <span>Zoom Back Out to 3D Globe</span>
              </button>
            )}

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
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer"
              >
                <span>Inspect in Live Sensor Dashboard</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* BOTTOM CONTROLS DOCK: Unified Altitude Continuum Slider, Legend & Zoom Controls */}
      <div className="relative z-30 p-4 flex flex-col md:flex-row items-center justify-between gap-3 pointer-events-none">
        {/* AQI Color Scale Legend */}
        <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-300 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 pointer-events-auto">
          <span className="text-slate-400">AQI:</span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>0-50 Good</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <span>51-100 Mod</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span>101-150 USG</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>151-200 Unhealthy</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
            <span>201-300 Very</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-900" />
            <span>300+ Haz</span>
          </span>
        </div>

        {/* CONTINUOUS ZOOM & ALTITUDE HUD SLIDER */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-950/85 backdrop-blur-md rounded-2xl border border-slate-800 pointer-events-auto shadow-2xl">
          {/* Zoom Out Button */}
          <button
            type="button"
            onClick={() => {
              const newZ = Math.max(1.0, zoomLevel - 1.5);
              setZoomLevel(newZ);
            }}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Zoom Out (Toward Space)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Continuum Slider: 1.0 (Orbit) to 19.0 (Street View) */}
          <div className="flex items-center gap-2 px-2">
            <span className="text-[10px] text-slate-400 font-mono">Orbit</span>
            <input
              type="range"
              min="1.0"
              max="18.5"
              step="0.5"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
              className="w-28 sm:w-36 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
            <span className="text-[10px] text-sky-400 font-mono font-bold">Streets</span>
          </div>

          {/* Altitude Readout Badge */}
          <span className="px-2.5 py-1 text-[11px] font-mono font-bold text-sky-300 bg-slate-900 rounded-lg border border-slate-800 min-w-[70px] text-center">
            {altitudeInfo.km}
          </span>

          {/* Zoom In Button */}
          <button
            type="button"
            onClick={() => {
              const newZ = Math.min(19.0, zoomLevel + 1.5);
              setZoomLevel(newZ);
            }}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Zoom In (Dives into street level)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
  );
};
