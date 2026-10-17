import { MLForecastSummary, PollutantValues, SmartAlert, WeatherConditions } from '../types';
import { WHO_GUIDELINES, getAQICategory } from './aqiCalculator';

export function evaluateSmartAlerts(
  aqi: number,
  pollutants: PollutantValues,
  weather: WeatherConditions,
  forecast?: MLForecastSummary
): SmartAlert[] {
  const alerts: SmartAlert[] = [];
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // 1. Overall AQI Category Alert
  const category = getAQICategory(aqi);
  if (aqi >= 151) {
    alerts.push({
      id: 'aqi-critical',
      severity: aqi >= 201 ? 'critical' : 'danger',
      title: `${category.label} Air Quality Alert (AQI ${aqi})`,
      message: `Current air pollution has entered the ${category.label.toLowerCase()} zone. Microscopic particulate matter can penetrate deep into the alveolar tissue.`,
      recommendation: category.cautionaryStatement,
      targetGroups: ['All Residents', 'Asthma/Lung Patients', 'Cardiovascular Patients', 'Children & Seniors'],
      timestamp: now,
    });
  } else if (aqi >= 101) {
    alerts.push({
      id: 'aqi-sensitive',
      severity: 'warning',
      title: 'Unhealthy for Sensitive Groups (AQI ' + aqi + ')',
      message: 'Air quality poses an elevated risk to individuals with respiratory conditions, the elderly, and young children.',
      recommendation: 'Sensitive individuals should limit prolonged outdoor physical exertion and keep quick-relief inhalers accessible.',
      targetGroups: ['Asthma Patients', 'Elderly', 'Infants & Toddlers', 'Outdoor Athletes'],
      timestamp: now,
    });
  }

  // 2. PM2.5 Specific Threat Check
  if (pollutants.pm25 > 55.4) {
    alerts.push({
      id: 'pm25-high',
      severity: 'danger',
      title: `PM2.5 Exceedance: ${pollutants.pm25} µg/m³`,
      message: `PM2.5 levels are currently ${Math.round((pollutants.pm25 / WHO_GUIDELINES.pm25.limit24h) * 10) / 10}x above the WHO 24-hour health guideline (${WHO_GUIDELINES.pm25.limit24h} µg/m³).`,
      pollutant: 'PM2.5',
      value: pollutants.pm25,
      threshold: 55.4,
      recommendation: 'Operate certified HEPA air cleaners indoors. Seal drafty windows and wear an N95/FFP2 mask if commuting.',
      targetGroups: ['Pediatric Groups', 'Respiratory Patients', 'Commuters'],
      timestamp: now,
    });
  } else if (pollutants.pm25 > 35.4) {
    alerts.push({
      id: 'pm25-moderate',
      severity: 'warning',
      title: `Elevated PM2.5 Exposure (${pollutants.pm25} µg/m³)`,
      message: `Fine combustion particles exceed the US EPA 24-hour National Ambient Air Quality standard.`,
      pollutant: 'PM2.5',
      value: pollutants.pm25,
      threshold: 35.4,
      recommendation: 'Avoid strenuous outdoor running or cardio workouts. Ventilate rooms during lower emission hours.',
      targetGroups: ['Runners & Cyclists', 'Individuals with Asthma'],
      timestamp: now,
    });
  }

  // 3. Ground-level Ozone (O3) Photochemical Alert
  if (pollutants.o3 > 140) {
    alerts.push({
      id: 'o3-spike',
      severity: 'warning',
      title: `Tropospheric Ozone Surge (${pollutants.o3} µg/m³)`,
      message: `Strong solar radiation is catalyzing secondary photochemical oxidant formation, causing airway inflammation.`,
      pollutant: 'O3',
      value: pollutants.o3,
      threshold: 140,
      recommendation: 'Reschedule outdoor sports from mid-afternoon (13:00-17:00) to early morning when ozone is lowest.',
      targetGroups: ['Athletes', 'Children Playing Outdoors', 'COPD Patients'],
      timestamp: now,
    });
  }

  // 4. Nitrogen Dioxide (NO2) Traffic Spike
  if (pollutants.no2 > 100) {
    alerts.push({
      id: 'no2-traffic',
      severity: 'warning',
      title: `High Nitrogen Dioxide Detected (${pollutants.no2} µg/m³)`,
      message: `Elevated NO2 concentrations indicate dense nearby vehicular combustion and thermal emissions.`,
      pollutant: 'NO2',
      value: pollutants.no2,
      threshold: 100,
      recommendation: 'Avoid walking along congested traffic corridors or highway thoroughfares.',
      targetGroups: ['Pedestrians', 'Urban Commuters'],
      timestamp: now,
    });
  }

  // 5. Atmospheric Stagnation / Smog Trapping
  if (weather.windSpeed < 5 && weather.relativeHumidity > 75 && aqi > 70) {
    alerts.push({
      id: 'weather-inversion',
      severity: 'info',
      title: 'Atmospheric Stagnation & Thermal Inversion',
      message: `Low surface wind (${weather.windSpeed} km/h) and high relative humidity (${weather.relativeHumidity}%) are suppressing atmospheric boundary ventilation.`,
      recommendation: 'Pollutants will linger at surface level until thermal heating or increased wind velocity clears the boundary layer.',
      targetGroups: ['General Population'],
      timestamp: now,
    });
  }

  // 6. Machine Learning Predictive Deterioration Alert
  if (forecast && forecast.trendDirection === 'deteriorating' && forecast.target24hAQI > 100) {
    alerts.push({
      id: 'forecast-deterioration',
      severity: 'warning',
      title: `Forecast Warning: AQI Worsening to ${forecast.target24hAQI} in 24h`,
      message: `Our predictive regression model forecasts a +${forecast.trendDelta} point AQI increase peaking around ${forecast.predictedPeakHour}.`,
      recommendation: `Plan sensitive outdoor activities in advance. ${forecast.safeWindowRecommendation}`,
      targetGroups: ['School Administrators', 'Event Organizers', 'Vulnerable Residents'],
      timestamp: now,
    });
  }

  // Default optimal conditions if nothing triggered
  if (alerts.length === 0) {
    alerts.push({
      id: 'optimal-air',
      severity: 'info',
      title: 'Optimal Air Quality Conditions',
      message: 'All major air pollutants (PM2.5, PM10, NO2, SO2, CO, O3) are within safe EPA and WHO baseline thresholds.',
      recommendation: 'Excellent weather for outdoor recreation, natural room ventilation, and cardiovascular exercise.',
      targetGroups: ['General Population'],
      timestamp: now,
    });
  }

  return alerts;
}
