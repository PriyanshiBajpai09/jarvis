"use strict";
// liveInfoService.ts
// Open-Meteo weather (no API key) + Groq fallback for news/facts.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWeatherAnswer = getWeatherAnswer;
exports.getNewsAnswer = getNewsAnswer;
exports.getFactAnswer = getFactAnswer;
exports.isLiveInfoConfigured = isLiveInfoConfigured;
var GEO_ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search';
var WEATHER_ENDPOINT = 'https://api.open-meteo.com/v1/forecast';
var REQUEST_TIMEOUT_MS = 10000;
var WEATHER_CODES = {
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
function fetchJson(url) {
    return __awaiter(this, void 0, void 0, function () {
        var controller, timeoutId, response, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    controller = new AbortController();
                    timeoutId = setTimeout(function () { return controller.abort(); }, REQUEST_TIMEOUT_MS);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch(url, { signal: controller.signal })];
                case 2:
                    response = _b.sent();
                    clearTimeout(timeoutId);
                    if (!response.ok)
                        return [2 /*return*/, null];
                    return [4 /*yield*/, response.json()];
                case 3: return [2 /*return*/, (_b.sent())];
                case 4:
                    _a = _b.sent();
                    clearTimeout(timeoutId);
                    return [2 /*return*/, null];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function getCoordinates(city) {
    return __awaiter(this, void 0, void 0, function () {
        var url, data;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    url = "".concat(GEO_ENDPOINT, "?name=").concat(encodeURIComponent(city)) +
                        '&count=1&language=en&format=json';
                    return [4 /*yield*/, fetchJson(url)];
                case 1:
                    data = _b.sent();
                    if (!((_a = data === null || data === void 0 ? void 0 : data.results) === null || _a === void 0 ? void 0 : _a.length))
                        return [2 /*return*/, null];
                    return [2 /*return*/, data.results[0]];
            }
        });
    });
}
function getWeatherAnswer(location, whenPhrase) {
    return __awaiter(this, void 0, void 0, function () {
        var place, url, weather, max, min, current, condition;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, getCoordinates(location)];
                case 1:
                    place = _d.sent();
                    if (!place) {
                        return [2 /*return*/, "I couldn't lock onto that location. Try another city name."];
                    }
                    url = "".concat(WEATHER_ENDPOINT, "?latitude=").concat(place.latitude) +
                        "&longitude=".concat(place.longitude) +
                        '&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m' +
                        '&daily=temperature_2m_max,temperature_2m_min' +
                        '&timezone=auto';
                    return [4 /*yield*/, fetchJson(url)];
                case 2:
                    weather = _d.sent();
                    if (!weather)
                        return [2 /*return*/, null];
                    if ((whenPhrase === null || whenPhrase === void 0 ? void 0 : whenPhrase.toLowerCase().includes('tomorrow')) &&
                        ((_a = weather.daily) === null || _a === void 0 ? void 0 : _a.temperature_2m_max) &&
                        ((_b = weather.daily) === null || _b === void 0 ? void 0 : _b.temperature_2m_min)) {
                        max = Math.round(weather.daily.temperature_2m_max[1]);
                        min = Math.round(weather.daily.temperature_2m_min[1]);
                        return [2 /*return*/, "".concat(place.name, " tomorrow should range between ").concat(min, "\u00B0C and ").concat(max, "\u00B0C.")];
                    }
                    current = weather.current;
                    if (!current)
                        return [2 /*return*/, null];
                    condition = (_c = WEATHER_CODES[current.weather_code]) !== null && _c !== void 0 ? _c : 'changing conditions';
                    return [2 /*return*/, "".concat(place.name, " is sitting at ").concat(Math.round(current.temperature_2m), "\u00B0C with ").concat(condition, ". It feels like ").concat(Math.round(current.apparent_temperature), "\u00B0C, and winds are moving at ").concat(Math.round(current.wind_speed_10m), " km/h.")];
            }
        });
    });
}
// Weather is now handled by Open-Meteo.
// Returning null keeps jarvisRouter's existing Groq fallback intact.
function getNewsAnswer(_topic) {
    return Promise.resolve(null);
}
function getFactAnswer(_query) {
    return Promise.resolve(null);
}
/** v0.9.0 — Developer Mode diagnostics, read-only. Reports whether a Tavily key is present, without making a network call. */
function isLiveInfoConfigured() {
    var key = process.env.EXPO_PUBLIC_TAVILY_API_KEY;
    return !!(key === null || key === void 0 ? void 0 : key.trim());
}
