"use strict";
// aiTypes.ts — Part I: strengthened error recovery. Immersive copy
// updated to the exact requested phrasing per error category. No HTTP
// status, provider error body, or stack trace is ever surfaced.
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIServiceError = void 0;
exports.pickImmersiveMessage = pickImmersiveMessage;
var AIServiceError = /** @class */ (function (_super) {
    __extends(AIServiceError, _super);
    function AIServiceError(kind, message) {
        var _this = _super.call(this, message) || this;
        _this.kind = kind;
        _this.name = 'AIServiceError';
        return _this;
    }
    return AIServiceError;
}(Error));
exports.AIServiceError = AIServiceError;
var IMMERSIVE_MESSAGES = {
    timeout: ['Response delayed.', 'Signal delay detected. Recalibrating...'],
    http: ['Signal disrupted.', 'Relay disruption detected. Attempting to stabilize.'],
    network: ['Signal disrupted.', 'Connection interrupted. Retrying...'],
    empty: ['Transmission incomplete.', 'No response received. Signal may be degraded.'],
    quota: ['Core processors are occupied.', 'Priority channel congested. Standing by.'],
};
function pickImmersiveMessage(kind) {
    var options = IMMERSIVE_MESSAGES[kind];
    return options[Math.floor(Math.random() * options.length)];
}
