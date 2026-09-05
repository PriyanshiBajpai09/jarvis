import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";

import { colors, fonts } from "../../mobile/theme/theme";
import BackgroundLayers from "../components/BackgroundLayers";
import HoloHeaderMobile from "../components/HoloHeaderMobile";
import GlassPanel from "../components/GlassPanel";
import ArcReactorMobile from "../components/ArcReactorMobile";
import ReactorStageBackdrop from "../components/ReactorStageBackdrop";

function HomeScreen() {
  return (
    <View style={styles.root}>
      <BackgroundLayers />

      <View style={styles.headerLayer}>
        <HoloHeaderMobile />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <GlassPanel style={styles.welcomePanel}>
          <Text style={styles.welcomeLine}>Good morning, Priyanshi.</Text>
          <Text style={styles.welcomeAccent}>I'm Jarvis.</Text>
          <Text style={styles.welcomeLine}>Everything is ready.</Text>
          <Text style={styles.welcomeLine}>
            What are we building today?
          </Text>
        </GlassPanel>

        <View style={styles.reactorStage}>
          <ReactorStageBackdrop size={300} />
          <ArcReactorMobile size={220} />
        </View>

        <GlassPanel style={styles.statusPanel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>System Status</Text>
            <View style={styles.pulseDot} />
          </View>

          <StatusRow label="Core Output" value="92%" />
          <StatusRow label="Shield Integrity" value="78%" />
          <StatusRow label="Neural Sync" value="100%" />
          <StatusRow label="Power Reserve" value="64%" tone="warn" />
        </GlassPanel>

        <GlassPanel style={styles.convoPanel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Conversation</Text>
            <View style={styles.pulseDot} />
          </View>

          <View style={styles.convoLine}>
            <Text style={styles.convoTag}>JARVIS</Text>
            <Text style={styles.convoText}>Good morning, Priyanshi.</Text>
          </View>

          <View style={styles.convoLine}>
            <Text style={styles.convoTag}>JARVIS</Text>
            <Text style={styles.convoText}>
              All systems are operational.
            </Text>
          </View>

          <Text style={styles.convoHint}>
            Voice & text input arrive in a future phase.
          </Text>
        </GlassPanel>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Bottom Dock */}

      <View style={styles.dockBar}>
        <GlassPanel style={styles.dockPanel}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.micButton}
            onPress={() => {}}
          >
            <View style={styles.micCore} />
          </TouchableOpacity>
        </GlassPanel>
      </View>
    </View>
  );
}

function StatusRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "warn" | "safe";
}) {
  const valueColor =
    tone === "warn"
      ? colors.warnAmber
      : tone === "safe"
      ? colors.safeGreen
      : colors.cyanSoft;

  return (
    <View style={styles.statusRow}>
      <Text style={styles.statusLabel}>{label}</Text>
      <Text style={[styles.statusValue, { color: valueColor }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgBlack,
  },

  headerLayer: {
    zIndex: 5,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 20,
  },

  welcomePanel: {
    gap: 4,
  },

  welcomeLine: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textPrimary,
  },

  welcomeAccent: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.cyan,
    marginVertical: 4,
  },

  reactorStage: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
  },

  statusPanel: {
    gap: 10,
  },

  convoPanel: {
    gap: 10,
  },

  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,234,255,0.22)",
    paddingBottom: 8,
    marginBottom: 4,
  },

  panelTitle: {
    fontFamily: fonts.display,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.cyanSoft,
    textTransform: "uppercase",
  },

  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.cyan,
  },

  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },

  statusLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textDim,
    textTransform: "uppercase",
  },

  statusValue: {
    fontFamily: fonts.display,
    fontSize: 12,
  },

  convoLine: {
    borderLeftWidth: 2,
    borderLeftColor: "rgba(0,234,255,0.35)",
    backgroundColor: "rgba(0,234,255,0.04)",
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 2,
  },

  convoTag: {
    fontFamily: fonts.display,
    fontSize: 9,
    letterSpacing: 1.5,
    color: colors.cyanSoft,
  },

  convoText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textPrimary,
  },

  convoHint: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textDim,
    marginTop: 2,
  },

  dockBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingBottom: 18,
    zIndex: 6,
  },

  dockPanel: {
    alignItems: "center",
    paddingVertical: 12,
  },

  micButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,234,255,0.08)",
    borderWidth: 1.5,
    borderColor: "rgba(0,234,255,0.45)",
    shadowColor: colors.cyan,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },

  micCore: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.cyan,
  },
});

export default HomeScreen;