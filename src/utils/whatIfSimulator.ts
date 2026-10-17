import {
  HourlyDataPoint,
  WeatherConditions,
  WhatIfParameters,
  WhatIfPreset,
  WhatIfResultPoint,
  WhatIfSimulationResult,
} from '../types';
import { computeAQI } from './aqiCalculator';

export const WHAT_IF_PRESETS: WhatIfPreset[] = [
  {
    id: 'gridlock',
    name: 'Metropolitan Traffic Gridlock',
    badge: 'Heavy Congestion',
    description: 'Simulates heavy urban rush-hour congestion with bumper-to-bumper combustion emissions and low wind ventilation.',
    params: {
      trafficDensity: 75,
      temperatureOffset: 2,
      windSpeed: 3,
      humidity: 60,
      industrialEmission: 20,
    },
  },
  {
    id: 'winter-inversion',
    name: 'Winter Thermal Inversion Trap',
    badge: 'Cold Stagnation',
    description: 'A shallow nocturnal atmospheric boundary layer traps soot and smoke beneath a warm air cap with high fog humidity.',
    params: {
      trafficDensity: 20,
      temperatureOffset: -8,
      windSpeed: 2,
      humidity: 88,
      industrialEmission: 25,
    },
  },
  {
    id: 'clean-lez',
    name: 'Low Emission Zone (LEZ) Policy',
    badge: 'Green Policy',
    description: 'Aggressive electric vehicle adoption, restricted heavy diesel freight corridors, and clean factory abatement.',
    params: {
      trafficDensity: -45,
      temperatureOffset: 0,
      windSpeed: 14,
      humidity: 50,
      industrialEmission: -40,
    },
  },
  {
    id: 'gale-flushing',
    name: 'High Wind Cold Front Flushing',
    badge: 'Atmospheric Clearing',
    description: 'A vigorous cold meteorological front brings brisk 28 km/h winds, rapidly dispersing aerosol particulate buildup.',
    params: {
      trafficDensity: 0,
      temperatureOffset: -3,
      windSpeed: 28,
      humidity: 45,
      industrialEmission: 0,
    },
  },
  {
    id: 'summer-photochemical',
    name: 'Summer Heatwave Ozone Spike',
    badge: 'Photochemical Smog',
    description: 'Intense ultraviolet solar radiation and elevated heat catalyze secondary photochemical ground-level ozone formation.',
    params: {
      trafficDensity: 30,
      temperatureOffset: 9,
      windSpeed: 5,
      humidity: 32,
      industrialEmission: 15,
    },
  },
];

/**
 * Runs the Machine Learning & Atmospheric Chemistry What-If Simulation
 */
export function simulatePollutionScenario(
  timeline: HourlyDataPoint[],
  currentWeather: WeatherConditions,
  params: WhatIfParameters
): WhatIfSimulationResult {
  // Use the next 24 hourly data points (or as many as available)
  const targetTimeline = timeline.slice(0, 24);

  // Baseline reference wind speed (avoid division by 0)
  const baselineWind = Math.max(3, currentWeather.windSpeed || 8);
  const simWind = Math.max(1, params.windSpeed);

  // 1. Wind Dispersion Multiplier (Box model dispersion: C ~ 1 / u^0.65)
  const windDispersionRatio = Math.pow(baselineWind / simWind, 0.65);

  // 2. Traffic Emission Multiplier
  const trafficFactor = 1 + params.trafficDensity / 100;

  // 3. Industrial / Stationary Multiplier
  const industrialFactor = 1 + params.industrialEmission / 100;

  // 4. Thermal & Photochemical Multiplier
  // Warm temperatures accelerate photochemical Ozone and secondary organic aerosols
  // Cold temperatures combined with low wind induce nocturnal boundary layer inversions
  const tempOffset = params.temperatureOffset;
  const photochemicalEffect = tempOffset > 0 ? 1 + tempOffset * 0.035 : 1;
  const coldInversionEffect = tempOffset < -3 && simWind < 5 ? 1 + Math.abs(tempOffset) * 0.045 : 1;

  // 5. Humidity Hygroscopic Aerosol Swelling Multiplier
  // Relative humidity > 70% swells inorganic aerosols (nitrates/sulfates) into larger light-scattering droplets
  const humidityExcess = Math.max(0, params.humidity - 60);
  const humidityHygroscopicFactor = 1 + (humidityExcess / 100) * 0.35;

  const resultPoints: WhatIfResultPoint[] = targetTimeline.map((pt, idx) => {
    const hour = new Date(pt.time).getHours();
    const isRushHour = (hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 21);
    const diurnalTrafficWeight = isRushHour ? 1.35 : 0.85;

    // Simulate primary PM2.5 alteration
    const trafficPMContribution = pt.pm25 * 0.45 * (trafficFactor * diurnalTrafficWeight);
    const industrialPMContribution = pt.pm25 * 0.3 * industrialFactor;
    const backgroundPMContribution = pt.pm25 * 0.25;

    const rawSimPM25 =
      (trafficPMContribution + industrialPMContribution + backgroundPMContribution) *
      windDispersionRatio *
      coldInversionEffect *
      humidityHygroscopicFactor;

    const simulatedPM25 = Math.max(1, Math.round(rawSimPM25 * 10) / 10);

    // Compute coarse PM10 scaling
    const simulatedPM10 = Math.max(
      2,
      Math.round(pt.pm10 * (0.6 * industrialFactor + 0.4 * trafficFactor) * windDispersionRatio * 10) / 10
    );

    // Compute Ozone scaling (photochemical)
    const isDaylight = hour >= 9 && hour <= 18;
    const ozoneSolarFactor = isDaylight ? photochemicalEffect * (1 + params.trafficDensity * 0.003) : 0.85;
    const simulatedO3 = Math.max(5, Math.round(pt.o3 * ozoneSolarFactor * (1 / Math.sqrt(windDispersionRatio))));

    // Compute NO2 (heavily coupled to combustion traffic)
    const simulatedNO2 = Math.max(2, Math.round(pt.no2 * trafficFactor * windDispersionRatio * 10) / 10);

    // Recompute standard EPA AQI for simulated mixture
    const simulatedAQIResult = computeAQI({
      pm25: simulatedPM25,
      pm10: simulatedPM10,
      no2: simulatedNO2,
      so2: Math.round(pt.so2 * industrialFactor * windDispersionRatio),
      co: Math.round(pt.co * trafficFactor * windDispersionRatio),
      o3: simulatedO3,
    });

    const baselineAQI = pt.aqi;
    const simulatedAQI = simulatedAQIResult.overallAQI;
    const deltaAQI = simulatedAQI - baselineAQI;

    return {
      time: pt.time,
      displayTime: pt.displayTime,
      baselineAQI,
      simulatedAQI,
      baselinePM25: pt.pm25,
      simulatedPM25,
      deltaAQI,
    };
  });

  // Calculate Aggregates
  const totalDelta = resultPoints.reduce((acc, p) => acc + p.deltaAQI, 0);
  const avgDeltaAQI = Math.round((totalDelta / (resultPoints.length || 1)) * 10) / 10;

  let peakSimulatedAQI = 0;
  let peakSimulatedHour = targetTimeline[0]?.displayTime || '12:00';

  resultPoints.forEach((p) => {
    if (p.simulatedAQI > peakSimulatedAQI) {
      peakSimulatedAQI = p.simulatedAQI;
      peakSimulatedHour = p.displayTime;
    }
  });

  // Determine dominant driving factor for scientific verdict
  let dominantChangeFactor = 'Wind Speed Dispersion';
  let scientificExplanation = '';
  let mitigationImpact = '';

  if (Math.abs(params.trafficDensity) >= 50) {
    dominantChangeFactor = `${params.trafficDensity > 0 ? 'Surge in' : 'Reduction of'} Vehicular Traffic`;
    scientificExplanation =
      params.trafficDensity > 0
        ? `Elevated vehicle volume generates immediate tailpipe NOx and unburned hydrocarbon emissions, causing fine particulate soot accumulation across commute corridors.`
        : `Drastic reduction in combustion engines removes the primary primary-combustion aerosol source, driving down toxic ultrafine particulates.`;
  } else if (simWind < 4) {
    dominantChangeFactor = 'Atmospheric Boundary Stagnation (Low Wind)';
    scientificExplanation = `Near-calm surface winds (${simWind} km/h) eliminate advective transport and turbulent mixing, trapping all local emissions near ground level.`;
  } else if (simWind >= 20) {
    dominantChangeFactor = 'High Wind Advection Flushing';
    scientificExplanation = `Brisk winds (${simWind} km/h) create strong horizontal ventilation that flushes air masses faster than local source emissions can accumulate.`;
  } else if (params.temperatureOffset >= 6) {
    dominantChangeFactor = 'Photochemical Thermal Acceleration';
    scientificExplanation = `Elevated ambient heat accelerates ozone formation rates and volatile aerosol condensation into secondary particulate matter.`;
  } else if (params.humidity >= 80) {
    dominantChangeFactor = 'Aerosol Hygroscopic Growth';
    scientificExplanation = `High ambient moisture causes hygroscopic sulfate and nitrate particles to absorb water vapor, drastically increasing aerosol light-scattering haze.`;
  } else {
    dominantChangeFactor = 'Multi-factor Urban Covariance';
    scientificExplanation = `Combined adjustments in traffic, meteorological dispersion, and emission intensity shifted the 24-hour pollution trajectory.`;
  }

  if (avgDeltaAQI > 20) {
    mitigationImpact = `Deterioration: Scenario increases average AQI by +${avgDeltaAQI} points. Widespread public health warnings and outdoor exercise cancellation would be triggered.`;
  } else if (avgDeltaAQI < -15) {
    mitigationImpact = `Improvement: Scenario lowers average AQI by ${Math.abs(avgDeltaAQI)} points. Demonstrates dramatic benefits of municipal clean fleet and traffic diversion policies.`;
  } else {
    mitigationImpact = `Mild Impact: Scenario produces a modest ${avgDeltaAQI >= 0 ? '+' : ''}${avgDeltaAQI} AQI shift with localized impact.`;
  }

  return {
    timeline: resultPoints,
    avgDeltaAQI,
    peakSimulatedAQI,
    peakSimulatedHour,
    dominantChangeFactor,
    scientificExplanation,
    mitigationImpact,
  };
}
