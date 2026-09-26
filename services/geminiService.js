"use strict";
// geminiService.ts
// DEPRECATED shim — the real implementation now lives in
// services/providers/gemini.ts, and the provider-agnostic entry point
// is services/aiService.ts. This file only re-exports so nothing that
// still imports the old path breaks. New code should import from
// '../services/aiService' instead.
Object.defineProperty(exports, "__esModule", { value: true });
exports.askJarvis = exports.GeminiServiceError = exports.AIServiceError = void 0;
var aiTypes_1 = require("./aiTypes");
Object.defineProperty(exports, "AIServiceError", { enumerable: true, get: function () { return aiTypes_1.AIServiceError; } });
Object.defineProperty(exports, "GeminiServiceError", { enumerable: true, get: function () { return aiTypes_1.AIServiceError; } });
var gemini_1 = require("./providers/gemini");
Object.defineProperty(exports, "askJarvis", { enumerable: true, get: function () { return gemini_1.askGemini; } });
