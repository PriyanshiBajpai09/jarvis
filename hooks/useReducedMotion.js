"use strict";
// useReducedMotion.ts
// Mirrors the web app's `prefers-reduced-motion` handling using React
// Native's AccessibilityInfo API. Components should check this before
// starting looping Animated sequences.
Object.defineProperty(exports, "__esModule", { value: true });
exports.useReducedMotion = useReducedMotion;
var react_1 = require("react");
var react_native_1 = require("react-native");
function useReducedMotion() {
    var _a = (0, react_1.useState)(false), reduced = _a[0], setReduced = _a[1];
    (0, react_1.useEffect)(function () {
        var _a, _b;
        var mounted = true;
        (_a = react_native_1.AccessibilityInfo.isReduceMotionEnabled) === null || _a === void 0 ? void 0 : _a.call(react_native_1.AccessibilityInfo).then(function (enabled) {
            if (mounted)
                setReduced(!!enabled);
        }).catch(function () {
            /* API not available on this platform/version — default to motion on */
        });
        var subscription = (_b = react_native_1.AccessibilityInfo.addEventListener) === null || _b === void 0 ? void 0 : _b.call(react_native_1.AccessibilityInfo, 'reduceMotionChanged', function (enabled) {
            setReduced(enabled);
        });
        return function () {
            var _a;
            mounted = false;
            (_a = subscription === null || subscription === void 0 ? void 0 : subscription.remove) === null || _a === void 0 ? void 0 : _a.call(subscription);
        };
    }, []);
    return reduced;
}
exports.default = useReducedMotion;
