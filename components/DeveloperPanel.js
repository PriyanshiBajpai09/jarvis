"use strict";
// DeveloperPanel.tsx — v0.9.0. Slide-up diagnostics panel matching the
// existing glass/cyan design language (reuses GlassPanel). All data
// comes from read-only getters or already-existing storage/service
// functions — no new business logic, no duplicated memory/weather/
// voice mechanics. Closes via backdrop tap, close button, swipe down,
// or Escape (handled in useDevModeUnlock).
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
var react_1 = require("react");
var react_native_1 = require("react-native");
var Clipboard = require("expo-clipboard");
var theme_1 = require("../theme/theme");
var GlassPanel_1 = require("./GlassPanel");
var useReducedMotion_1 = require("../hooks/useReducedMotion");
var diagnosticsService_1 = require("../services/diagnosticsService");
var webVoiceService_1 = require("../services/webVoiceService");
var liveInfoService_1 = require("../services/liveInfoService");
var conversationStore_1 = require("../storage/conversationStore");
var sessionMemory_1 = require("../storage/sessionMemory");
function StatusRow(_a) {
    var label = _a.label, value = _a.value, tone = _a.tone;
    var color = tone === 'safe' ? theme_1.colors.safeGreen : tone === 'warn' ? theme_1.colors.warnAmber : theme_1.colors.cyanSoft;
    return (<react_native_1.View style={styles.statusRow}>
      <react_native_1.Text style={styles.statusLabel}>{label}</react_native_1.Text>
      <react_native_1.Text style={[styles.statusValue, { color: color }]}>{value}</react_native_1.Text>
    </react_native_1.View>);
}
function ActionButton(_a) {
    var label = _a.label, onPress = _a.onPress;
    return (<react_native_1.TouchableOpacity style={styles.actionButton} onPress={onPress} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={label}>
      <react_native_1.Text style={styles.actionButtonText}>{label}</react_native_1.Text>
    </react_native_1.TouchableOpacity>);
}
function SectionHeader(_a) {
    var title = _a.title;
    return <react_native_1.Text style={styles.sectionHeader}>{title}</react_native_1.Text>;
}
function DeveloperPanel(_a) {
    var _this = this;
    var _b;
    var visible = _a.visible, onClose = _a.onClose;
    var reducedMotion = (0, useReducedMotion_1.useReducedMotion)();
    var slide = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    var _c = (0, react_1.useState)(visible), mounted = _c[0], setMounted = _c[1];
    var _d = (0, react_1.useState)(null), diagnostics = _d[0], setDiagnostics = _d[1];
    var _e = (0, react_1.useState)([]), facts = _e[0], setFacts = _e[1];
    var _f = (0, react_1.useState)([]), pinnedNotes = _f[0], setPinnedNotes = _f[1];
    var _g = (0, react_1.useState)(null), actionMessage = _g[0], setActionMessage = _g[1];
    var refreshData = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, snapshot, allFacts, pins;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, Promise.all([(0, diagnosticsService_1.collectDiagnostics)(), (0, sessionMemory_1.getAllFacts)(), (0, sessionMemory_1.getPinnedNotes)()])];
                case 1:
                    _a = _b.sent(), snapshot = _a[0], allFacts = _a[1], pins = _a[2];
                    setDiagnostics(snapshot);
                    setFacts(allFacts);
                    setPinnedNotes(pins);
                    return [2 /*return*/];
            }
        });
    }); }, []);
    (0, react_1.useEffect)(function () {
        if (visible) {
            setMounted(true);
            void refreshData();
            react_native_1.Animated.timing(slide, {
                toValue: 1,
                duration: reducedMotion ? 0 : 320,
                easing: react_native_1.Easing.out(react_native_1.Easing.cubic),
                useNativeDriver: true,
            }).start();
        }
        else {
            react_native_1.Animated.timing(slide, {
                toValue: 0,
                duration: reducedMotion ? 0 : 260,
                easing: react_native_1.Easing.in(react_native_1.Easing.cubic),
                useNativeDriver: true,
            }).start(function (_a) {
                var finished = _a.finished;
                if (finished)
                    setMounted(false);
            });
        }
    }, [visible, reducedMotion, slide, refreshData]);
    var translateY = (0, react_1.useMemo)(function () { return slide.interpolate({ inputRange: [0, 1], outputRange: [420, 0] }); }, [slide]);
    var backdropOpacity = (0, react_1.useMemo)(function () { return slide.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }); }, [slide]);
    var panResponder = (0, react_1.useMemo)(function () {
        return react_native_1.PanResponder.create({
            onMoveShouldSetPanResponder: function (_evt, gesture) { return gesture.dy > 6; },
            onPanResponderMove: function (_evt, gesture) {
                if (gesture.dy > 0) {
                    slide.setValue(1 - Math.min(1, gesture.dy / 260));
                }
            },
            onPanResponderRelease: function (_evt, gesture) {
                if (gesture.dy > 90) {
                    onClose();
                }
                else {
                    react_native_1.Animated.timing(slide, { toValue: 1, duration: 180, easing: react_native_1.Easing.out(react_native_1.Easing.ease), useNativeDriver: true }).start();
                }
            },
        });
    }, [slide, onClose]);
    var showMessage = (0, react_1.useCallback)(function (text) {
        setActionMessage(text);
        setTimeout(function () { return setActionMessage(null); }, 2500);
    }, []);
    var handleTestVoice = (0, react_1.useCallback)(function () {
        (0, webVoiceService_1.speak)('This is a JARVIS voice diagnostic test, Priyanshi.');
        showMessage('Voice test triggered.');
    }, [showMessage]);
    var handleReloadVoice = (0, react_1.useCallback)(function () {
        (0, webVoiceService_1.reloadVoiceEngine)();
        showMessage('Voice engine reset. Next reply will re-select a voice.');
    }, [showMessage]);
    var handleTestWeather = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    showMessage('Testing weather uplink...');
                    return [4 /*yield*/, (0, liveInfoService_1.getWeatherAnswer)('London')];
                case 1:
                    result = _a.sent();
                    showMessage(result ? 'Weather uplink responded successfully.' : 'Weather uplink did not respond.');
                    return [2 /*return*/];
            }
        });
    }); }, [showMessage]);
    var handleExportConversation = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var stored, payload;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, conversationStore_1.loadConversation)()];
                case 1:
                    stored = _a.sent();
                    payload = JSON.stringify(stored !== null && stored !== void 0 ? stored : [], null, 2);
                    return [4 /*yield*/, Clipboard.setStringAsync(payload)];
                case 2:
                    _a.sent();
                    showMessage('Conversation copied to clipboard.');
                    return [2 /*return*/];
            }
        });
    }); }, [showMessage]);
    var handleClearConversation = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, conversationStore_1.clearConversation)()];
                case 1:
                    _a.sent();
                    showMessage('Conversation storage cleared. Restart to fully reset the view.');
                    return [2 /*return*/];
            }
        });
    }); }, [showMessage]);
    var handleClearMemory = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, sessionMemory_1.clearSessionMemory)()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, refreshData()];
                case 2:
                    _a.sent();
                    showMessage('Session memory cleared.');
                    return [2 /*return*/];
            }
        });
    }); }, [refreshData, showMessage]);
    var handleExportMemory = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var payload;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    payload = JSON.stringify({ facts: facts, pinnedNotes: pinnedNotes }, null, 2);
                    return [4 /*yield*/, Clipboard.setStringAsync(payload)];
                case 1:
                    _a.sent();
                    showMessage('Memory copied to clipboard.');
                    return [2 /*return*/];
            }
        });
    }); }, [facts, pinnedNotes, showMessage]);
    var handleDeleteFact = (0, react_1.useCallback)(function (key, timestamp) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, sessionMemory_1.deleteFact)(key, timestamp)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, refreshData()];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, [refreshData]);
    var pronunciationPreview = (0, react_1.useMemo)(function () { return (0, webVoiceService_1.previewPronunciation)('Priyanshi, DBMS, DSA'); }, []);
    if (!mounted)
        return null;
    return (<react_native_1.View style={styles.overlay} pointerEvents="box-none">
      <react_native_1.Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <react_native_1.Pressable style={react_native_1.StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close developer mode"/>
      </react_native_1.Animated.View>

      <react_native_1.Animated.View style={[styles.panelWrap, { transform: [{ translateY: translateY }] }]}>
    <GlassPanel_1.default style={styles.panelCard}>          <react_native_1.View {...panResponder.panHandlers} style={styles.dragHandleArea}>
            <react_native_1.View style={styles.dragHandle}/>
          </react_native_1.View>

          <react_native_1.View style={styles.headerRow}>
            <react_native_1.Text style={styles.title}>DEVELOPER MODE</react_native_1.Text>
            <react_native_1.TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Close developer mode" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <react_native_1.Text style={styles.closeGlyph}>✕</react_native_1.Text>
            </react_native_1.TouchableOpacity>
          </react_native_1.View>

          {actionMessage && <react_native_1.Text style={styles.actionMessage}>{actionMessage}</react_native_1.Text>}

          <react_native_1.ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <SectionHeader title="System Diagnostics"/>
            {diagnostics ? (<>
                <StatusRow label="Voice Engine" value={diagnostics.voiceEngineOnline ? 'Online' : 'Unavailable'} tone={diagnostics.voiceEngineOnline ? 'safe' : 'warn'}/>
                <StatusRow label="Memory" value={diagnostics.memoryConnected ? 'Connected' : 'Unavailable'} tone={diagnostics.memoryConnected ? 'safe' : 'warn'}/>
                <StatusRow label="Weather API" value={diagnostics.weatherApiConfigured ? 'Configured' : 'Not configured'} tone={diagnostics.weatherApiConfigured ? 'safe' : 'warn'}/>
                <StatusRow label="AI Provider" value={diagnostics.aiProvider}/>
                <StatusRow label="Last Response" value={diagnostics.lastLatencyMs !== null ? "".concat(diagnostics.lastLatencyMs, "ms") : 'No data yet'}/>
                <StatusRow label="Arc Reactor" value={diagnostics.reactorStatus} tone="safe"/>
              </>) : (<react_native_1.Text style={styles.loadingText}>Gathering diagnostics...</react_native_1.Text>)}

            <SectionHeader title="Voice Lab"/>
            <StatusRow label="Selected Voice" value={(_b = diagnostics === null || diagnostics === void 0 ? void 0 : diagnostics.selectedVoiceName) !== null && _b !== void 0 ? _b : 'Not selected yet'}/>
            <StatusRow label="Rate" value={String(diagnosticsService_1.SPEECH_RATE)}/>
            <StatusRow label="Pitch" value={String(diagnosticsService_1.SPEECH_PITCH)}/>
            <StatusRow label="Volume" value={String(diagnosticsService_1.SPEECH_VOLUME)}/>
            <StatusRow label="Pronunciation Preview" value={pronunciationPreview}/>
            <react_native_1.View style={styles.buttonRow}>
              <ActionButton label="Test Voice" onPress={handleTestVoice}/>
              <ActionButton label="Reload Voice Engine" onPress={handleReloadVoice}/>
            </react_native_1.View>

            <SectionHeader title="Memory Inspector"/>
            <react_native_1.Text style={styles.subLabel}>Pinned Notes ({pinnedNotes.length})</react_native_1.Text>
            {pinnedNotes.length === 0 && <react_native_1.Text style={styles.emptyText}>No pinned notes.</react_native_1.Text>}
            {pinnedNotes.map(function (note, i) { return (<react_native_1.Text key={"pin-".concat(i)} style={styles.factText}>
                • {note}
              </react_native_1.Text>); })}
            <react_native_1.Text style={styles.subLabel}>Recent Facts ({facts.length})</react_native_1.Text>
            {facts.length === 0 && <react_native_1.Text style={styles.emptyText}>No session facts.</react_native_1.Text>}
            {facts.map(function (fact) { return (<react_native_1.View key={"".concat(fact.key, "-").concat(fact.timestamp)} style={styles.factRow}>
                <react_native_1.Text style={styles.factText} numberOfLines={1}>
                  {fact.key}: {fact.value}
                </react_native_1.Text>
                <react_native_1.TouchableOpacity onPress={function () {
                void handleDeleteFact(fact.key, fact.timestamp);
            }} accessibilityRole="button" accessibilityLabel={"Delete fact ".concat(fact.key)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <react_native_1.Text style={styles.deleteGlyph}>✕</react_native_1.Text>
                </react_native_1.TouchableOpacity>
              </react_native_1.View>); })}
            <react_native_1.View style={styles.buttonRow}>
              <ActionButton label="Export Memory" onPress={function () {
            void handleExportMemory();
        }}/>
              <ActionButton label="Clear All Memory" onPress={function () {
            void handleClearMemory();
        }}/>
            </react_native_1.View>

            <SectionHeader title="Developer Actions"/>
            <react_native_1.View style={styles.buttonRow}>
              <ActionButton label="Test Weather API" onPress={function () {
            void handleTestWeather();
        }}/>
              <ActionButton label="Export Conversation" onPress={function () {
            void handleExportConversation();
        }}/>
            </react_native_1.View>
            <react_native_1.View style={styles.buttonRow}>
              <ActionButton label="Clear Conversation" onPress={function () {
            void handleClearConversation();
        }}/>
            </react_native_1.View>
          </react_native_1.ScrollView>
        </GlassPanel_1.default>
      </react_native_1.Animated.View>
    </react_native_1.View>);
}
var styles = react_native_1.StyleSheet.create({
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 },
    backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(2,4,10,0.7)' },
    panelWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '78%' },
    panelCard: { borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingBottom: 4 },
    dragHandleArea: { alignItems: 'center', paddingVertical: 6 },
    dragHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,234,255,0.35)' },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,234,255,0.2)',
    },
    title: { fontFamily: theme_1.fonts.displayBlack, fontSize: 13, letterSpacing: 2, color: theme_1.colors.cyan },
    closeGlyph: { fontSize: 16, color: theme_1.colors.textDim },
    actionMessage: { fontFamily: theme_1.fonts.body, fontSize: 11, color: theme_1.colors.cyanSoft, paddingVertical: 6 },
    scroll: { maxHeight: 420 },
    scrollContent: { paddingBottom: 20, gap: 4 },
    sectionHeader: {
        fontFamily: theme_1.fonts.display,
        fontSize: 11,
        letterSpacing: 1.5,
        color: theme_1.colors.cyanSoft,
        textTransform: 'uppercase',
        marginTop: 14,
        marginBottom: 4,
    },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
    statusLabel: { fontFamily: theme_1.fonts.body, fontSize: 11.5, color: theme_1.colors.textDim },
    statusValue: { fontFamily: theme_1.fonts.display, fontSize: 11.5 },
    loadingText: { fontFamily: theme_1.fonts.body, fontSize: 11, color: theme_1.colors.textDim },
    subLabel: {
        fontFamily: theme_1.fonts.body,
        fontSize: 10.5,
        letterSpacing: 0.8,
        color: theme_1.colors.textDim,
        textTransform: 'uppercase',
        marginTop: 8,
    },
    emptyText: { fontFamily: theme_1.fonts.body, fontSize: 11, color: theme_1.colors.textDim, fontStyle: 'italic' },
    factRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingVertical: 3 },
    factText: { fontFamily: theme_1.fonts.body, fontSize: 11, color: theme_1.colors.textPrimary, flexShrink: 1 },
    deleteGlyph: { fontSize: 13, color: theme_1.colors.warnAmber },
    buttonRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
    actionButton: {
        flex: 1,
        paddingVertical: 9,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(0,234,255,0.28)',
        backgroundColor: 'rgba(0,234,255,0.06)',
        alignItems: 'center',
    },
    actionButtonText: { fontFamily: theme_1.fonts.body, fontSize: 10.5, letterSpacing: 0.6, color: theme_1.colors.cyanSoft, textTransform: 'uppercase' },
});
exports.default = DeveloperPanel;
