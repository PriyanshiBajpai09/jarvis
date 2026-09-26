"use strict";
// hooks/useKeyboardAnimation.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.useKeyboardAnimation = useKeyboardAnimation;
var react_1 = require("react");
var react_native_1 = require("react-native");
function useKeyboardAnimation(options) {
    if (options === void 0) { options = {}; }
    var animatedHeight = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    var optionsRef = (0, react_1.useRef)(options);
    // Keep latest callbacks without recreating listeners.
    (0, react_1.useEffect)(function () {
        optionsRef.current = options;
    }, [options]);
    (0, react_1.useEffect)(function () {
        var showEvent = react_native_1.Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        var hideEvent = react_native_1.Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
        var handleShow = function (event) {
            var _a, _b, _c, _d, _e;
            var keyboardHeight = (_b = (_a = event.endCoordinates) === null || _a === void 0 ? void 0 : _a.height) !== null && _b !== void 0 ? _b : 0;
            var duration = react_native_1.Platform.OS === "ios" ? (_c = event.duration) !== null && _c !== void 0 ? _c : 250 : 220;
            react_native_1.Animated.timing(animatedHeight, {
                toValue: keyboardHeight,
                duration: duration,
                useNativeDriver: false,
            }).start();
            (_e = (_d = optionsRef.current).onShow) === null || _e === void 0 ? void 0 : _e.call(_d, keyboardHeight);
        };
        var handleHide = function (event) {
            var _a, _b, _c;
            var duration = react_native_1.Platform.OS === "ios" ? (_a = event.duration) !== null && _a !== void 0 ? _a : 250 : 200;
            react_native_1.Animated.timing(animatedHeight, {
                toValue: 0,
                duration: duration,
                useNativeDriver: false,
            }).start();
            (_c = (_b = optionsRef.current).onHide) === null || _c === void 0 ? void 0 : _c.call(_b);
        };
        var showSub = react_native_1.Keyboard.addListener(showEvent, handleShow);
        var hideSub = react_native_1.Keyboard.addListener(hideEvent, handleHide);
        return function () {
            animatedHeight.stopAnimation();
            showSub.remove();
            hideSub.remove();
        };
    }, [animatedHeight]);
    return animatedHeight;
}
