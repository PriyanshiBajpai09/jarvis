"use strict";
// CommandDock.tsx — v0.7.0: Smart Command Dock. Pure presentational
// component — it owns no chat/router/memory logic itself. All four
// actions are callbacks supplied by ConversationPanel, which is the
// only place that actually touches sendText/router/memory. Visual
// language matches the existing app: glass panel, cyan glow, rounded
// cards, the same press-animation pattern already used by
// MicButtonPlaceholder (Animated.spring scale on press).
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_native_1 = require("react-native");
var theme_1 = require("../theme/theme");
var GlassPanel_1 = require("./GlassPanel");
var useReducedMotion_1 = require("../hooks/useReducedMotion");
function DockButton(_a) {
    var label = _a.label, glyph = _a.glyph, accessibilityLabel = _a.accessibilityLabel, onPress = _a.onPress, active = _a.active;
    var reducedMotion = (0, useReducedMotion_1.useReducedMotion)();
    var scale = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(1); }, []);
    function handlePressIn() {
        if (reducedMotion)
            return;
        react_native_1.Animated.spring(scale, { toValue: 0.94, useNativeDriver: true }).start();
    }
    function handlePressOut() {
        if (reducedMotion)
            return;
        react_native_1.Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
    }
    return (<react_native_1.Animated.View style={[styles.buttonWrap, { transform: [{ scale: scale }] }]}>
      <react_native_1.Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} style={[styles.button, active ? styles.buttonActive : null]} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
        <react_native_1.Text style={styles.glyph}>{glyph}</react_native_1.Text>
        <react_native_1.Text style={styles.label}>{label}</react_native_1.Text>
      </react_native_1.Pressable>
    </react_native_1.Animated.View>);
}
function CommandDock(_a) {
    var onWeather = _a.onWeather, onFocus = _a.onFocus, onRecap = _a.onRecap, onRemember = _a.onRemember;
    var _b = (0, react_1.useState)(false), rememberOpen = _b[0], setRememberOpen = _b[1];
    var _c = (0, react_1.useState)(''), rememberDraft = _c[0], setRememberDraft = _c[1];
    function handleRememberPress() {
        setRememberOpen(function (prev) { return !prev; });
    }
    function handleRememberSubmit() {
        var clean = rememberDraft.trim();
        if (!clean) {
            setRememberOpen(false);
            return;
        }
        onRemember(clean);
        setRememberDraft('');
        setRememberOpen(false);
    }
    return (<GlassPanel_1.default style={styles.panel}>
      <react_native_1.View style={styles.row}>
        <DockButton label="Weather" glyph="☁" accessibilityLabel="Ask JARVIS for the weather" onPress={onWeather}/>
        <DockButton label="Focus" glyph="◉" accessibilityLabel="Start a study focus session" onPress={onFocus}/>
        <DockButton label="Recap" glyph="↺" accessibilityLabel="Ask JARVIS to recap the conversation" onPress={onRecap}/>
        <DockButton label="Remember" glyph="✎" accessibilityLabel="Add a quick note for JARVIS to remember" onPress={handleRememberPress} active={rememberOpen}/>
      </react_native_1.View>

      {rememberOpen && (<react_native_1.View style={styles.rememberRow}>
          <react_native_1.TextInput style={styles.rememberInput} placeholder="Interview Friday..." placeholderTextColor={theme_1.colors.textDim} value={rememberDraft} onChangeText={setRememberDraft} onSubmitEditing={handleRememberSubmit} returnKeyType="done" autoFocus maxLength={200}/>
          <react_native_1.TouchableOpacity style={styles.rememberConfirm} onPress={handleRememberSubmit} disabled={!rememberDraft.trim()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Save note">
            <react_native_1.Text style={styles.rememberConfirmGlyph}>✓</react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>)}
    </GlassPanel_1.default>);
}
var styles = react_native_1.StyleSheet.create({
    panel: { gap: 10, marginBottom: 4 },
    row: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    buttonWrap: { flexGrow: 1, flexBasis: '22%', minWidth: 68 },
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 10,
        paddingHorizontal: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(0,234,255,0.22)',
        backgroundColor: 'rgba(0,234,255,0.05)',
        shadowColor: theme_1.colors.cyan,
        shadowOpacity: 0.25,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 0 },
    },
    buttonActive: {
        borderColor: theme_1.colors.glassBorderStrong,
        backgroundColor: 'rgba(0,234,255,0.1)',
        shadowOpacity: 0.45,
    },
    glyph: {
        fontSize: 16,
        color: theme_1.colors.cyanSoft,
    },
    label: {
        fontFamily: theme_1.fonts.body,
        fontSize: 9.5,
        letterSpacing: 0.6,
        color: theme_1.colors.textDim,
        textTransform: 'uppercase',
    },
    rememberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    rememberInput: {
        flex: 1,
        height: 40,
        backgroundColor: 'rgba(0,234,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(0,234,255,0.28)',
        borderRadius: 4,
        paddingHorizontal: 12,
        fontFamily: theme_1.fonts.body,
        fontSize: 13,
        color: theme_1.colors.textPrimary,
    },
    rememberConfirm: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme_1.colors.glassBorder,
        backgroundColor: 'rgba(0,234,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    rememberConfirmGlyph: {
        color: theme_1.colors.cyanSoft,
        fontSize: 15,
    },
});
exports.default = CommandDock;
