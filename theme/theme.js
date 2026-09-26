"use strict";
// theme.ts
// Single source of truth for the MK-85 visual language on mobile.
// Mirrors the CSS custom properties from src/styles/jarvis.css so the
// Android app reads as the same operating system, not a reskin.
Object.defineProperty(exports, "__esModule", { value: true });
exports.theme = exports.spacing = exports.fonts = exports.glow = exports.colors = void 0;
exports.colors = {
    bgBlack: '#02040A',
    bgNavy: '#050B1A',
    navyDeep: '#0A1330',
    cyan: '#00EAFF',
    cyanSoft: '#7DF9FF',
    neonBlue: '#1E90FF',
    neonBlueDeep: '#0057B8',
    warnAmber: '#FFB300',
    safeGreen: '#29FFB0',
    glassBg: 'rgba(8, 20, 42, 0.55)',
    glassBorder: 'rgba(0, 234, 255, 0.35)',
    glassBorderStrong: 'rgba(0, 234, 255, 0.65)',
    textPrimary: '#E6FAFF',
    textDim: '#7FB3C9',
};
exports.glow = {
    sm: { shadowColor: exports.colors.cyan, shadowOpacity: 0.55, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
    md: { shadowColor: exports.colors.cyan, shadowOpacity: 0.45, shadowRadius: 20, shadowOffset: { width: 0, height: 0 } },
    lg: { shadowColor: exports.colors.cyan, shadowOpacity: 0.35, shadowRadius: 45, shadowOffset: { width: 0, height: 0 } },
};
exports.fonts = {
    display: 'Orbitron_700Bold',
    displayBlack: 'Orbitron_800ExtraBold',
    body: 'Rajdhani_500Medium',
    bodySemibold: 'Rajdhani_600SemiBold',
};
exports.spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
};
exports.theme = { colors: exports.colors, glow: exports.glow, fonts: exports.fonts, spacing: exports.spacing };
exports.default = exports.theme;
