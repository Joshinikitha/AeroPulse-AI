import {
  HealthPersonaAssessment,
  HealthPersonaConfig,
  HourlyDataPoint,
  MLForecastSummary,
  PersonaType,
  PollutantValues,
  WeatherConditions,
} from '../types';

export const HEALTH_PERSONAS: Record<PersonaType, HealthPersonaConfig> = {
  general: {
    id: 'general',
    name: 'General Public',
    subtitle: 'Healthy Adults & Standard Population',
    description: 'Standard EPA and WHO baseline thresholds. Generally resilient to short-term moderate ambient pollution.',
    aqiSafeLimit: 100,
    aqiHazardLimit: 200,
    pm25SafeLimit: 35.4,
    clinicalRationale: 'Normal physiological respiratory clearance mechanisms manage mild aerosol loads without acute distress.',
  },
  asthma: {
    id: 'asthma',
    name: 'Asthma & Respiratory Patient',
    subtitle: 'Hyper-reactive Airway Sensitivity',
    description: 'Highly vulnerable to bronchospasms, bronchial inflammation, and acute wheezing triggered even by moderate aerosol concentrations.',
    aqiSafeLimit: 55,
    aqiHazardLimit: 120,
    pm25SafeLimit: 15.0,
    clinicalRationale: 'Fine particulate matter (PM2.5) and nitrogen dioxide directly trigger mast cell degranulation and airway hyper-responsiveness.',
  },
  athlete: {
    id: 'athlete',
    name: 'Outdoor Athlete & Runner',
    subtitle: 'Elevated Minute Ventilation Volume',
    description: 'Cardiovascular workouts increase inhalation volume 10x to 20x, bypassing nasal filtration and driving pollutants deep into lung alveoli.',
    aqiSafeLimit: 75,
    aqiHazardLimit: 140,
    pm25SafeLimit: 25.0,
    clinicalRationale: 'Heavy mouth-breathing at 60-120 L/min delivers high doses of PM2.5 and Ozone directly into distal bronchioles during aerobic exertion.',
  },
  senior: {
    id: 'senior',
    name: 'Senior Citizen (65+)',
    subtitle: 'Cardiovascular & Vascular Vulnerability',
    description: 'Susceptible to acute microvascular constriction, arterial stiffness, elevated blood pressure, and aggravated cardiac ischemia.',
    aqiSafeLimit: 70,
    aqiHazardLimit: 130,
    pm25SafeLimit: 20.0,
    clinicalRationale: 'Systemic oxidative stress caused by ultrafine particulates crossing into capillaries elevates ischemic heart disease and stroke risks.',
  },
  children: {
    id: 'children',
    name: 'Children & Pediatric',
    subtitle: 'Developing Lungs & Higher Respiratory Rate',
    description: 'Children breathe more air per kilogram of body weight than adults and spend more time playing actively near ground-level emissions.',
    aqiSafeLimit: 60,
    aqiHazardLimit: 125,
    pm25SafeLimit: 18.0,
    clinicalRationale: 'Lungs continue developing alveoli until age 8-10. Heavy early particulate exposure leads to permanently reduced vital capacity and childhood asthma.',
  },
};

export function evaluatePersona(
  personaType: PersonaType,
  currentAQI: number,
  pollutants: PollutantValues,
  weather: WeatherConditions,
  forecast?: MLForecastSummary,
  hourlyTimeline: HourlyDataPoint[] = []
): HealthPersonaAssessment {
  const config = HEALTH_PERSONAS[personaType];

  // Calculate persona-specific normalized risk score (0 to 100)
  // Weighted by persona's custom safe limit
  const aqiRatio = currentAQI / config.aqiSafeLimit;
  const pm25Ratio = pollutants.pm25 / config.pm25SafeLimit;
  const rawScore = Math.max(aqiRatio, pm25Ratio) * 45;
  const riskScore = Math.min(100, Math.max(5, Math.round(rawScore)));

  let currentRiskLevel: HealthPersonaAssessment['currentRiskLevel'] = 'Optimal';
  let riskColor = '#10b981';
  let riskBadgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';

  if (currentAQI > config.aqiHazardLimit || riskScore >= 80) {
    currentRiskLevel = 'Severe';
    riskColor = '#881337';
    riskBadgeClass = 'bg-rose-900 text-rose-100 border-rose-800';
  } else if (currentAQI > config.aqiSafeLimit || riskScore >= 60) {
    currentRiskLevel = 'High';
    riskColor = '#ef4444';
    riskBadgeClass = 'bg-rose-100 text-rose-800 border-rose-300';
  } else if (currentAQI > config.aqiSafeLimit * 0.75 || riskScore >= 40) {
    currentRiskLevel = 'Moderate';
    riskColor = '#f59e0b';
    riskBadgeClass = 'bg-amber-100 text-amber-900 border-amber-300';
  } else if (riskScore >= 25) {
    currentRiskLevel = 'Low';
    riskColor = '#0ea5e9';
    riskBadgeClass = 'bg-sky-100 text-sky-800 border-sky-200';
  } else {
    currentRiskLevel = 'Optimal';
    riskColor = '#10b981';
    riskBadgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
  }

  // Persona-specific dynamic warnings and action protocols
  let personalizedWarning = '';
  let actionProtocol: string[] = [];
  let medicationAlert: string | undefined = undefined;

  const activityGuidance: HealthPersonaAssessment['activityGuidance'] = {
    outdoorExercise: 'Safe',
    maskRequirement: 'None',
    windowVentilation: 'Open freely',
    airPurifierSetting: 'Eco / Off',
  };

  switch (personaType) {
    case 'asthma':
      if (currentRiskLevel === 'Severe' || currentRiskLevel === 'High') {
        personalizedWarning = `CRITICAL ASTHMA WARNING: AQI ${currentAQI} and PM2.5 (${pollutants.pm25} µg/m³) are well above your safe limit of ${config.aqiSafeLimit}. Extreme risk of severe bronchospasm.`;
        actionProtocol = [
          'Keep short-acting rescue bronchodilator (e.g. Albuterol) on your person at all times.',
          'Remain indoors in a room with active True HEPA particulate filtration.',
          'If outdoor transit is unavoidable, wear a sealed N95/FFP2 respirator.',
          'Monitor peak expiratory flow (PEF); follow red-zone action plan if peak flow drops >20%.',
        ];
        activityGuidance.outdoorExercise = 'Forbidden';
        activityGuidance.maskRequirement = 'Mandatory N95 / FFP3';
        activityGuidance.windowVentilation = 'Keep sealed & HEPA on';
        activityGuidance.airPurifierSetting = 'Turbo / Max HEPA';
        medicationAlert = 'Keep your rescue inhaler accessible; adhere to prescribed inhaled corticosteroids (ICS).';
      } else if (currentRiskLevel === 'Moderate') {
        personalizedWarning = `ASTHMA ELEVATED ALERT: AQI ${currentAQI} poses a noticeable risk for airway twitchiness, coughing, and chest tightness.`;
        actionProtocol = [
          'Pre-medicate 15 minutes before any brief outdoor exposure if recommended by your physician.',
          'Avoid walking near congested traffic intersections with high diesel NO2 fumes.',
          'Run indoor air purifiers on Medium setting.',
        ];
        activityGuidance.outdoorExercise = 'Avoid All Outdoor';
        activityGuidance.maskRequirement = 'N95 / KN95';
        activityGuidance.windowVentilation = 'Keep closed';
        activityGuidance.airPurifierSetting = 'Medium / Auto';
        medicationAlert = 'Ensure your inhaler has sufficient doses remaining before leaving home.';
      } else {
        personalizedWarning = `Air quality is currently manageable for asthma patients (AQI ${currentAQI}). Airway irritation risk is low.`;
        actionProtocol = ['Normal indoor and outdoor activities are permitted with standard asthma management.'];
        activityGuidance.outdoorExercise = 'Safe';
        activityGuidance.maskRequirement = 'None';
        activityGuidance.windowVentilation = 'Open freely';
        activityGuidance.airPurifierSetting = 'Eco / Off';
      }
      break;

    case 'athlete':
      if (currentRiskLevel === 'Severe' || currentRiskLevel === 'High') {
        personalizedWarning = `ATHLETIC TRAINING ALERT: Inhaling ${pollutants.pm25} µg/m³ of PM2.5 under heavy cardiac output will deposit up to 8x more particulates into your alveolar capillaries, depressing VO2 max and inducing systemic inflammation.`;
        actionProtocol = [
          'Cancel all outdoor marathon training, tempo runs, and high-intensity cycling.',
          'Relocate workouts to an indoor gym with certified HVAC HEPA filtration.',
          'If outdoor training cannot be avoided, limit to low-intensity zone 1 walking with a sports particulate mask.',
        ];
        activityGuidance.outdoorExercise = 'Avoid All Outdoor';
        activityGuidance.maskRequirement = 'N95 / KN95';
        activityGuidance.windowVentilation = 'Keep closed';
        activityGuidance.airPurifierSetting = 'Turbo / Max HEPA';
      } else if (currentRiskLevel === 'Moderate') {
        personalizedWarning = `MODERATE ATHLETE WARNING: Atmospheric ozone (${pollutants.o3} µg/m³) and particulates will cause throat burning and reduced lung vital capacity during vigorous cardio.`;
        actionProtocol = [
          'Switch tempo workouts to the early morning before photochemical smog and solar ozone synthesis peak.',
          'Shorten outdoor running sessions to under 45 minutes.',
          'Hydrate thoroughly with antioxidant-rich fluids to counter free radical oxidative stress.',
        ];
        activityGuidance.outdoorExercise = 'Reduce Duration';
        activityGuidance.maskRequirement = 'Recommended in traffic';
        activityGuidance.windowVentilation = 'Morning only';
        activityGuidance.airPurifierSetting = 'Medium / Auto';
      } else {
        personalizedWarning = `Optimal athletic training conditions! AQI ${currentAQI} provides clean air for high-intensity intervals and long-distance runs.`;
        actionProtocol = ['Take full advantage of current clear atmospheric conditions for outdoor endurance sessions.'];
        activityGuidance.outdoorExercise = 'Safe';
        activityGuidance.maskRequirement = 'None';
        activityGuidance.windowVentilation = 'Open freely';
        activityGuidance.airPurifierSetting = 'Eco / Off';
      }
      break;

    case 'senior':
      if (currentRiskLevel === 'Severe' || currentRiskLevel === 'High') {
        personalizedWarning = `CARDIOVASCULAR HEALTH WARNING: Particulates at ${pollutants.pm25} µg/m³ significantly increase blood viscosity, arterial pressure, and risk of acute coronary syndrome or stroke.`;
        actionProtocol = [
          'Stay indoors in temperature-regulated, HEPA-filtered rooms.',
          'Avoid heavy physical chores like gardening, lawn mowing, or snow clearing.',
          'Take prescribed blood pressure or cardiac medications on regular schedule.',
          'Seek emergency care immediately if experiencing chest tightness, lightheadedness, or shortness of breath.',
        ];
        activityGuidance.outdoorExercise = 'Forbidden';
        activityGuidance.maskRequirement = 'Mandatory N95 / FFP3';
        activityGuidance.windowVentilation = 'Keep sealed & HEPA on';
        activityGuidance.airPurifierSetting = 'Turbo / Max HEPA';
        medicationAlert = 'Keep blood pressure monitor and prescribed cardio medications handy.';
      } else if (currentRiskLevel === 'Moderate') {
        personalizedWarning = `ELEVATED SENIOR ADVISORY: AQI ${currentAQI} begins to strain cardiac output. Consider postponing outdoor leisure walks to cleaner morning hours.`;
        actionProtocol = [
          'Limit continuous outdoor walks to under 30 minutes in shaded green park areas away from roadways.',
          'Ensure indoor air purifiers are running in bedrooms and living rooms.',
        ];
        activityGuidance.outdoorExercise = 'Reduce Duration';
        activityGuidance.maskRequirement = 'Recommended in traffic';
        activityGuidance.windowVentilation = 'Morning only';
        activityGuidance.airPurifierSetting = 'Low';
      } else {
        personalizedWarning = `Air quality is safe and clear for senior citizens. Ideal for outdoor walks and recreational activities.`;
        actionProtocol = ['Enjoy gentle outdoor walks and open windows for fresh room ventilation.'];
        activityGuidance.outdoorExercise = 'Safe';
        activityGuidance.maskRequirement = 'None';
        activityGuidance.windowVentilation = 'Open freely';
        activityGuidance.airPurifierSetting = 'Eco / Off';
      }
      break;

    case 'children':
      if (currentRiskLevel === 'Severe' || currentRiskLevel === 'High') {
        personalizedWarning = `PEDIATRIC SAFETY ALERT: Children inhale 50% more air per pound of body weight than adults. Current levels of ${pollutants.pm25} µg/m³ pose severe risks of acute airway inflammation.`;
        actionProtocol = [
          'Keep children indoors; suspend all school recess and sports field practices.',
          'Set indoor HEPA filters to High in playrooms and nurseries.',
          'Ensure child wears a fitted pediatric KF94 or N95 mask if travel is essential.',
        ];
        activityGuidance.outdoorExercise = 'Forbidden';
        activityGuidance.maskRequirement = 'Mandatory N95 / FFP3';
        activityGuidance.windowVentilation = 'Keep sealed & HEPA on';
        activityGuidance.airPurifierSetting = 'Turbo / Max HEPA';
      } else if (currentRiskLevel === 'Moderate') {
        personalizedWarning = `MODERATE PEDIATRIC ADVISORY: Higher susceptibility to coughing and eye irritation during active playground games.`;
        actionProtocol = [
          'Limit high-intensity outdoor running games to 30 minutes.',
          'Encourage indoor reading and quiet activities during afternoon traffic peaks.',
        ];
        activityGuidance.outdoorExercise = 'Reduce Duration';
        activityGuidance.maskRequirement = 'Recommended in traffic';
        activityGuidance.windowVentilation = 'Morning only';
        activityGuidance.airPurifierSetting = 'Medium / Auto';
      } else {
        personalizedWarning = `Air quality is pure and safe for children. Outdoor playground activities and school sports are fully safe.`;
        actionProtocol = ['Ideal conditions for outdoor school games, biking, and park recreation.'];
        activityGuidance.outdoorExercise = 'Safe';
        activityGuidance.maskRequirement = 'None';
        activityGuidance.windowVentilation = 'Open freely';
        activityGuidance.airPurifierSetting = 'Eco / Off';
      }
      break;

    default: // General Public
      if (currentRiskLevel === 'Severe' || currentRiskLevel === 'High') {
        personalizedWarning = `GENERAL POPULATION UNHEALTHY ALERT: Air quality index (${currentAQI}) exceeds standard safety thresholds. Microscopic soot penetrates deeply into the lungs.`;
        actionProtocol = [
          'Reduce prolonged or strenuous outdoor physical exertion.',
          'Keep windows closed during high-traffic commute periods.',
          'Wear an N95 mask if walking or cycling near arterial highways.',
        ];
        activityGuidance.outdoorExercise = 'Avoid All Outdoor';
        activityGuidance.maskRequirement = 'N95 / KN95';
        activityGuidance.windowVentilation = 'Keep closed';
        activityGuidance.airPurifierSetting = 'Medium / Auto';
      } else if (currentRiskLevel === 'Moderate') {
        personalizedWarning = `Air quality is acceptable for the general population (AQI ${currentAQI}). Unusually sensitive individuals should take note.`;
        actionProtocol = ['Normal daily activities are safe; sensitive individuals may consider reducing heavy exertion.'];
        activityGuidance.outdoorExercise = 'Safe';
        activityGuidance.maskRequirement = 'None';
        activityGuidance.windowVentilation = 'Open freely';
        activityGuidance.airPurifierSetting = 'Eco / Off';
      } else {
        personalizedWarning = `Air quality is optimal! Low concentrations of all criteria pollutants pose zero health risk.`;
        actionProtocol = ['Enjoy all outdoor recreational and sporting activities.'];
        activityGuidance.outdoorExercise = 'Safe';
        activityGuidance.maskRequirement = 'None';
        activityGuidance.windowVentilation = 'Open freely';
        activityGuidance.airPurifierSetting = 'Eco / Off';
      }
      break;
  }

  // Safe window calculation for this specific persona
  let safeWindowRecommendation = forecast?.safeWindowRecommendation || 'Early morning hours (05:00 - 08:00)';
  if (hourlyTimeline.length > 0) {
    const futureHours = hourlyTimeline.filter((h) => h.isForecast);
    const safeHour = futureHours.find((h) => h.aqi <= config.aqiSafeLimit);
    if (safeHour) {
      safeWindowRecommendation = `Predicted safe window below your ${config.aqiSafeLimit} AQI threshold starts at ${safeHour.displayTime} (projected AQI ~${safeHour.aqi}).`;
    } else {
      safeWindowRecommendation = `No forecasted window below your ${config.aqiSafeLimit} AQI threshold in next 48h. Keep HEPA purifiers active.`;
    }
  }

  return {
    config,
    currentRiskLevel,
    riskScore,
    riskColor,
    riskBadgeClass,
    personalizedWarning,
    actionProtocol,
    activityGuidance,
    medicationAlert,
    safeWindowRecommendation,
  };
}
