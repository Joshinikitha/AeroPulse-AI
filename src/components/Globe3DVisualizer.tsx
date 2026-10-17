import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
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
} from 'lucide-react';
import { AirMonitoringStation, CityLocation } from '../types';
import { GLOBAL_AQI_LOCATIONS } from '../data/globalLocations';
import { IndiaTamilNaduMap } from './IndiaTamilNaduMap';

export interface GlobeLocationPoint {
  id: string;
  name: string;
  stationName: string;
  city: string;
  district?: string;
  state?: string;
  country: string;
  lat: number;
  lon: number;
  aqi: number;
  category: string;
  dominantPollutant: string;
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  co: number;
  o3: number;
  temperature?: number;
  humidity?: number;
  windSpeed?: number;
  operatingAgency?: string;
  lastUpdated: string;
  source: 'waqi-live' | 'cpcb-cams';
  isIndia?: boolean;
  isTamilNadu?: boolean;
}

interface Globe3DVisualizerProps {
  onSelectCity?: (city: CityLocation) => void;
  onSwitchTo2DMap?: () => void;
  onZoomToStreetLevel?: (lat: number, lon: number, zoom?: number, name?: string) => void;
}

// Color and styling helpers
export function getAQIColorHex(aqi: number): number {
  if (aqi <= 50) return 0x10b981; // emerald-500
  if (aqi <= 100) return 0xeab308; // yellow-500
  if (aqi <= 150) return 0xf97316; // orange-500
  if (aqi <= 200) return 0xef4444; // red-500
  if (aqi <= 300) return 0xa855f7; // purple-500
  return 0x881337; // rose-900 / maroon
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

// Simplified continent landmass polygons for high-performance 3D Canvas rendering
// Coordinates as [lat, lon] arrays representing main global continental landmasses
const CONTINENT_POLYGONS: [number, number][][] = [
  // 1. Indian Subcontinent & South Asia (High detail)
  [
    [35, 74], [34, 78], [32, 80], [28, 88], [27, 92], [28, 97],
    [24, 94], [22, 90], [22, 86], [19, 85], [16, 82], [13, 80],
    [10, 79], [8.1, 77.5], [10, 76], [13, 74.8], [15, 73.8], [19, 72.8],
    [21, 72.5], [23, 69], [25, 68], [28, 70], [32, 73], [35, 74]
  ],
  // 2. Tamil Nadu Highlight (Special focus region)
  [
    [13.5, 80.3], [12, 80], [10.5, 79.8], [9.2, 79.2], [8.1, 77.5],
    [8.5, 77.2], [10, 76.5], [11.5, 76.6], [12.8, 78.5], [13.5, 80.3]
  ],
  // 3. Africa
  [
    [37, 10], [32, 32], [27, 34], [12, 44], [10, 51], [0, 42],
    [-11, 40], [-25, 33], [-34, 26], [-34, 18], [-23, 14], [-12, 13],
    [-5, 12], [4, 9], [6, 2], [5, -4], [10, -14], [15, -17],
    [21, -17], [28, -10], [35, -6], [36, 1], [37, 10]
  ],
  // 4. Europe
  [
    [36, -9], [43, -9], [44, -1], [48, -5], [51, 2], [54, 8],
    [58, 6], [62, 5], [71, 28], [67, 34], [60, 30], [55, 21],
    [45, 14], [40, 18], [38, 24], [40, 26], [45, 29], [42, 28],
    [36, 22], [36, -5], [36, -9]
  ],
  // 5. Asia & East Asia
  [
    [71, 30], [77, 105], [70, 170], [60, 165], [54, 140], [45, 135],
    [40, 128], [36, 120], [30, 122], [22, 114], [21, 107], [10, 104],
    [1, 103], [8, 98], [16, 96], [22, 92], [27, 88], [32, 70],
    [40, 55], [42, 38], [55, 38], [60, 50], [65, 60], [71, 30]
  ],
  // 6. North America
  [
    [70, -160], [72, -130], [70, -85], [60, -65], [47, -53], [44, -66],
    [35, -75], [25, -80], [22, -97], [16, -93], [8, -77], [14, -92],
    [20, -105], [30, -115], [34, -120], [40, -124], [49, -125],
    [58, -136], [60, -148], [65, -168], [70, -160]
  ],
  // 7. South America
  [
    [11, -74], [10, -62], [5, -52], [-3, -40], [-8, -35], [-18, -39],
    [-23, -44], [-33, -53], [-42, -64], [-53, -68], [-55, -73],
    [-45, -75], [-35, -73], [-20, -70], [-5, -81], [5, -77], [11, -74]
  ],
  // 8. Australia & Oceania
  [
    [-12, 132], [-14, 142], [-22, 150], [-28, 153], [-37, 150],
    [-38, 145], [-35, 137], [-32, 132], [-35, 117], [-30, 115],
    [-22, 114], [-17, 122], [-14, 126], [-12, 132]
  ],
  // 9. British Isles & Japan
  [
    [50, -5], [58, -5], [58, -2], [51, 1], [50, -5]
  ],
  [
    [31, 130], [35, 135], [43, 145], [45, 142], [36, 138], [33, 131], [31, 130]
  ]
];

// 3D Spherical Projection onto 2D Canvas viewport
function projectGeoToSphere(
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

export const Globe3DVisualizer: React.FC<Globe3DVisualizerProps> = ({
  onSelectCity,
  onSwitchTo2DMap,
  onZoomToStreetLevel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Globe Orientation & Camera States
  // Start facing South Asia & India (yaw ~ -1.37 rad, pitch ~ 0.35 rad)
  const [yaw, setYaw] = useState<number>(-1.37);
  const [pitch, setPitch] = useState<number>(0.35);
  const [zoomScale, setZoomScale] = useState<number>(1.0); // 0.7 = orbit, 2.8 = street approach
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(true);

  // Locations and selection
  const [locations, setLocations] = useState<GlobeLocationPoint[]>(GLOBAL_AQI_LOCATIONS);
  const [selectedPoint, setSelectedPoint] = useState<GlobeLocationPoint | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<GlobeLocationPoint | null>(null);
  const [filterMode, setFilterMode] = useState<
    'all' | 'india' | 'tamilnadu' | 'asia' | 'europe' | 'americas' | 'middle-east-africa'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdatingStations, setIsUpdatingStations] = useState(false);

  // Drag interaction states
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ yaw: 0.002, pitch: 0 });
  const animFrameRef = useRef<number | null>(null);

  // Targets for smooth camera fly-to
  const targetCameraRef = useRef<{
    yaw: number;
    pitch: number;
    zoom: number;
    active: boolean;
  }>({
    yaw: -1.37,
    pitch: 0.35,
    zoom: 1.0,
    active: false,
  });

  // Calculate altitude description based on zoom level
  const altitudeInfo = useMemo(() => {
    if (zoomScale < 0.9) return { km: '36,000 km', label: 'Orbital View', mode: 'global' };
    if (zoomScale < 1.3) return { km: '1,000 km', label: 'Exosphere Orbit', mode: 'global' };
    if (zoomScale < 1.8) return { km: '250 km', label: 'Thermosphere', mode: 'india' };
    if (zoomScale < 2.3) return { km: '50 km', label: 'Stratosphere (State View)', mode: 'tamilnadu' };
    return { km: '5 km', label: 'Surface Approach (Street Level Ready)', mode: 'street' };
  }, [zoomScale]);

  // Filtered locations based on selected region
  const displayedLocations = useMemo(() => {
    if (filterMode === 'tamilnadu') return locations.filter((l) => l.isTamilNadu);
    if (filterMode === 'india') return locations.filter((l) => l.isIndia);
    if (filterMode === 'asia') return locations.filter((l) => (l as any).region === 'asia' || l.country === 'India');
    if (filterMode === 'europe') return locations.filter((l) => (l as any).region === 'europe');
    if (filterMode === 'americas') return locations.filter((l) => (l as any).region === 'americas');
    if (filterMode === 'middle-east-africa')
      return locations.filter((l) => (l as any).region === 'middle-east' || (l as any).region === 'africa');
    return locations;
  }, [locations, filterMode]);

  // Search filtered results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return locations
      .filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.city.toLowerCase().includes(q) ||
          l.country.toLowerCase().includes(q) ||
          (l.state && l.state.toLowerCase().includes(q)) ||
          (l.district && l.district.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [locations, searchQuery]);

  // Smooth flyTo geographic target
  const flyTo = useCallback((lat: number, lon: number, targetZoom = 1.6) => {
    setIsAutoRotating(false);
    // Convert target lat/lon to sphere rotation
    // When lon is centered, yaw = -lon (in radians)
    const targetYaw = -(lon * Math.PI) / 180;
    const targetPitch = (lat * Math.PI) / 180;

    targetCameraRef.current = {
      yaw: targetYaw,
      pitch: targetPitch,
      zoom: targetZoom,
      active: true,
    };
  }, []);

  // Fetch live CAAQMS & WAQI stations to enrich data
  const fetchLiveStations = async () => {
    setIsUpdatingStations(true);
    try {
      const res = await fetch('/api/stations?region=all');
      if (res.ok) {
        const liveList = await res.json();
        if (Array.isArray(liveList) && liveList.length > 0) {
          const mapped: GlobeLocationPoint[] = liveList.map((st: any) => ({
            id: st.id,
            name: st.city,
            stationName: st.stationName,
            city: st.city,
            district: st.district,
            state: st.state,
            country: st.country || 'India',
            lat: st.latitude,
            lon: st.longitude,
            aqi: st.aqi,
            category: st.category || 'Moderate',
            dominantPollutant: st.dominantPollutant || 'PM2.5',
            pm25: st.pollutants?.pm25 ?? 30,
            pm10: st.pollutants?.pm10 ?? 60,
            no2: st.pollutants?.no2 ?? 25,
            so2: st.pollutants?.so2 ?? 10,
            co: st.pollutants?.co ?? 500,
            o3: st.pollutants?.o3 ?? 35,
            temperature: st.weather?.temperature ?? 28,
            humidity: st.weather?.humidity ?? 65,
            windSpeed: st.weather?.windSpeed ?? 12,
            operatingAgency: st.operatingAgency || 'Continuous Monitoring Agency',
            lastUpdated: st.lastUpdated || 'Live Sync',
            source: st.source || 'cpcb-cams',
            isIndia: st.country === 'India' || !st.country,
            isTamilNadu: st.state === 'Tamil Nadu' || st.state === 'TN',
          }));

          // Merge without duplicates
          const seen = new Set(mapped.map((m) => m.id));
          const existingInternational = GLOBAL_AQI_LOCATIONS.filter((p) => !seen.has(p.id));
          setLocations([...mapped, ...existingInternational]);
        }
      }
    } catch (e) {
      console.warn('Live station fetch fallback to baseline:', e);
    } finally {
      setIsUpdatingStations(false);
    }
  };

  useEffect(() => {
    fetchLiveStations();
  }, []);

  // Handle Location Selection
  const handleSelectPoint = (point: GlobeLocationPoint) => {
    setSelectedPoint(point);
    flyTo(point.lat, point.lon, 1.85);
  };

  // Inspect in Dashboard Tab
  const handleInspectInDashboard = (point: GlobeLocationPoint) => {
    if (onSelectCity) {
      onSelectCity({
        name: point.city,
        country: point.country,
        admin1: point.state || '',
        latitude: point.lat,
        longitude: point.lon,
      });
    }
  };

  // Main 3D Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localYaw = yaw;
    let localPitch = pitch;
    let localZoom = zoomScale;

    const render = () => {
      // 1. Resize canvas to display size
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
      const currentRadius = baseRadius * localZoom;

      // Handle smooth camera flight
      if (targetCameraRef.current.active) {
        const tgt = targetCameraRef.current;
        // Normalize angle difference for shortest rotation path
        let dy = tgt.yaw - localYaw;
        while (dy > Math.PI) dy -= Math.PI * 2;
        while (dy < -Math.PI) dy += Math.PI * 2;

        localYaw += dy * 0.08;
        localPitch += (tgt.pitch - localPitch) * 0.08;
        localZoom += (tgt.zoom - localZoom) * 0.08;

        if (Math.abs(dy) < 0.005 && Math.abs(tgt.pitch - localPitch) < 0.005) {
          targetCameraRef.current.active = false;
        }
      } else if (isAutoRotating && !isDraggingRef.current) {
        localYaw += 0.0018; // Smooth planetary rotation
      }

      // Keep yaw within -PI..PI
      while (localYaw > Math.PI) localYaw -= Math.PI * 2;
      while (localYaw < -Math.PI) localYaw += Math.PI * 2;
      // Clamp pitch to avoid gimbal flip
      localPitch = Math.max(-1.3, Math.min(1.3, localPitch));

      setYaw(localYaw);
      setPitch(localPitch);
      setZoomScale(localZoom);

      // CLEAR CANVAS WITH DEEP SPACE GRADIENT
      ctx.fillStyle = '#030712'; // deep slate-950
      ctx.fillRect(0, 0, width, height);

      // DRAW STARFIELD BACKGROUND
      ctx.save();
      const starSeed = 42;
      for (let i = 0; i < 85; i++) {
        const sx = ((Math.sin(i * 99 + starSeed) * 0.5 + 0.5) * width);
        const sy = ((Math.cos(i * 33 + starSeed) * 0.5 + 0.5) * height);
        const sr = (Math.sin(i * 12) * 0.5 + 0.5) * 1.5 + 0.5;
        const opacity = (Math.sin(i * 7 + Date.now() * 0.001) * 0.3 + 0.6);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.7})`;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // ATMOSPHERIC OUTER GLOW HALO
      const atmosphereGrad = ctx.createRadialGradient(
        cx,
        cy,
        currentRadius * 0.98,
        cx,
        cy,
        currentRadius * 1.25
      );
      atmosphereGrad.addColorStop(0, 'rgba(56, 189, 248, 0.45)'); // Sky-400
      atmosphereGrad.addColorStop(0.3, 'rgba(14, 165, 233, 0.25)');
      atmosphereGrad.addColorStop(0.7, 'rgba(3, 105, 161, 0.08)');
      atmosphereGrad.addColorStop(1, 'rgba(2, 6, 23, 0)');

      ctx.fillStyle = atmosphereGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, currentRadius * 1.25, 0, Math.PI * 2);
      ctx.fill();

      // GLOBE BASE SPHERE (DEEP OCEAN WITH LIGHTING GRADIENT)
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, currentRadius, 0, Math.PI * 2);
      ctx.clip();

      // Ocean base gradient (Simulating sunlight coming from upper left)
      const oceanGrad = ctx.createRadialGradient(
        cx - currentRadius * 0.35,
        cy - currentRadius * 0.35,
        currentRadius * 0.05,
        cx,
        cy,
        currentRadius
      );
      oceanGrad.addColorStop(0, '#0c4a6e'); // Deep bright ocean
      oceanGrad.addColorStop(0.5, '#072e49'); // Mid ocean blue
      oceanGrad.addColorStop(0.85, '#031726'); // Dark ocean
      oceanGrad.addColorStop(1, '#010a12'); // Twilight terminator

      ctx.fillStyle = oceanGrad;
      ctx.fillRect(cx - currentRadius, cy - currentRadius, currentRadius * 2, currentRadius * 2);

      // LATITUDE & LONGITUDE GRATICULES (GRID LINES)
      ctx.lineWidth = 0.75;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)'; // faint cyan

      // Parallels (every 30 degrees latitude)
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        let first = true;
        for (let lon = -180; lon <= 180; lon += 5) {
          const pt = projectGeoToSphere(lat, lon, localYaw, localPitch, currentRadius, cx, cy);
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

      // Meridians (every 30 degrees longitude)
      for (let lon = -180; lon < 180; lon += 30) {
        ctx.beginPath();
        let first = true;
        for (let lat = -80; lat <= 80; lat += 5) {
          const pt = projectGeoToSphere(lat, lon, localYaw, localPitch, currentRadius, cx, cy);
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

      // RENDER CONTINENT LANDMASSES
      CONTINENT_POLYGONS.forEach((poly, polyIndex) => {
        const isIndia = polyIndex === 0;
        const isTamilNadu = polyIndex === 1;

        ctx.beginPath();
        let hasVisiblePoint = false;
        let started = false;

        for (let i = 0; i <= poly.length; i++) {
          const [lat, lon] = poly[i % poly.length];
          const pt = projectGeoToSphere(lat, lon, localYaw, localPitch, currentRadius, cx, cy);
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
          // Land styling
          if (isTamilNadu) {
            ctx.fillStyle = 'rgba(16, 185, 129, 0.75)'; // Emerald highlight for Tamil Nadu
            ctx.fill();
            ctx.strokeStyle = '#34d399';
            ctx.lineWidth = 1.8;
            ctx.stroke();
          } else if (isIndia) {
            ctx.fillStyle = 'rgba(30, 90, 70, 0.85)'; // Distinct rich emerald-sage for India
            ctx.fill();
            ctx.strokeStyle = '#38bdf8'; // Glowing cyan boundary
            ctx.lineWidth = 1.4;
            ctx.stroke();
          } else {
            ctx.fillStyle = 'rgba(20, 55, 45, 0.72)'; // World landmass olive-green
            ctx.fill();
            ctx.strokeStyle = 'rgba(74, 222, 128, 0.35)'; // Faint coastline
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      });

      // GLOBE SPHERICAL DAY/NIGHT SHADING OVERLAY
      const shadeGrad = ctx.createLinearGradient(
        cx - currentRadius * 0.9,
        cy - currentRadius * 0.9,
        cx + currentRadius * 0.9,
        cy + currentRadius * 0.9
      );
      shadeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.12)'); // Sunlight sheen
      shadeGrad.addColorStop(0.4, 'rgba(0, 0, 0, 0)');
      shadeGrad.addColorStop(0.75, 'rgba(0, 0, 0, 0.45)');
      shadeGrad.addColorStop(1, 'rgba(0, 0, 0, 0.82)'); // Night dark side

      ctx.fillStyle = shadeGrad;
      ctx.fillRect(cx - currentRadius, cy - currentRadius, currentRadius * 2, currentRadius * 2);

      ctx.restore(); // Exit sphere clipping

      // GLOBE SURFACE LIMB OUTLINE
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, currentRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // RENDER 3D AQI BEACONS & MONITORING STATIONS
      const now = Date.now();
      const pulsePhase = (now % 2000) / 2000;

      displayedLocations.forEach((loc) => {
        const pt = projectGeoToSphere(loc.lat, loc.lon, localYaw, localPitch, currentRadius, cx, cy);
        if (!pt.visible) return;

        // Pillar height in pixels proportional to AQI and zoom
        const maxPillarPx = 35 * localZoom;
        const pillarHeight = Math.max(8, Math.min(maxPillarPx, (loc.aqi / 300) * maxPillarPx));
        const colorHex = getAQIColorCss(loc.aqi).hex;

        // Normal direction from center through base point
        const dx = pt.x - cx;
        const dy = pt.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const nx = dist > 0 ? dx / dist : 0;
        const ny = dist > 0 ? dy / dist : -1;

        const topX = pt.x + nx * pillarHeight;
        const topY = pt.y + ny * pillarHeight;

        // Base Target Pulsing Ring
        ctx.save();
        ctx.beginPath();
        const ringRadius = (3 + pulsePhase * 6) * Math.min(1.5, localZoom);
        ctx.arc(pt.x, pt.y, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = colorHex;
        ctx.globalAlpha = Math.max(0, 1 - pulsePhase);
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();

        // 3D Laser Pillar (Ground to Tip)
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
        ctx.lineTo(topX, topY);
        ctx.strokeStyle = colorHex;
        ctx.lineWidth = loc.isTamilNadu ? 2.5 : 1.8;
        ctx.stroke();

        // Tip glowing head
        ctx.beginPath();
        const headRadius = (loc.isTamilNadu ? 3.5 : 2.5) * Math.min(1.4, localZoom);
        ctx.arc(topX, topY, headRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = colorHex;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        // Draw Interactive Badge when zoomed in or hovered
        const shouldShowBadge =
          localZoom >= 1.35 ||
          hoveredPoint?.id === loc.id ||
          selectedPoint?.id === loc.id ||
          (loc.isIndia && localZoom >= 1.1);

        if (shouldShowBadge) {
          ctx.save();
          const badgeText = `${loc.aqi} ${loc.name}`;
          ctx.font = 'bold 10px monospace';
          const textMetrics = ctx.measureText(badgeText);
          const badgeW = textMetrics.width + 12;
          const badgeH = 16;
          const bx = topX - badgeW / 2;
          const by = topY - badgeH - 3;

          // Badge pill background
          ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
          ctx.strokeStyle = colorHex;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.roundRect(bx, by, badgeW, badgeH, 8);
          ctx.fill();
          ctx.stroke();

          // AQI number circle
          ctx.fillStyle = colorHex;
          ctx.beginPath();
          ctx.arc(bx + 8, by + badgeH / 2, 4, 0, Math.PI * 2);
          ctx.fill();

          // Badge text
          ctx.fillStyle = '#ffffff';
          ctx.fillText(badgeText, bx + 15, by + 11.5);
          ctx.restore();
        }
      });

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [displayedLocations, isAutoRotating, hoveredPoint, selectedPoint]);

  // Pointer event handlers for drag-to-rotate
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    setIsAutoRotating(false);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const baseRadius = Math.min(rect.width, rect.height) * 0.38;
    const currentRadius = baseRadius * zoomScale;

    if (isDraggingRef.current) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };

      const sensitivity = 0.005 / zoomScale;
      setYaw((prev) => prev + dx * sensitivity);
      setPitch((prev) => Math.max(-1.3, Math.min(1.3, prev - dy * sensitivity)));
    } else {
      // Hover hit-testing
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let closest: GlobeLocationPoint | null = null;
      let minDistance = 16; // 16px pick radius

      displayedLocations.forEach((loc) => {
        const pt = projectGeoToSphere(loc.lat, loc.lon, yaw, pitch, currentRadius, cx, cy);
        if (!pt.visible) return;

        const maxPillarPx = 35 * zoomScale;
        const pillarHeight = Math.max(8, Math.min(maxPillarPx, (loc.aqi / 300) * maxPillarPx));
        const dx = pt.x - cx;
        const dy = pt.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const nx = dist > 0 ? dx / dist : 0;
        const ny = dist > 0 ? dy / dist : -1;
        const topX = pt.x + nx * pillarHeight;
        const topY = pt.y + ny * pillarHeight;

        const dBase = Math.hypot(mouseX - pt.x, mouseY - pt.y);
        const dTip = Math.hypot(mouseX - topX, mouseY - topY);
        const dMin = Math.min(dBase, dTip);

        if (dMin < minDistance) {
          minDistance = dMin;
          closest = loc;
        }
      });

      setHoveredPoint(closest);
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  // Click on canvas to select location or dive into street level
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (hoveredPoint) {
      handleSelectPoint(hoveredPoint);
    }
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
    const newZoom = Math.max(0.65, Math.min(3.2, zoomScale * zoomFactor));

    // When user zooms in close and continues zooming, dive straight to street map!
    if (newZoom >= 2.6 && zoomScale >= 2.3 && onZoomToStreetLevel) {
      const target = selectedPoint || locations.find((l) => l.isIndia) || locations[0];
      onZoomToStreetLevel(target.lat, target.lon, 16, target.name);
      return;
    }

    setZoomScale(newZoom);
  };

  // Zoom button actions (+ and -)
  const handleZoomIn = () => {
    if (zoomScale >= 2.4 && onZoomToStreetLevel) {
      const target = selectedPoint || locations.find((l) => l.isIndia) || locations[0];
      onZoomToStreetLevel(target.lat, target.lon, 16, target.name);
      return;
    }
    setZoomScale((prev) => Math.min(3.0, prev * 1.25));
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => Math.max(0.65, prev * 0.8));
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[680px] lg:h-[750px] rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden flex flex-col justify-between select-none"
    >
      {/* 3D Canvas Viewport */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onClick={handleCanvasClick}
        onWheel={handleWheel}
        className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing w-full h-full"
      />

      {/* TOP HEADER: Title, Live Search & Street View Trigger */}
      <div className="relative z-20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pointer-events-none">
        {/* Title & Atmospheric Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 shrink-0">
            <Globe className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black tracking-tight text-white">
                3D Planetary AQI Globe
              </h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30 font-mono">
                {altitudeInfo.label} • {altitudeInfo.km}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Continuous live CAAQMS & WAQI atmospheric telemetry across all cities & countries
            </p>
          </div>
        </div>

        {/* Search Bar & Switch to Street Map */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          {/* Universal Search Bar */}
          <div className="relative w-52 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search world cities, states..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900/90 text-white placeholder-slate-400 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-md backdrop-blur-md"
            />

            {/* Autocomplete Results Dropdown */}
            {searchQuery.trim().length > 0 && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-800 max-h-60 overflow-y-auto">
                {searchResults.map((hit) => {
                  const cat = getAQIColorCss(hit.aqi);
                  return (
                    <button
                      key={hit.id}
                      type="button"
                      onClick={() => {
                        handleSelectPoint(hit);
                        setSearchQuery('');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center justify-between text-xs text-white transition-colors cursor-pointer"
                    >
                      <div className="truncate mr-2">
                        <p className="font-bold truncate">{hit.name}</p>
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

          {/* Refresh Stations */}
          <button
            type="button"
            onClick={fetchLiveStations}
            disabled={isUpdatingStations}
            title="Refresh real-time CAAQMS station feed"
            className="p-2 text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700 rounded-xl transition-colors shadow-md backdrop-blur-md cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isUpdatingStations ? 'animate-spin text-sky-400' : ''}`} />
          </button>

          {/* Switch to Street-Level Map Button */}
          {onSwitchTo2DMap && (
            <button
              type="button"
              onClick={() => {
                if (onZoomToStreetLevel && selectedPoint) {
                  onZoomToStreetLevel(selectedPoint.lat, selectedPoint.lon, 16, selectedPoint.name);
                } else {
                  onSwitchTo2DMap();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 border border-emerald-400/40 transition-colors shadow-md backdrop-blur-md cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-200" />
              <span>Street-Level Map</span>
            </button>
          )}
        </div>
      </div>

      {/* QUICK SHORTCUTS & REGION TABS BAR (Top Center) */}
      <div className="relative z-20 px-4 flex flex-col items-center justify-center gap-2 pointer-events-none">
        {/* Navigation & Target Shortcuts */}
        <div className="inline-flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950/85 border border-slate-800/80 shadow-2xl backdrop-blur-lg pointer-events-auto">
          {/* BACK TO GLOBE (Global View) */}
          <button
            type="button"
            onClick={() => {
              setZoomScale(1.0);
              flyTo(20, 0, 1.0);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              zoomScale <= 1.1
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Return to full planetary Earth view"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Full Earth</span>
          </button>

          {/* LOCATE INDIA SHORTCUT */}
          <button
            type="button"
            onClick={() => flyTo(21.5, 78.96, 1.6)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-emerald-600 hover:from-orange-400 hover:to-emerald-500 shadow-md transition-all cursor-pointer"
            title="Focus camera directly on the Indian Subcontinent"
          >
            <span>🇮🇳</span>
            <span>Locate India</span>
          </button>

          {/* ZOOM TO TAMIL NADU */}
          <button
            type="button"
            onClick={() => flyTo(11.12, 78.65, 2.25)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-100 bg-emerald-600/90 hover:bg-emerald-500 border border-emerald-400/40 shadow-md transition-all cursor-pointer"
            title="Deep zoom into Tamil Nadu's 38 districts & CAAQMS sensors"
          >
            <span>🌟</span>
            <span>Tamil Nadu</span>
          </button>

          {/* DIVE TO STREET VIEW BUTTON */}
          <button
            type="button"
            onClick={() => {
              const pt = selectedPoint || locations.find((l) => l.isIndia) || locations[0];
              if (onZoomToStreetLevel) {
                onZoomToStreetLevel(pt.lat, pt.lon, 16, pt.name);
              } else if (onSwitchTo2DMap) {
                onSwitchTo2DMap();
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600/90 hover:bg-indigo-500 text-indigo-100 border border-indigo-400/40 shadow-md transition-all cursor-pointer"
            title="Zoom into high-resolution street view with clear road network"
          >
            <MapPin className="w-3.5 h-3.5 text-sky-300" />
            <span>Zoom to Streets</span>
          </button>
        </div>

        {/* Region Filter Pills across Globe */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/75 border border-slate-800/80 backdrop-blur-md pointer-events-auto overflow-x-auto max-w-full text-[11px]">
          {[
            { id: 'all', label: `🌍 All Globe (${locations.length})` },
            { id: 'india', label: '🇮🇳 India' },
            { id: 'tamilnadu', label: '🌴 Tamil Nadu' },
            { id: 'asia', label: '🌏 Asia' },
            { id: 'europe', label: '🌍 Europe' },
            { id: 'americas', label: '🌎 Americas' },
            { id: 'middle-east-africa', label: '🌍 Middle East & Africa' },
          ].map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setFilterMode(r.id as any)}
              className={`px-2.5 py-0.5 rounded-lg font-bold transition-colors whitespace-nowrap cursor-pointer ${
                filterMode === r.id
                  ? 'bg-sky-500 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Atmospheric Descent Alert when zooming close to Earth */}
      {zoomScale >= 2.1 && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-30 animate-in fade-in slide-in-from-top-3 duration-300 pointer-events-auto">
          <div className="bg-slate-900/95 border border-sky-400/60 backdrop-blur-md px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-3 text-white text-xs">
            <div className="flex items-center gap-1.5 text-sky-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Approaching Surface ({altitudeInfo.km})</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const pt = selectedPoint || locations.find((l) => l.isIndia) || locations[0];
                if (onZoomToStreetLevel) {
                  onZoomToStreetLevel(pt.lat, pt.lon, 16, pt.name);
                } else if (onSwitchTo2DMap) {
                  onSwitchTo2DMap();
                }
              }}
              className="px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 font-bold shadow text-white cursor-pointer flex items-center gap-1.5"
            >
              <span>View Streets Clearly</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* FLOATING SIDE PANEL: Comprehensive AQI Telemetry & Health Diagnostics */}
      {selectedPoint && (
        <div className="absolute top-20 right-4 z-20 w-80 sm:w-96 max-h-[85%] overflow-y-auto p-4 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700 text-white shadow-2xl space-y-3 pointer-events-auto animate-in fade-in slide-in-from-right-4 duration-200 scrollbar-none">
          {/* Header & Close */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-sky-400 font-bold">
                <MapPin className="w-3.5 h-3.5" />
                <span>
                  {selectedPoint.isTamilNadu
                    ? `Tamil Nadu • ${selectedPoint.district || selectedPoint.city}`
                    : selectedPoint.isIndia
                    ? `India • ${selectedPoint.state || selectedPoint.city}`
                    : selectedPoint.country}
                </span>
              </div>
              <h4 className="text-lg font-black text-white mt-0.5">{selectedPoint.name}</h4>
              <p className="text-[11px] text-slate-400">{selectedPoint.stationName}</p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedPoint(null)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Primary AQI Meter Card */}
          {(() => {
            const cat = getAQIColorCss(selectedPoint.aqi);
            return (
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Current Air Quality
                  </span>
                  <span className="text-3xl font-black font-mono" style={{ color: cat.hex }}>
                    {selectedPoint.aqi}
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
                    <span>{selectedPoint.source === 'waqi-live' ? 'Live WAQI' : 'Live CPCB CAMS'}</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 6 Pollutants Concentrations Grid */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1.5">
              <span>Pollutant Concentrations</span>
              <span className="text-sky-400">Dominant: {selectedPoint.dominantPollutant}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block font-semibold">PM2.5</span>
                <span className="font-mono font-bold text-slate-100">{selectedPoint.pm25} µg/m³</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block font-semibold">PM10</span>
                <span className="font-mono font-bold text-slate-100">{selectedPoint.pm10} µg/m³</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block font-semibold">NO₂</span>
                <span className="font-mono font-bold text-slate-100">{selectedPoint.no2} µg/m³</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block font-semibold">SO₂</span>
                <span className="font-mono font-bold text-slate-100">{selectedPoint.so2} µg/m³</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block font-semibold">CO</span>
                <span className="font-mono font-bold text-slate-100">{selectedPoint.co} ppb</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block font-semibold">Ozone (O₃)</span>
                <span className="font-mono font-bold text-slate-100">{selectedPoint.o3} µg/m³</span>
              </div>
            </div>
          </div>

          {/* Meteorological Ambient Drivers */}
          <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-amber-400" />
              <span>{selectedPoint.temperature || 28}°C</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-sky-400" />
              <span>{selectedPoint.humidity || 65}% Humidity</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5 text-emerald-400" />
              <span>{selectedPoint.windSpeed || 10} km/h</span>
            </div>
          </div>

          {/* Health Advisory & Precautionary Protocol */}
          <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-indigo-300">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Health Precautions & Advisory</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {selectedPoint.aqi <= 50
                ? 'Air quality is satisfactory. Outdoor activities pose virtually zero risk for all sensitive groups.'
                : selectedPoint.aqi <= 100
                ? 'Acceptable air quality. Unusually sensitive individuals should consider limiting prolonged outdoor exertion.'
                : selectedPoint.aqi <= 150
                ? 'Sensitive groups (asthmatics, seniors, children) should reduce prolonged or heavy outdoor exertion.'
                : selectedPoint.aqi <= 200
                ? 'Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.'
                : 'Emergency health warning: All individuals should wear N95 respirators and activate indoor HEPA filtration.'}
            </p>
          </div>

          {/* Station Metadata & Agency */}
          <div className="text-[10px] text-slate-400 space-y-0.5 pt-1 border-t border-slate-800">
            <p>
              <span className="font-semibold text-slate-300">Operating Agency:</span>{' '}
              {selectedPoint.operatingAgency || 'Continuous Ambient CAAQMS'}
            </p>
            <p>
              <span className="font-semibold text-slate-300">Coordinates:</span> {selectedPoint.lat.toFixed(3)}°N,{' '}
              {selectedPoint.lon.toFixed(3)}°E
            </p>
            <p>
              <span className="font-semibold text-slate-300">Verification:</span> {selectedPoint.lastUpdated}
            </p>
          </div>

          {/* Actions: Zoom to Street Level & Dashboard */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => {
                if (onZoomToStreetLevel) {
                  onZoomToStreetLevel(selectedPoint.lat, selectedPoint.lon, 16, selectedPoint.name);
                } else if (onSwitchTo2DMap) {
                  onSwitchTo2DMap();
                }
              }}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-emerald-200" />
              <span>Zoom to Street Level (View Roads & Stations)</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => handleInspectInDashboard(selectedPoint)}
              className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer"
            >
              <span>Inspect in Live Sensor Dashboard</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* BOTTOM CONTROLS DOCK: Rotation & Zoom Controls, Filter Tabs & AQI Scale */}
      <div className="relative z-20 p-4 flex flex-col md:flex-row items-center justify-between gap-3 pointer-events-none">
        {/* AQI Color Scale Legend */}
        <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-300 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 pointer-events-auto">
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

        {/* Orbit, Auto-Rotate & Zoom Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 backdrop-blur-md rounded-2xl border border-slate-800 pointer-events-auto">
          {/* Auto-Rotation Play/Pause */}
          <button
            type="button"
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isAutoRotating
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={isAutoRotating ? 'Pause planetary spin' : 'Auto-spin globe'}
          >
            {isAutoRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          {/* Reset Orientation */}
          <button
            type="button"
            onClick={() => {
              setPitch(0.35);
              setYaw(-1.37);
              setZoomScale(1.0);
            }}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Reset to South Asia view"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-slate-800 mx-0.5" />

          {/* Zoom Out Button */}
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Altitude Level Tag */}
          <span className="px-2 py-1 text-[11px] font-mono font-bold text-sky-400 bg-slate-900 rounded-lg min-w-[70px] text-center border border-slate-800">
            {altitudeInfo.km}
          </span>

          {/* Zoom In Button */}
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Zoom In (Dives into street view when close)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
