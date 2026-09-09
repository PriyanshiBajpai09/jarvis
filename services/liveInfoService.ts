// liveInfoService.ts
// Open-Meteo weather (no API key) + Groq fallback for news/facts.

const GEO_ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_ENDPOINT = 'https://api.open-meteo.com/v1/forecast';
const REQUEST_TIMEOUT_MS = 10000;

interface GeoResult {
  latitude: number;
  longitude: number;
  name: string;
}

interface GeoResponse {
  results?: GeoResult[];
}

interface CurrentWeather {
  temperature_2m: number;
  apparent_temperature: number;
  weather_code: number;
  wind_speed_10m: number;
}

interface DailyWeather {
  temperature_2m_max: number[];
  temperature_2m_min: number[];
}

interface WeatherResponse {
  current?: CurrentWeather;
  daily?: DailyWeather;
}

const WEATHER_CODES: Record<number, string> = {
  0: 'clear skies',
  1: 'mainly clear skies',
  2: 'partly cloudy skies',
  3: 'overcast skies',
  45: 'fog',
  48: 'depositing rime fog',
  51: 'light drizzle',
  53: 'moderate drizzle',
  55: 'dense drizzle',
  56: 'light freezing drizzle',
  57: 'dense freezing drizzle',
  61: 'light rain',
  63: 'moderate rain',
  65: 'heavy rain',
  66: 'light freezing rain',
  67: 'heavy freezing rain',
  71: 'light snowfall',
  73: 'moderate snowfall',
  75: 'heavy snowfall',
  77: 'snow grains',
  80: 'light rain showers',
  81: 'moderate rain showers',
  82: 'violent rain showers',
  85: 'light snow showers',
  86: 'heavy snow showers',
  95: 'thunderstorms',
  96: 'thunderstorms with hail',
  99: 'severe thunderstorms with hail',
};

async function fetchJson<T>(url: string): Promise<T | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) return null;

    return (await response.json()) as T;
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

async function getCoordinates(city: string): Promise<GeoResult | null> {
  const url =
    `${GEO_ENDPOINT}?name=${encodeURIComponent(city)}` +
    '&count=1&language=en&format=json';

  const data = await fetchJson<GeoResponse>(url);

  if (!data?.results?.length) return null;

  return data.results[0];
}

export async function getWeatherAnswer(
  location: string,
  whenPhrase?: string
): Promise<string | null> {
  const place = await getCoordinates(location);

  if (!place) {
    return "I couldn't lock onto that location. Try another city name.";
  }

  const url =
    `${WEATHER_ENDPOINT}?latitude=${place.latitude}` +
    `&longitude=${place.longitude}` +
    '&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m' +
    '&daily=temperature_2m_max,temperature_2m_min' +
    '&timezone=auto';

  const weather = await fetchJson<WeatherResponse>(url);

  if (!weather) return null;

  if (
    whenPhrase?.toLowerCase().includes('tomorrow') &&
    weather.daily?.temperature_2m_max &&
    weather.daily?.temperature_2m_min
  ) {
    const max = Math.round(weather.daily.temperature_2m_max[1]);
    const min = Math.round(weather.daily.temperature_2m_min[1]);

    return `${place.name} tomorrow should range between ${min}°C and ${max}°C.`;
  }

  const current = weather.current;

  if (!current) return null;

  const condition =
    WEATHER_CODES[current.weather_code] ?? 'changing conditions';

  return `${place.name} is sitting at ${Math.round(
    current.temperature_2m
  )}°C with ${condition}. It feels like ${Math.round(
    current.apparent_temperature
  )}°C, and winds are moving at ${Math.round(
    current.wind_speed_10m
  )} km/h.`;
}

// Weather is now handled by Open-Meteo.
// Returning null keeps jarvisRouter's existing Groq fallback intact.

export function getNewsAnswer(
  _topic?: string
): Promise<string | null> {
  return Promise.resolve(null);
}

export function getFactAnswer(
  _query: string
): Promise<string | null> {
  return Promise.resolve(null);
}