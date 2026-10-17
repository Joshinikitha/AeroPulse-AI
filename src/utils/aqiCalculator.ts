import { AQICategory, AQILevel, AQIResult, PollutantValues } from '../types';

export const AQI_CATEGORIES: Record<AQILevel, AQICategory> = {
  good: {
    level: 'good',
    label: 'Good',
    min: 0,
    max: 50,
    color: '#10b981', // emerald-500
    bgColor: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    borderColor: 'border-emerald-300',
    textColor: 'text-emerald-700',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'Air quality is satisfactory and poses little or no risk.',
    healthImplications: 'Air pollution poses little or no health risk to any demographic group.',
    cautionaryStatement: 'Enjoy your usual outdoor activities.',
  },
  moderate: {
    level: 'moderate',
    label: 'Moderate',
    min: 51,
    max: 100,
    color: '#eab308', // amber-500
    bgColor: 'bg-amber-50 text-amber-900 border-amber-200',
    borderColor: 'border-amber-300',
    textColor: 'text-amber-700',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'Air quality is acceptable; however, some pollutants may cause moderate health concern.',
    healthImplications: 'Respiratory symptoms possible in unusually sensitive individuals.',
    cautionaryStatement: 'Unusually sensitive people should consider reducing prolonged outdoor exertion.',
  },
  sensitive: {
    level: 'sensitive',
    label: 'Unhealthy for Sensitive Groups',
    min: 101,
    max: 150,
    color: '#f97316', // orange-500
    bgColor: 'bg-orange-50 text-orange-900 border-orange-200',
    borderColor: 'border-orange-300',
    textColor: 'text-orange-700',
    badgeClass: 'bg-orange-100 text-orange-800 border-orange-200',
    description: 'Members of sensitive groups may experience health effects. General public is less likely to be affected.',
    healthImplications: 'Increased likelihood of respiratory symptoms in children, elderly, and people with asthma or lung disease.',
    cautionaryStatement: 'Active children, elderly adults, and individuals with respiratory issues should limit prolonged outdoor exertion.',
  },
  unhealthy: {
    level: 'unhealthy',
    label: 'Unhealthy',
    min: 151,
    max: 200,
    color: '#ef4444', // red-500
    bgColor: 'bg-rose-50 text-rose-900 border-rose-200',
    borderColor: 'border-rose-300',
    textColor: 'text-rose-700',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
    description: 'Everyone may begin to experience health effects; members of sensitive groups may experience more serious effects.',
    healthImplications: 'General public will experience irritation; susceptible individuals face aggravated heart and lung diseases.',
    cautionaryStatement: 'Everyone should reduce prolonged or heavy exertion outdoors. Wear an N95 mask in traffic or industrial areas.',
  },
  'very-unhealthy': {
    level: 'very-unhealthy',
    label: 'Very Unhealthy',
    min: 201,
    max: 300,
    color: '#8b5cf6', // purple-500
    bgColor: 'bg-purple-50 text-purple-900 border-purple-200',
    borderColor: 'border-purple-300',
    textColor: 'text-purple-700',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Health alert: The risk of health effects is increased for everyone.',
    healthImplications: 'Significant aggravation of respiratory/cardiovascular illness; significant reduction in lung function.',
    cautionaryStatement: 'Sensitive groups should avoid all outdoor physical activities; everyone else should strictly avoid prolonged outdoor exertion.',
  },
  hazardous: {
    level: 'hazardous',
    label: 'Hazardous',
    min: 301,
    max: 500,
    color: '#881337', // rose-900
    bgColor: 'bg-stone-900 text-rose-100 border-rose-900',
    borderColor: 'border-rose-950',
    textColor: 'text-rose-400',
    badgeClass: 'bg-rose-950 text-rose-200 border-rose-800',
    description: 'Health warning of emergency conditions: Everyone is more likely to be affected.',
    healthImplications: 'Serious risk of respiratory cardiovascular distress and premature mortality across the entire population.',
    cautionaryStatement: 'Remain indoors with active HEPA air filtration. Keep windows sealed and avoid all outdoor physical exposure.',
  },
};

interface Breakpoint {
  cLow: number;
  cHigh: number;
  iLow: number;
  iHigh: number;
}

// Official EPA Breakpoint tables
const PM25_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0.0, cHigh: 12.0, iLow: 0, iHigh: 50 },
  { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
  { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
  { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
  { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
  { cLow: 250.5, cHigh: 350.4, iLow: 301, iHigh: 400 },
  { cLow: 350.5, cHigh: 500.4, iLow: 401, iHigh: 500 },
];

const PM10_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0, cHigh: 54, iLow: 0, iHigh: 50 },
  { cLow: 55, cHigh: 154, iLow: 51, iHigh: 100 },
  { cLow: 155, cHigh: 254, iLow: 101, iHigh: 150 },
  { cLow: 255, cHigh: 354, iLow: 151, iHigh: 200 },
  { cLow: 355, cHigh: 424, iLow: 201, iHigh: 300 },
  { cLow: 425, cHigh: 504, iLow: 301, iHigh: 400 },
  { cLow: 505, cHigh: 604, iLow: 401, iHigh: 500 },
];

// O3 (µg/m³) conversion for 8-hr EPA
const O3_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0, cHigh: 106, iLow: 0, iHigh: 50 },
  { cLow: 107, cHigh: 140, iLow: 51, iHigh: 100 },
  { cLow: 141, cHigh: 170, iLow: 101, iHigh: 150 },
  { cLow: 171, cHigh: 210, iLow: 151, iHigh: 200 },
  { cLow: 211, cHigh: 400, iLow: 201, iHigh: 300 },
  { cLow: 401, cHigh: 800, iLow: 301, iHigh: 500 },
];

// NO2 (µg/m³) 1-hr EPA
const NO2_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0, cHigh: 100, iLow: 0, iHigh: 50 },
  { cLow: 101, cHigh: 188, iLow: 51, iHigh: 100 },
  { cLow: 189, cHigh: 676, iLow: 101, iHigh: 150 },
  { cLow: 677, cHigh: 1220, iLow: 151, iHigh: 200 },
  { cLow: 1221, cHigh: 2349, iLow: 201, iHigh: 300 },
  { cLow: 2350, cHigh: 3849, iLow: 301, iHigh: 500 },
];

// SO2 (µg/m³) 1-hr EPA
const SO2_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0, cHigh: 92, iLow: 0, iHigh: 50 },
  { cLow: 93, cHigh: 196, iLow: 51, iHigh: 100 },
  { cLow: 197, cHigh: 485, iLow: 101, iHigh: 150 },
  { cLow: 486, cHigh: 797, iLow: 151, iHigh: 200 },
  { cLow: 798, cHigh: 1583, iLow: 201, iHigh: 300 },
  { cLow: 1584, cHigh: 2630, iLow: 301, iHigh: 500 },
];

// CO (mg/m³ or converted µg/m³)
const CO_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0, cHigh: 5000, iLow: 0, iHigh: 50 },
  { cLow: 5001, cHigh: 10800, iLow: 51, iHigh: 100 },
  { cLow: 10801, cHigh: 14200, iLow: 101, iHigh: 150 },
  { cLow: 14201, cHigh: 17500, iLow: 151, iHigh: 200 },
  { cLow: 17501, cHigh: 34800, iLow: 201, iHigh: 300 },
  { cLow: 34801, cHigh: 57200, iLow: 301, iHigh: 500 },
];

function calculateSubIndex(concentration: number, breakpoints: Breakpoint[]): number {
  if (concentration < 0) return 0;
  
  for (const bp of breakpoints) {
    if (concentration >= bp.cLow && concentration <= bp.cHigh) {
      const aqi = ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (concentration - bp.cLow) + bp.iLow;
      return Math.round(aqi);
    }
  }

  // Above highest breakpoint
  const highest = breakpoints[breakpoints.length - 1];
  if (concentration > highest.cHigh) {
    const aqi = highest.iHigh + ((concentration - highest.cHigh) / (highest.cHigh - highest.cLow)) * 50;
    return Math.min(500, Math.round(aqi));
  }

  return 0;
}

export function getAQICategory(aqi: number): AQICategory {
  if (aqi <= 50) return AQI_CATEGORIES.good;
  if (aqi <= 100) return AQI_CATEGORIES.moderate;
  if (aqi <= 150) return AQI_CATEGORIES.sensitive;
  if (aqi <= 200) return AQI_CATEGORIES.unhealthy;
  if (aqi <= 300) return AQI_CATEGORIES['very-unhealthy'];
  return AQI_CATEGORIES.hazardous;
}

export function computeAQI(pollutants: PollutantValues): AQIResult {
  const pm25Sub = calculateSubIndex(pollutants.pm25, PM25_BREAKPOINTS);
  const pm10Sub = calculateSubIndex(pollutants.pm10, PM10_BREAKPOINTS);
  const o3Sub = calculateSubIndex(pollutants.o3, O3_BREAKPOINTS);
  const no2Sub = calculateSubIndex(pollutants.no2, NO2_BREAKPOINTS);
  const so2Sub = calculateSubIndex(pollutants.so2, SO2_BREAKPOINTS);
  const coSub = calculateSubIndex(pollutants.co, CO_BREAKPOINTS);

  const subIndices: Record<keyof PollutantValues, number> = {
    pm25: pm25Sub,
    pm10: pm10Sub,
    o3: o3Sub,
    no2: no2Sub,
    so2: so2Sub,
    co: coSub,
  };

  let maxAQI = 0;
  let dominant: keyof PollutantValues = 'pm25';

  for (const [key, value] of Object.entries(subIndices) as [keyof PollutantValues, number][]) {
    if (value > maxAQI) {
      maxAQI = value;
      dominant = key;
    }
  }

  // Minimum floor if non-zero
  const overallAQI = Math.max(1, maxAQI);
  const category = getAQICategory(overallAQI);

  return {
    overallAQI,
    category,
    dominantPollutant: dominant,
    subIndices,
  };
}

export const WHO_GUIDELINES: Record<keyof PollutantValues, { limit24h: number; unit: string; name: string }> = {
  pm25: { limit24h: 15, unit: 'µg/m³', name: 'Fine Particulate Matter (PM2.5)' },
  pm10: { limit24h: 45, unit: 'µg/m³', name: 'Coarse Particulate Matter (PM10)' },
  no2: { limit24h: 25, unit: 'µg/m³', name: 'Nitrogen Dioxide (NO2)' },
  so2: { limit24h: 40, unit: 'µg/m³', name: 'Sulfur Dioxide (SO2)' },
  co: { limit24h: 4000, unit: 'µg/m³', name: 'Carbon Monoxide (CO)' },
  o3: { limit24h: 100, unit: 'µg/m³', name: 'Ozone (O3 - 8h)' },
};
