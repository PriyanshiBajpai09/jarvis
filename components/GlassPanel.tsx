import React from 'react';
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';

interface GlassPanelProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function GlassPanel({
  children,
  style,
}: GlassPanelProps) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

const styles = StyleSheet.create({
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