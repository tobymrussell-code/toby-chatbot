import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { PlanningProvider } from "./src/state/PlanningContext";

export default function App() {
  return (
    <SafeAreaProvider>
      <PlanningProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </PlanningProvider>
    </SafeAreaProvider>
  );
}
