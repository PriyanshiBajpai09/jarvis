"use strict";
// useThinkingPhrase.ts — Part G: sequential progression instead of
// endless randomization. Steps through Processing -> Analyzing ->
// Routing -> Response Ready once, then holds on the final phrase until
// `active` becomes false (the reply has arrived and streaming begins).
Object.defineProperty(exports, "__esModule", { value: true });
exports.useThinkingPhrase = useThinkingPhrase;
var react_1 = require("react");
var PROGRESSION = ['Processing...', 'Analyzing...', 'Routing...', 'Response Ready'];
var STEP_INTERVAL_MS = 650;
function useThinkingPhrase(active) {
    var _a = (0, react_1.useState)(0), stepIndex = _a[0], setStepIndex = _a[1];
    (0, react_1.useEffect)(function () {
        if (!active) {
            setStepIndex(0);
            return undefined;
        }
        setStepIndex(0);
        var interval = setInterval(function () {
            setStepIndex(function (prev) { return Math.min(prev + 1, PROGRESSION.length - 1); });
        }, STEP_INTERVAL_MS);
        return function () { return clearInterval(interval); };
    }, [active]);
    return PROGRESSION[stepIndex];
}
