const GEO_ENDPOINT = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_ENDPOINT = "https://api.open-meteo.com/v1/forecast";
const REQUEST_TIMEOUT_MS = 10000;

const WEATHER_CODES: Record<number, string> = {
  0: "clear skies",
  1: "mainly clear skies",
  2: "partly cloudy skies",
  3: "overcast skies",
  45: "fog",
  48: "depositing rime fog",
  51: "light drizzle",
  53: "moderate drizzle",
  55: "dense drizzle",
  61: "light rain",
  63: "moderate rain",
  65: "heavy rain",
  71: "light snowfall",
  73: "moderate snowfall",
  75: "heavy snowfall",
  80: "light rain showers",
  81: "moderate rain showers",
  82: "violent rain showers",
  95: "thunderstorms",
};

async function fetchJson(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) return null;

    return await res.json();
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

async function getCoordinates(city: string) {
  const data = await fetchJson(
    `${GEO_ENDPOINT}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
  );

  return data?.results?.[0] ?? null;
}

export async function getWeatherAnswer(
  location: string,
  whenPhrase?: string
): Promise<string | null> {
  const place = await getCoordinates(location);

  if (!place) {
    return "I couldn't lock onto that location.";
  }

  const weather = await fetchJson(
    `${WEATHER_ENDPOINT}?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=auto`
  );

  if (!weather) return null;

  if (
    whenPhrase?.toLowerCase().includes("tomorrow") &&
    weather.daily
  ) {
    return `${place.name} tomorrow should range between ${Math.round(weather.daily.temperature_2m_min[1])}°C and ${Math.round(weather.daily.temperature_2m_max[1])}°C.`;
  }

  return `${place.name} is ${Math.round(weather.current.temperature_2m)}°C with ${WEATHER_CODES[weather.current.weather_code] ?? "changing conditions"}.`;
}

export async function getNewsAnswer(): Promise<string | null> {
  return null;
}

export async function getFactAnswer(): Promise<string | null> {
  return null;
}

export function isLiveInfoConfigured(): boolean {
  const key = import.meta.env.VITE_TAVILY_API_KEY;
  return Boolean(key?.trim());
}