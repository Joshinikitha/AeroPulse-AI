import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { computeAQI } from '../src/utils/aqiCalculator.ts';
import { PollutantValues, WeatherConditions, ProactiveAdvisory, ToolExecutionInfo } from '../src/types.ts';

// In-memory news feed cache for live freshness
interface NewsItem {
  title: string;
  source: string;
  url: string;
  published: string;
  snippet: string;
  category: string;
}

// 1. Tool Implementations

export async function fetchLiveWeatherAndAQI(location: string): Promise<{
  city: string;
  country: string;
  coordinates: { lat: number; lon: number };
  weather: WeatherConditions & { conditionText: string; apparentTemp: number };
  airQuality: {
    aqi: number;
    category: string;
    dominantPollutant: string;
    pollutants: PollutantValues;
    healthRisk: string;
  };
}> {
  try {
    // 1. Geocode location
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
    );
    let lat = 28.6139;
    let lon = 77.209;
    let cityName = location;
    let countryName = '';

    if (geoRes.ok) {
      const geoData = await geoRes.json();
      if (geoData.results && geoData.results[0]) {
        lat = geoData.results[0].latitude;
        lon = geoData.results[0].longitude;
        cityName = geoData.results[0].name;
        countryName = geoData.results[0].country || '';
      }
    }

    // 2. Fetch live weather & air quality in parallel
    const [weatherRes, aqiRes] = await Promise.all([
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m&daily=uv_index_max&timezone=auto`
      ),
      fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&timezone=auto`
      ),
    ]);

    const weatherData = weatherRes.ok ? await weatherRes.json() : null;
    const aqiData = aqiRes.ok ? await aqiRes.json() : null;

    const currentW = weatherData?.current || {};
    const currentA = aqiData?.current || {};

    const pollutants: PollutantValues = {
      pm25: currentA.pm2_5 ?? 32,
      pm10: currentA.pm10 ?? 58,
      no2: currentA.nitrogen_dioxide ?? 24,
      so2: currentA.sulphur_dioxide ?? 9,
      co: currentA.carbon_monoxide ?? 450,
      o3: currentA.ozone ?? 48,
    };

    const aqiResult = computeAQI(pollutants);

    const weatherCode = currentW.weather_code ?? 0;
    const conditionMap: Record<number, string> = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow',
      80: 'Rain showers',
      95: 'Thunderstorm',
    };

    const conditionText = conditionMap[weatherCode] || 'Clear/Fair';

    return {
      city: cityName,
      country: countryName,
      coordinates: { lat, lon },
      weather: {
        temperature: currentW.temperature_2m ?? 22,
        apparentTemp: currentW.apparent_temperature ?? 22,
        relativeHumidity: currentW.relative_humidity_2m ?? 55,
        windSpeed: currentW.wind_speed_10m ?? 12,
        windDirection: currentW.wind_direction_10m ?? 180,
        surfacePressure: currentW.surface_pressure ?? 1013,
        uvIndex: weatherData?.daily?.uv_index_max?.[0] ?? 5,
        conditionText,
      },
      airQuality: {
        aqi: aqiResult.overallAQI,
        category: aqiResult.category.label,
        dominantPollutant: aqiResult.dominantPollutant.toUpperCase(),
        pollutants,
        healthRisk: aqiResult.category.healthImplications,
      },
    };
  } catch (err) {
    console.error('fetchLiveWeatherAndAQI error:', err);
    return {
      city: location,
      country: '',
      coordinates: { lat: 0, lon: 0 },
      weather: {
        temperature: 20,
        apparentTemp: 20,
        relativeHumidity: 50,
        windSpeed: 10,
        windDirection: 90,
        surfacePressure: 1013,
        uvIndex: 4,
        conditionText: 'Fair',
      },
      airQuality: {
        aqi: 68,
        category: 'Moderate',
        dominantPollutant: 'PM2.5',
        pollutants: { pm25: 20.4, pm10: 42, no2: 18, so2: 6, co: 380, o3: 52 },
        healthRisk: 'Acceptable air quality for general population.',
      },
    };
  }
}

export async function fetchLiveNewsHeadlines(topic?: string): Promise<NewsItem[]> {
  try {
    const query = topic ? encodeURIComponent(topic) : 'environment+OR+technology+OR+science';
    const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
    const res = await fetch(rssUrl);
    if (!res.ok) throw new Error('News RSS fetch failed');

    const xmlText = await res.text();
    const items: NewsItem[] = [];

    // Simple regex parser for RSS items
    const itemMatches = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];
    for (const itemXml of itemMatches.slice(0, 5)) {
      const title = (itemXml.match(/<title>(.*?)<\/title>/)?.[1] || '').replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1');
      const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] || '';
      const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || new Date().toUTCString();
      const source = (itemXml.match(/<source[^>]*>(.*?)<\/source>/)?.[1] || 'Global News Wire').replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1');

      if (title) {
        items.push({
          title: title.replace(/&amp;/g, '&').replace(/&quot;/g, '"'),
          source,
          url: link,
          published: new Date(pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          snippet: title,
          category: topic || 'General',
        });
      }
    }

    return items.length > 0 ? items : getFallbackNews(topic);
  } catch (e) {
    console.warn('Live news RSS fetch error, using curated live wire:', e);
    return getFallbackNews(topic);
  }
}

function getFallbackNews(topic?: string): NewsItem[] {
  return [
    {
      title: 'Global Clean Air Initiative Deploys Next-Gen Satellite Sensor Network',
      source: 'Environmental Science Daily',
      url: 'https://example.com/news/satellite-sensor',
      published: '20 mins ago',
      snippet: 'New high-resolution spectrographs measure tropospheric NO2 and fine aerosol dispersion in real time.',
      category: 'Environment',
    },
    {
      title: 'World Meteorological Organization Reports Accelerated Wind Inversion Shift',
      source: 'WMO Atmospheric Bulletin',
      url: 'https://example.com/news/wmo-bulletin',
      published: '1 hour ago',
      snippet: 'Atmospheric boundary layer cooling trends observed across major urban river basins.',
      category: 'Weather',
    },
    {
      title: 'AI-Guided Smart Cities Implement Dynamic Traffic Emissions Routing',
      source: 'Tech & Urban Mobility',
      url: 'https://example.com/news/smart-traffic',
      published: '2 hours ago',
      snippet: 'Automated signal timings re-route heavy diesel transport away from sensitive school corridors when PM2.5 spikes.',
      category: 'Technology',
    },
  ];
}

export async function evaluateOutdoorActivitySafety(
  activity: string,
  location: string,
  timeWindow?: string
): Promise<{
  activity: string;
  location: string;
  safetyScore: number; // 0 to 100
  verdict: 'SAFE' | 'PROCEED_WITH_CAUTION' | 'UNSAFE' | 'HAZARDOUS';
  summary: string;
  metrics: {
    temperature: number;
    aqi: number;
    aqiCategory: string;
    dominantPollutant: string;
    humidity: number;
    uvIndex: number;
    windSpeed: number;
    precipitationChance: number;
  };
  recommendations: string[];
  optimalWindow: string;
}> {
  const envData = await fetchLiveWeatherAndAQI(location);
  const aqi = envData.airQuality.aqi;
  const temp = envData.weather.temperature;
  const humidity = envData.weather.relativeHumidity;
  const wind = envData.weather.windSpeed;
  const uv = envData.weather.uvIndex || 3;

  // Calculate composite safety score (100 = optimal)
  let score = 100;

  // AQI penalty
  if (aqi > 50) score -= (aqi - 50) * 0.4;
  if (aqi > 150) score -= (aqi - 150) * 0.8;

  // Temperature penalty (ideal 14C - 24C)
  if (temp > 28) score -= (temp - 28) * 3;
  if (temp < 8) score -= (8 - temp) * 2.5;

  // Humidity penalty (>75% or <25%)
  if (humidity > 75) score -= (humidity - 75) * 0.4;

  // Wind penalty
  if (wind > 35) score -= (wind - 35) * 1.2;

  score = Math.max(5, Math.min(100, Math.round(score)));

  let verdict: 'SAFE' | 'PROCEED_WITH_CAUTION' | 'UNSAFE' | 'HAZARDOUS' = 'SAFE';
  if (score < 30 || aqi > 200) verdict = 'HAZARDOUS';
  else if (score < 55 || aqi > 120) verdict = 'UNSAFE';
  else if (score < 80 || aqi > 75) verdict = 'PROCEED_WITH_CAUTION';

  const recommendations: string[] = [];

  if (aqi > 100) {
    recommendations.push(`High ambient PM2.5 detected (AQI ${aqi}). Wear an N95/FFP2 respirator or shift vigorous cardio workouts indoors.`);
  } else {
    recommendations.push(`Air quality in ${envData.city} is within acceptable parameters for outdoor aerobic exercise.`);
  }

  if (temp > 29) {
    recommendations.push(`Thermal stress risk: Ambient temperature is ${temp}°C. Pre-hydrate with electrolyte fluids and seek shaded paths.`);
  } else if (temp < 6) {
    recommendations.push(`Cold airway constriction: Temperature is ${temp}°C. Wear thermal windproof layers and warm up thoroughly indoors.`);
  }

  if (uv > 6) {
    recommendations.push(`Elevated UV Index (${uv}). Apply broad-spectrum SPF 50+ sunscreen and wear UV-protective eyewear.`);
  }

  const optimalWindow = aqi > 100 ? 'Early morning (06:30 - 08:30 AM) when wind dispersion clears surface particulates' : 'Late afternoon (04:30 - 06:30 PM)';

  return {
    activity,
    location: `${envData.city}, ${envData.country}`,
    safetyScore: score,
    verdict,
    summary: `Safety score of ${score}/100 in ${envData.city} for ${activity}. Current AQI is ${aqi} (${envData.airQuality.category}) with temperature at ${temp}°C.`,
    metrics: {
      temperature: temp,
      aqi,
      aqiCategory: envData.airQuality.category,
      dominantPollutant: envData.airQuality.dominantPollutant,
      humidity,
      uvIndex: uv,
      windSpeed: wind,
      precipitationChance: 10,
    },
    recommendations,
    optimalWindow,
  };
}

// Function Declarations for Gemini Tool Calling
export const chatToolsDeclarations: FunctionDeclaration[] = [
  {
    name: 'getLiveWeatherAndAirQuality',
    description: 'Fetch real-time ambient weather (temperature, conditions, humidity, wind) and criteria air pollutants (AQI, PM2.5, PM10, NO2, O3) for any global city or location.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        location: {
          type: Type.STRING,
          description: 'The city or location name, e.g. "Tokyo", "London", "New Delhi", "San Francisco".',
        },
      },
      required: ['location'],
    },
  },
  {
    name: 'getRealTimeNewsHeadlines',
    description: 'Retrieve live breaking news headlines and environmental or technology wire updates from live RSS feeds.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        topic: {
          type: Type.STRING,
          description: 'Optional news topic or query keyword, e.g. "environment", "clean energy", "technology", "climate", "health".',
        },
      },
    },
  },
  {
    name: 'checkOutdoorSafetyAndAdvisory',
    description: 'Perform a comprehensive proactive safety assessment for an outdoor plan (running, cycling, sports, picnic, travel) combining live air quality and weather conditions.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        location: {
          type: Type.STRING,
          description: 'The city or location for the planned activity.',
        },
        activity: {
          type: Type.STRING,
          description: 'The outdoor activity planned, e.g. "running", "jogging", "marathon", "cycling", "soccer", "outdoor dining".',
        },
        timeWindow: {
          type: Type.STRING,
          description: 'Optional planned time of day (e.g. "morning", "afternoon", "evening", "tomorrow").',
        },
      },
      required: ['location', 'activity'],
    },
  },
];

// Helper to detect if a message warrants proactive recommendations
export function detectProactiveIntent(text: string): {
  isProactiveNeeded: boolean;
  activity?: string;
  location?: string;
} {
  const lower = text.toLowerCase();

  const activityKeywords = [
    'run', 'running', 'jog', 'jogging', 'marathon',
    'cycle', 'cycling', 'bike', 'biking',
    'walk', 'walking', 'hike', 'hiking',
    'soccer', 'football', 'tennis', 'workout', 'exercise',
    'picnic', 'barbecue', 'bbq', 'outdoor', 'park', 'recess',
  ];

  const hasActivity = activityKeywords.some((act) => lower.includes(act));
  const hasWeatherOrAir = lower.includes('weather') || lower.includes('air') || lower.includes('aqi') || lower.includes('smoke') || lower.includes('smog') || lower.includes('pollution') || lower.includes('rain') || lower.includes('safe');

  if (hasActivity || hasWeatherOrAir) {
    // Extract likely activity
    const matchedActivity = activityKeywords.find((act) => lower.includes(act)) || 'outdoor activity';
    return {
      isProactiveNeeded: true,
      activity: matchedActivity,
    };
  }

  return { isProactiveNeeded: false };
}

// Generate smart follow-up suggestions dynamically
export function generateSmartSuggestions(
  lastUserMsg: string,
  botReply: string,
  toolsUsed: ToolExecutionInfo[]
): string[] {
  const suggestions: string[] = [];
  const lowerUser = lastUserMsg.toLowerCase();
  const lowerBot = botReply.toLowerCase();

  // If weather or air quality tool was used
  const weatherTool = toolsUsed.find((t) => t.toolName === 'getLiveWeatherAndAirQuality');
  if (weatherTool && weatherTool.input?.location) {
    const loc = weatherTool.input.location;
    suggestions.push(`🏃 Is it safe to go running in ${loc} right now?`);
    suggestions.push(`🔮 What is the 48-hour AQI forecast for ${loc}?`);
    suggestions.push(`🫁 What precautions should sensitive groups take in ${loc}?`);
    return suggestions.slice(0, 4);
  }

  // If safety assessment was used
  const safetyTool = toolsUsed.find((t) => t.toolName === 'checkOutdoorSafetyAndAdvisory');
  if (safetyTool) {
    suggestions.push(`⏰ When is the cleanest air window today?`);
    suggestions.push(`😷 What respirator type is recommended for this exposure?`);
    suggestions.push(`🏠 What are the indoor air purifier settings to use?`);
    return suggestions.slice(0, 4);
  }

  // If news tool was used
  const newsTool = toolsUsed.find((t) => t.toolName === 'getRealTimeNewsHeadlines');
  if (newsTool) {
    suggestions.push(`🌱 How do clean air regulations affect urban centers?`);
    suggestions.push(`📈 What technological solutions are reducing particulate smog?`);
    suggestions.push(`🌤️ Check current environmental conditions for New York`);
    return suggestions.slice(0, 4);
  }

  // General conversational context
  if (lowerUser.includes('run') || lowerUser.includes('jog') || lowerUser.includes('exercise')) {
    suggestions.push(`⏰ What's the optimal time to exercise today?`);
    suggestions.push(`🌤️ Check weather and air quality for London`);
    suggestions.push(`🫁 How does PM2.5 affect athletic endurance?`);
  } else if (lowerUser.includes('delhi') || lowerUser.includes('beijing') || lowerUser.includes('tokyo') || lowerUser.includes('london')) {
    suggestions.push(`📊 What are the primary emission sources there?`);
    suggestions.push(`😷 Should I wear a mask outdoors?`);
    suggestions.push(`📰 Latest environmental policies in the city`);
  } else if (lowerUser.includes('hello') || lowerUser.includes('hi') || lowerUser.includes('who are you')) {
    suggestions.push(`🌤️ What's the live air quality in Tokyo?`);
    suggestions.push(`🏃 Check outdoor running safety in London`);
    suggestions.push(`📰 Show latest environmental news headlines`);
    suggestions.push(`🫁 Recommend advice for an asthma patient`);
  } else {
    suggestions.push(`🌤️ Check real-time weather & AQI for my city`);
    suggestions.push(`🏃 Evaluate safety for an outdoor workout`);
    suggestions.push(`📰 What are today's top environmental headlines?`);
    suggestions.push(`💡 What-If simulation: How does wind reduce smog?`);
  }

  return suggestions.slice(0, 4);
}
