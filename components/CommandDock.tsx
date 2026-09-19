// CommandDock.tsx — v0.7.0: Smart Command Dock. Pure presentational
// component — it owns no chat/router/memory logic itself. All four
// actions are callbacks supplied by ConversationPanel, which is the
// only place that actually touches sendText/router/memory. Visual
// language matches the existing app: glass panel, cyan glow, rounded
// cards, the same press-animation pattern already used by
// MicButtonPlaceholder (Animated.spring scale on press).

import React, { useMemo, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, fonts } from '../theme/theme';
import GlassPanel from './GlassPanel';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface CommandDockProps {
  onWeather: () => void;
  onFocus: () => void;
  onRecap: () => void;
  onRemember: (text: string) => void;
}

interface DockButtonProps {
  label: string;
  glyph: string;
  accessibilityLabel: string;
  onPress: () => void;
  active?: boolean;
}

function DockButton({ label, glyph, accessibilityLabel, onPress, active }: DockButtonProps) {
  const reducedMotion = useReducedMotion();
  const scale = useMemo(() => new Animated.Value(1), []);

  function handlePressIn() {
    if (reducedMotion) return;
    Animated.spring(scale, { toValue: 0.94, useNativeDriver: true }).start();
  }
  function handlePressOut() {
    if (reducedMotion) return;
    Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  }

  return (
    <Animated.View style={[styles.buttonWrap, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.button, active ? styles.buttonActive : null]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        <Text style={styles.glyph}>{glyph}</Text>
        <Text style={styles.label}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

function CommandDock({ onWeather, onFocus, onRecap, onRemember }: CommandDockProps) {
  const [rememberOpen, setRememberOpen] = useState(false);
  const [rememberDraft, setRememberDraft] = useState('');

  function handleRememberPress() {
    setRememberOpen((prev) => !prev);
  }

  function handleRememberSubmit() {
    const clean = rememberDraft.trim();
    if (!clean) {
      setRememberOpen(false);
      return;
    }
    onRemember(clean);
    setRememberDraft('');
    setRememberOpen(false);
  }

  return (
    <GlassPanel style={styles.panel}>
      <View style={styles.row}>
        <DockButton label="Weather" glyph="☁" accessibilityLabel="Ask JARVIS for the weather" onPress={onWeather} />
        <DockButton label="Focus" glyph="◉" accessibilityLabel="Start a study focus session" onPress={onFocus} />
        <DockButton label="Recap" glyph="↺" accessibilityLabel="Ask JARVIS to recap the conversation" onPress={onRecap} />
        <DockButton
          label="Remember"
          glyph="✎"
          accessibilityLabel="Add a quick note for JARVIS to remember"
          onPress={handleRememberPress}
          active={rememberOpen}
        />
      </View>

      {rememberOpen && (
        <View style={styles.rememberRow}>
          <TextInput
            style={styles.rememberInput}
            placeholder="Interview Friday..."
            placeholderTextColor={colors.textDim}
            value={rememberDraft}
            onChangeText={setRememberDraft}
            onSubmitEditing={handleRememberSubmit}
            returnKeyType="done"
            autoFocus
            maxLength={200}
          />
          <TouchableOpacity
            style={styles.rememberConfirm}
            onPress={handleRememberSubmit}
            disabled={!rememberDraft.trim()}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Save note"
          >
            <Text style={styles.rememberConfirmGlyph}>✓</Text>
          </TouchableOpacity>
        </View>
      )}
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
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
    shadowColor: colors.cyan,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  buttonActive: {
    borderColor: colors.glassBorderStrong,
    backgroundColor: 'rgba(0,234,255,0.1)',
    shadowOpacity: 0.45,
  },
  glyph: {
    fontSize: 16,
    color: colors.cyanSoft,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 9.5,
    letterSpacing: 0.6,
    color: colors.textDim,
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
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textPrimary,
  },
  rememberConfirm: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: 'rgba(0,234,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rememberConfirmGlyph: {
    color: colors.cyanSoft,
    fontSize: 15,
  },
});

export default CommandDock;