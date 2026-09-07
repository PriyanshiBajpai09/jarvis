// TEST-999
import React from "react";
import { StatusBar } from "expo-status-bar";
import HomeScreen from "../mobile/screens/HomeScreen";

export default function App() {
  return (
    <>
      <StatusBar style="light" />
      <HomeScreen />
    </>
  );
}