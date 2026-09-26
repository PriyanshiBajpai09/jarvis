"use strict";
// CodeBlock.tsx — Part E: rich code rendering. Dark monospace block,
// preserved indentation, horizontal scroll for long lines, copy button.
// Normal text bubbles are unaffected — this only renders for segments
// parseMessageSegments identified as fenced code.
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
var COPY_RESET_MS = 1500;
function CodeBlock(_a) {
    var code = _a.code, language = _a.language;
    var _b = (0, react_1.useState)(false), copied = _b[0], setCopied = _b[1];
    function handleCopy() {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Clipboard.setStringAsync(code)];
                    case 1:
                        _a.sent();
                        setCopied(true);
                        setTimeout(function () { return setCopied(false); }, COPY_RESET_MS);
                        return [2 /*return*/];
                }
            });
        });
    }
    return (<react_native_1.View style={styles.wrap}>
      <react_native_1.View style={styles.header}>
        <react_native_1.Text style={styles.language}>{language ? language.toUpperCase() : 'CODE'}</react_native_1.Text>
        <react_native_1.TouchableOpacity onPress={function () {
            void handleCopy();
        }} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
  <react_native_1.Text style={styles.copyLabel}>
    {copied ? "Copied" : "Copy"}
  </react_native_1.Text>
    </react_native_1.TouchableOpacity>
      </react_native_1.View>
      <react_native_1.ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        <react_native_1.Text style={styles.code}>{code}</react_native_1.Text>
      </react_native_1.ScrollView>
    </react_native_1.View>);
}
var styles = react_native_1.StyleSheet.create({
    wrap: {
        backgroundColor: 'rgba(2,6,16,0.85)',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(0,234,255,0.2)',
        marginVertical: 6,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,234,255,0.15)',
    },
    language: { fontFamily: theme_1.fonts.display, fontSize: 9, letterSpacing: 1.2, color: theme_1.colors.cyanSoft },
    copyLabel: { fontFamily: theme_1.fonts.body, fontSize: 10, color: theme_1.colors.textDim, textTransform: 'uppercase' },
    scroll: { paddingHorizontal: 10, paddingVertical: 8 },
    code: {
        fontFamily: react_native_1.Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontSize: 12.5,
        lineHeight: 18,
        color: theme_1.colors.textPrimary,
    },
});
exports.default = CodeBlock;
