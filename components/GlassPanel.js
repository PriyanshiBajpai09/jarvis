"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = GlassPanel;
var react_1 = require("react");
var react_native_1 = require("react-native");
function GlassPanel(_a) {
    var children = _a.children, style = _a.style;
    return <react_native_1.View style={[styles.panel, style]}>{children}</react_native_1.View>;
}
var styles = react_native_1.StyleSheet.create({
    panel: {
        width: '100%',
        backgroundColor: 'rgba(6,18,36,0.65)',
        borderWidth: 1,
        borderColor: 'rgba(0,234,255,0.45)',
        borderRadius: 6,
        padding: 16,
        overflow: 'hidden',
        shadowColor: '#00EAFF',
        shadowOpacity: 0.35,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 0 },
    },
});
