"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = App;
var react_1 = require("react");
var expo_status_bar_1 = require("expo-status-bar");
var react_native_1 = require("react-native");
var react_native_safe_area_context_1 = require("react-native-safe-area-context");
var orbitron_1 = require("@expo-google-fonts/orbitron");
var rajdhani_1 = require("@expo-google-fonts/rajdhani");
var BootSequenceMobile_1 = require("./components/BootSequenceMobile");
var HomeScreen_1 = require("./screens/HomeScreen");
var theme_1 = require("./theme/theme");
function App() {
    var fontsLoaded = (0, orbitron_1.useFonts)({
        Orbitron_700Bold: orbitron_1.Orbitron_700Bold,
        Orbitron_800ExtraBold: orbitron_1.Orbitron_800ExtraBold,
        Rajdhani_500Medium: rajdhani_1.Rajdhani_500Medium,
        Rajdhani_600SemiBold: rajdhani_1.Rajdhani_600SemiBold,
    })[0];
    var _a = (0, react_1.useState)(false), bootComplete = _a[0], setBootComplete = _a[1];
    var handleBootComplete = (0, react_1.useCallback)(function () {
        setBootComplete(true);
    }, []);
    if (!fontsLoaded) {
        return (<react_native_safe_area_context_1.SafeAreaProvider>
        <react_native_1.View style={styles.blank}/>
      </react_native_safe_area_context_1.SafeAreaProvider>);
    }
    return (<react_native_safe_area_context_1.SafeAreaProvider>
      <react_native_1.View style={styles.root}>
        <expo_status_bar_1.StatusBar style="light"/>

        {bootComplete ? (<HomeScreen_1.default />) : (<BootSequenceMobile_1.default onComplete={handleBootComplete}/>)}
      </react_native_1.View>
    </react_native_safe_area_context_1.SafeAreaProvider>);
}
var styles = react_native_1.StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: theme_1.colors.bgBlack,
    },
    blank: {
        flex: 1,
        backgroundColor: theme_1.colors.bgBlack,
    },
});
