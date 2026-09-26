"use strict";
// useDevModeUnlock.ts — v0.9.0. Two unlock paths, both producing the
// same result: openDevMode(), which flips visibility and plays the
// voice confirmation via the EXISTING speak() function (unmodified).
//   - Web/dev: Ctrl+Shift+D, attached to window only when
//     Platform.OS === 'web'.
//   - Universal (works today on web, ready for native once a future
//     dev-build phase adds real touch handling): five taps on the Arc
//     Reactor within a 2-second rolling window.
// Escape always closes, matching the panel's required close methods.
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDevModeUnlock = useDevModeUnlock;
var react_1 = require("react");
var react_native_1 = require("react-native");
var webVoiceService_1 = require("../services/webVoiceService");
var TAP_COUNT_REQUIRED = 5;
var TAP_WINDOW_MS = 2000;
function useDevModeUnlock() {
    var _a = (0, react_1.useState)(false), isOpen = _a[0], setIsOpen = _a[1];
    var tapTimestampsRef = (0, react_1.useRef)([]);
    var openDevMode = (0, react_1.useCallback)(function () {
        setIsOpen(true);
        (0, webVoiceService_1.speak)('Admin override recognized.');
    }, []);
    var closeDevMode = (0, react_1.useCallback)(function () {
        setIsOpen(false);
    }, []);
    var registerReactorTap = (0, react_1.useCallback)(function () {
        var now = Date.now();
        var recent = tapTimestampsRef.current.filter(function (t) { return now - t < TAP_WINDOW_MS; });
        recent.push(now);
        tapTimestampsRef.current = recent;
        if (recent.length >= TAP_COUNT_REQUIRED) {
            tapTimestampsRef.current = [];
            openDevMode();
        }
    }, [openDevMode]);
    (0, react_1.useEffect)(function () {
        if (react_native_1.Platform.OS !== 'web')
            return undefined;
        function handleKeyDown(event) {
            if (event.ctrlKey && event.shiftKey && (event.key === 'D' || event.key === 'd')) {
                event.preventDefault();
                openDevMode();
            }
            if (event.key === 'Escape') {
                closeDevMode();
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return function () { return window.removeEventListener('keydown', handleKeyDown); };
    }, [openDevMode, closeDevMode]);
    return { isOpen: isOpen, closeDevMode: closeDevMode, registerReactorTap: registerReactorTap };
}
