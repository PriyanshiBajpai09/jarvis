// DeveloperPanel.tsx — v0.9.0. Slide-up diagnostics panel matching the
// existing glass/cyan design language (reuses GlassPanel). All data
// comes from read-only getters or already-existing storage/service
// functions — no new business logic, no duplicated memory/weather/
// voice mechanics. Closes via backdrop tap, close button, swipe down,
// or Escape (handled in useDevModeUnlock).

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { colors, fonts } from '../theme/theme';
import GlassPanel from './GlassPanel';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { collectDiagnostics, DiagnosticsSnapshot, SPEECH_PITCH, SPEECH_RATE, SPEECH_VOLUME } from '../services/diagnosticsService';
import { previewPronunciation, reloadVoiceEngine, speak } from '../services/webVoiceService';
import { getWeatherAnswer } from '../services/liveInfoService';
import { clearConversation, loadConversation } from '../storage/conversationStore';
import { clearSessionMemory, deleteFact, getAllFacts, getPinnedNotes, SessionFact } from '../storage/sessionMemory';

interface DeveloperPanelProps {
  visible: boolean;
  onClose: () => void;
}

function StatusRow({ label, value, tone }: { label: string; value: string; tone?: 'safe' | 'warn' | 'neutral' }) {
  const color = tone === 'safe' ? colors.safeGreen : tone === 'warn' ? colors.warnAmber : colors.cyanSoft;
  return (
    <View style={styles.statusRow}>
      <Text style={styles.statusLabel}>{label}</Text>
      <Text style={[styles.statusValue, { color }]}>{value}</Text>
    </View>
  );
}

function ActionButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={styles.actionButton}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.actionButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function DeveloperPanel({ visible, onClose }: DeveloperPanelProps) {
  const reducedMotion = useReducedMotion();
  const slide = useMemo(() => new Animated.Value(0), []);
  const [mounted, setMounted] = useState(visible);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsSnapshot | null>(null);
  const [facts, setFacts] = useState<SessionFact[]>([]);
  const [pinnedNotes, setPinnedNotes] = useState<string[]>([]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    const [snapshot, allFacts, pins] = await Promise.all([collectDiagnostics(), getAllFacts(), getPinnedNotes()]);
    setDiagnostics(snapshot);
    setFacts(allFacts);
    setPinnedNotes(pins);
  }, []);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      void refreshData();
      Animated.timing(slide, {
        toValue: 1,
        duration: reducedMotion ? 0 : 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slide, {
        toValue: 0,
        duration: reducedMotion ? 0 : 260,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, reducedMotion, slide, refreshData]);

  const translateY = useMemo(() => slide.interpolate({ inputRange: [0, 1], outputRange: [420, 0] }), [slide]);
  const backdropOpacity = useMemo(() => slide.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }), [slide]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_evt, gesture) => gesture.dy > 6,
        onPanResponderMove: (_evt, gesture) => {
          if (gesture.dy > 0) {
            slide.setValue(1 - Math.min(1, gesture.dy / 260));
          }
        },
        onPanResponderRelease: (_evt, gesture) => {
          if (gesture.dy > 90) {
            onClose();
          } else {
            Animated.timing(slide, { toValue: 1, duration: 180, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
          }
        },
      }),
    [slide, onClose]
  );

  const showMessage = useCallback((text: string) => {
    setActionMessage(text);
    setTimeout(() => setActionMessage(null), 2500);
  }, []);

  const handleTestVoice = useCallback(() => {
    speak('This is a JARVIS voice diagnostic test, Priyanshi.');
    showMessage('Voice test triggered.');
  }, [showMessage]);

  const handleReloadVoice = useCallback(() => {
    reloadVoiceEngine();
    showMessage('Voice engine reset. Next reply will re-select a voice.');
  }, [showMessage]);

  const handleTestWeather = useCallback(async () => {
    showMessage('Testing weather uplink...');
    const result = await getWeatherAnswer('London');
    showMessage(result ? 'Weather uplink responded successfully.' : 'Weather uplink did not respond.');
  }, [showMessage]);

  const handleExportConversation = useCallback(async () => {
    const stored = await loadConversation();
    const payload = JSON.stringify(stored ?? [], null, 2);
    await Clipboard.setStringAsync(payload);
    showMessage('Conversation copied to clipboard.');
  }, [showMessage]);

  const handleClearConversation = useCallback(async () => {
    await clearConversation();
    showMessage('Conversation storage cleared. Restart to fully reset the view.');
  }, [showMessage]);

  const handleClearMemory = useCallback(async () => {
    await clearSessionMemory();
    await refreshData();
    showMessage('Session memory cleared.');
  }, [refreshData, showMessage]);

  const handleExportMemory = useCallback(async () => {
    const payload = JSON.stringify({ facts, pinnedNotes }, null, 2);
    await Clipboard.setStringAsync(payload);
    showMessage('Memory copied to clipboard.');
  }, [facts, pinnedNotes, showMessage]);

  const handleDeleteFact = useCallback(
    async (key: string, timestamp: number) => {
      await deleteFact(key, timestamp);
      await refreshData();
    },
    [refreshData]
  );

  const pronunciationPreview = useMemo(() => previewPronunciation('Priyanshi, DBMS, DSA'), []);

  if (!mounted) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close developer mode"
        />
      </Animated.View>

      <Animated.View style={[styles.panelWrap, { transform: [{ translateY }] }]}>
<GlassPanel style={styles.panelCard}>          <View {...panResponder.panHandlers} style={styles.dragHandleArea}>
            <View style={styles.dragHandle} />
          </View>

          <View style={styles.headerRow}>
            <Text style={styles.title}>DEVELOPER MODE</Text>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close developer mode"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.closeGlyph}>✕</Text>
            </TouchableOpacity>
          </View>

          {actionMessage && <Text style={styles.actionMessage}>{actionMessage}</Text>}

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <SectionHeader title="System Diagnostics" />
            {diagnostics ? (
              <>
                <StatusRow
                  label="Voice Engine"
                  value={diagnostics.voiceEngineOnline ? 'Online' : 'Unavailable'}
                  tone={diagnostics.voiceEngineOnline ? 'safe' : 'warn'}
                />
                <StatusRow
                  label="Memory"
                  value={diagnostics.memoryConnected ? 'Connected' : 'Unavailable'}
                  tone={diagnostics.memoryConnected ? 'safe' : 'warn'}
                />
                <StatusRow
                  label="Weather API"
                  value={diagnostics.weatherApiConfigured ? 'Configured' : 'Not configured'}
                  tone={diagnostics.weatherApiConfigured ? 'safe' : 'warn'}
                />
                <StatusRow label="AI Provider" value={diagnostics.aiProvider} />
                <StatusRow
                  label="Last Response"
                  value={diagnostics.lastLatencyMs !== null ? `${diagnostics.lastLatencyMs}ms` : 'No data yet'}
                />
                <StatusRow label="Arc Reactor" value={diagnostics.reactorStatus} tone="safe" />
              </>
            ) : (
              <Text style={styles.loadingText}>Gathering diagnostics...</Text>
            )}

            <SectionHeader title="Voice Lab" />
            <StatusRow label="Selected Voice" value={diagnostics?.selectedVoiceName ?? 'Not selected yet'} />
            <StatusRow label="Rate" value={String(SPEECH_RATE)} />
            <StatusRow label="Pitch" value={String(SPEECH_PITCH)} />
            <StatusRow label="Volume" value={String(SPEECH_VOLUME)} />
            <StatusRow label="Pronunciation Preview" value={pronunciationPreview} />
            <View style={styles.buttonRow}>
              <ActionButton label="Test Voice" onPress={handleTestVoice} />
              <ActionButton label="Reload Voice Engine" onPress={handleReloadVoice} />
            </View>

            <SectionHeader title="Memory Inspector" />
            <Text style={styles.subLabel}>Pinned Notes ({pinnedNotes.length})</Text>
            {pinnedNotes.length === 0 && <Text style={styles.emptyText}>No pinned notes.</Text>}
            {pinnedNotes.map((note, i) => (
              <Text key={`pin-${i}`} style={styles.factText}>
                • {note}
              </Text>
            ))}
            <Text style={styles.subLabel}>Recent Facts ({facts.length})</Text>
            {facts.length === 0 && <Text style={styles.emptyText}>No session facts.</Text>}
            {facts.map((fact) => (
              <View key={`${fact.key}-${fact.timestamp}`} style={styles.factRow}>
                <Text style={styles.factText} numberOfLines={1}>
                  {fact.key}: {fact.value}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    void handleDeleteFact(fact.key, fact.timestamp);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete fact ${fact.key}`}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Text style={styles.deleteGlyph}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            <View style={styles.buttonRow}>
              <ActionButton
                label="Export Memory"
                onPress={() => {
                  void handleExportMemory();
                }}
              />
              <ActionButton
                label="Clear All Memory"
                onPress={() => {
                  void handleClearMemory();
                }}
              />
            </View>

            <SectionHeader title="Developer Actions" />
            <View style={styles.buttonRow}>
              <ActionButton
                label="Test Weather API"
                onPress={() => {
                  void handleTestWeather();
                }}
              />
              <ActionButton
                label="Export Conversation"
                onPress={() => {
                  void handleExportConversation();
                }}
              />
            </View>
            <View style={styles.buttonRow}>
              <ActionButton
                label="Clear Conversation"
                onPress={() => {
                  void handleClearConversation();
                }}
              />
            </View>
          </ScrollView>
        </GlassPanel>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  title: { fontFamily: fonts.displayBlack, fontSize: 13, letterSpacing: 2, color: colors.cyan },
  closeGlyph: { fontSize: 16, color: colors.textDim },
  actionMessage: { fontFamily: fonts.body, fontSize: 11, color: colors.cyanSoft, paddingVertical: 6 },
  scroll: { maxHeight: 420 },
  scrollContent: { paddingBottom: 20, gap: 4 },
  sectionHeader: {
    fontFamily: fonts.display,
    fontSize: 11,
    letterSpacing: 1.5,
    color: colors.cyanSoft,
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 4,
  },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  statusLabel: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textDim },
  statusValue: { fontFamily: fonts.display, fontSize: 11.5 },
  loadingText: { fontFamily: fonts.body, fontSize: 11, color: colors.textDim },
  subLabel: {
    fontFamily: fonts.body,
    fontSize: 10.5,
    letterSpacing: 0.8,
    color: colors.textDim,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  emptyText: { fontFamily: fonts.body, fontSize: 11, color: colors.textDim, fontStyle: 'italic' },
  factRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingVertical: 3 },
  factText: { fontFamily: fonts.body, fontSize: 11, color: colors.textPrimary, flexShrink: 1 },
  deleteGlyph: { fontSize: 13, color: colors.warnAmber },
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
  actionButtonText: { fontFamily: fonts.body, fontSize: 10.5, letterSpacing: 0.6, color: colors.cyanSoft, textTransform: 'uppercase' },
});

export default DeveloperPanel;