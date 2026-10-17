export interface PollutantValues {
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  co: number;
  o3: number;
}

export interface WeatherConditions {
  temperature: number; // °C
  relativeHumidity: number; // %
  windSpeed: number; // km/h
  windDirection: number; // degrees
  surfacePressure: number; // hPa
  uvIndex?: number;
}

export type AQILevel =
  | 'good'
  | 'moderate'
  | 'sensitive'
  | 'unhealthy'
  | 'very-unhealthy'
  | 'hazardous';

export interface AQICategory {
  level: AQILevel;
  label: string;
  min: number;
  max: number;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  badgeClass: string;
  description: string;
  healthImplications: string;
  cautionaryStatement: string;
}

export interface AQIResult {
  overallAQI: number;
  category: AQICategory;
  dominantPollutant: keyof PollutantValues;
  subIndices: Record<keyof PollutantValues, number>;
}

export interface HourlyDataPoint {
  time: string;
  displayTime: string;
  isForecast: boolean;
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  co: number;
  o3: number;
  aqi: number;
  confidenceLower?: number;
  confidenceUpper?: number;
  temperature?: number;
  humidity?: number;
  windSpeed?: number;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
  description: string;
}

export interface MLForecastSummary {
  target24hAQI: number;
  target48hAQI: number;
  trendDirection: 'improving' | 'deteriorating' | 'stable';
  trendDelta: number;
  rmse: number;
  mae: number;
  r2: number;
  modelType: string;
  featureImportance: FeatureImportance[];
  predictedPeakHour: string;
  predictedPeakAQI: number;
  safeWindowRecommendation: string;
}

export interface SmartAlert {
  id: string;
  severity: 'info' | 'warning' | 'danger' | 'critical';
  title: string;
  message: string;
  pollutant?: string;
  value?: number;
  threshold?: number;
  recommendation: string;
  targetGroups: string[];
  timestamp: string;
}

export interface CityLocation {
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

export interface VulnerableGroupAdvice {
  group: string;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Severe';
  guidance: string;
}

export interface AIAnalysisResult {
  summary: string;
  primaryDriver: string;
  meteorologicalImpact: string;
  vulnerableGroups: VulnerableGroupAdvice[];
  actionSteps: string[];
  forecastVerdict: string;
  generatedAt: string;
  isAiGenerated: boolean;
}

export interface AirQualityPayload {
  city: CityLocation;
  current: {
    pollutants: PollutantValues;
    weather: WeatherConditions;
    aqi: AQIResult;
    updatedAt: string;
  };
  hourlyTimeline: HourlyDataPoint[];
  mlForecast: MLForecastSummary;
  alerts: SmartAlert[];
  aiAnalysis?: AIAnalysisResult;
  dataSource: {
    name: string;
    model: string;
    isFallback?: boolean;
  };
}

// 1. Health Risk Persona Recommender Types
export type PersonaType = 'general' | 'asthma' | 'athlete' | 'senior' | 'children';

export interface PersonaActivityGuidance {
  outdoorExercise: 'Safe' | 'Reduce Duration' | 'Avoid All Outdoor' | 'Forbidden';
  maskRequirement: 'None' | 'Recommended in traffic' | 'N95 / KN95' | 'Mandatory N95 / FFP3';
  windowVentilation: 'Open freely' | 'Morning only' | 'Keep closed' | 'Keep sealed & HEPA on';
  airPurifierSetting: 'Eco / Off' | 'Low' | 'Medium / Auto' | 'Turbo / Max HEPA';
}

export interface HealthPersonaConfig {
  id: PersonaType;
  name: string;
  subtitle: string;
  description: string;
  aqiSafeLimit: number; // custom threshold above which this persona enters warning
  aqiHazardLimit: number;
  pm25SafeLimit: number;
  clinicalRationale: string;
}

export interface HealthPersonaAssessment {
  config: HealthPersonaConfig;
  currentRiskLevel: 'Optimal' | 'Low' | 'Moderate' | 'High' | 'Severe';
  riskScore: number; // 0 - 100
  riskColor: string;
  riskBadgeClass: string;
  personalizedWarning: string;
  actionProtocol: string[];
  activityGuidance: PersonaActivityGuidance;
  medicationAlert?: string;
  safeWindowRecommendation: string;
}

// 2. Interactive What-If Pollution Simulator Types
export interface WhatIfParameters {
  trafficDensity: number; // -50% to +100%
  temperatureOffset: number; // -10 to +15 °C
  windSpeed: number; // 1 to 40 km/h
  humidity: number; // 15% to 95%
  industrialEmission: number; // -50% to +100%
}

export interface WhatIfPreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  params: WhatIfParameters;
}

export interface WhatIfResultPoint {
  time: string;
  displayTime: string;
  baselineAQI: number;
  simulatedAQI: number;
  baselinePM25: number;
  simulatedPM25: number;
  deltaAQI: number;
}

export interface WhatIfSimulationResult {
  timeline: WhatIfResultPoint[];
  avgDeltaAQI: number;
  peakSimulatedAQI: number;
  peakSimulatedHour: string;
  dominantChangeFactor: string;
  scientificExplanation: string;
  mitigationImpact: string;
}

// 3. Automated Emergency Alert & Notification System Types
export type NotificationChannel = 'SMS' | 'PUSH' | 'EMAIL' | 'BROADCAST';

export interface SimulatedNotification {
  id: string;
  timestamp: string;
  channel: NotificationChannel;
  recipientGroup: string;
  severity: 'info' | 'warning' | 'danger' | 'critical';
  title: string;
  body: string;
  status: 'Delivered' | 'Sent' | 'Broadcasting';
  aqiTrigger: number;
}

// 4. Conversational Chatbot & Tool-Use Types
export interface ToolExecutionInfo {
  toolName: string;
  label: string;
  status: 'running' | 'success' | 'failed';
  input: any;
  outputSummary: string;
  timestamp: string;
  rawData?: any;
}

export interface ProactiveAdvisory {
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  recommendation: string;
  category: 'weather' | 'air_quality' | 'outdoor_safety' | 'health';
  sourceTool?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  toolsUsed?: ToolExecutionInfo[];
  proactiveAdvisory?: ProactiveAdvisory;
  suggestions?: string[];
  liked?: boolean | null;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  pinned?: boolean;
}

export interface SensorTelemetry {
  deviceId: string;
  deviceName: string;
  timestamp: string;
  pm25: number;
  pm10: number;
  temperature: number;
  humidity: number;
  mq135Raw: number;
  coPpm: number;
  batteryVolt: number;
  computedAqi: number;
  status: 'online' | 'warning' | 'offline';
  locationName: string;
  ipAddress?: string;
  firmwareVersion?: string;
}

export interface SensorHistoryPoint {
  time: string;
  pm25: number;
  pm10: number;
  temperature: number;
  humidity: number;
  aqi: number;
}

export interface AirMonitoringStation {
  id: string;
  stationName: string;
  city: string;
  district: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  aqi: number;
  dominantPollutant: 'PM2.5' | 'PM10' | 'NO2' | 'SO2' | 'CO' | 'O3';
  category: 'Good' | 'Moderate' | 'Unhealthy for Sensitive Groups' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous';
  pollutants: PollutantValues;
  weather: {
    temperature: number;
    humidity: number;
    windSpeed: number;
  };
  stationType: 'Continuous Ambient CAAQMS' | 'Industrial Zone' | 'Urban Traffic' | 'Residential' | 'Eco Sensitive';
  operatingAgency: string;
  lastUpdated: string;
  source: 'waqi-live' | 'cpcb-cams' | 'tnpcb-realtime';
}

export interface WaqiTokenVerificationResult {
  valid: boolean;
  message: string;
  token?: string;
  stationCount?: number;
  sampleStation?: {
    name: string;
    aqi: number;
    city: string;
    time: string;
  };
}
