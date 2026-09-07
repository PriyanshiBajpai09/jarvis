import React, { useCallback, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { View, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  useFonts,
  Orbitron_700Bold,
  Orbitron_800ExtraBold,
} from "@expo-google-fonts/orbitron";
import {
  Rajdhani_500Medium,
  Rajdhani_600SemiBold,
} from "@expo-google-fonts/rajdhani";

import BootSequenceMobile from "./components/BootSequenceMobile";
import HomeScreen from "./screens/HomeScreen";
import { colors } from "./theme/theme";

export default function App() {
  const [fontsLoaded] = useFonts({
    Orbitron_700Bold,
    Orbitron_800ExtraBold,
    Rajdhani_500Medium,
    Rajdhani_600SemiBold,
  });

  const [bootComplete, setBootComplete] = useState(false);

  const handleBootComplete = useCallback(() => {
    setBootComplete(true);
  }, []);

  if (!fontsLoaded) {
    return (
      <SafeAreaProvider>
        <View style={styles.blank} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <StatusBar style="light"/>

        {bootComplete ? (
          <HomeScreen />
        ) : (
          <BootSequenceMobile onComplete={handleBootComplete} />
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgBlack,
  },
  blank: {
    flex: 1,
    backgroundColor: colors.bgBlack,
  },
});