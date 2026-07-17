import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./types";
import { WelcomeScreen } from "../screens/WelcomeScreen";
import { ProcessingScreen } from "../screens/ProcessingScreen";
import { RoomConfirmationScreen } from "../screens/RoomConfirmationScreen";
import { ProjectGoalScreen } from "../screens/ProjectGoalScreen";
import { InvestorStrategyScreen } from "../screens/InvestorStrategyScreen";
import { StyleDirectionScreen } from "../screens/StyleDirectionScreen";
import { ReportScreen } from "../screens/ReportScreen";
import { LeadCaptureScreen } from "../screens/LeadCaptureScreen";
import { colors } from "../theme/theme";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Processing" component={ProcessingScreen} />
        <Stack.Screen name="RoomConfirmation" component={RoomConfirmationScreen} />
        <Stack.Screen name="ProjectGoal" component={ProjectGoalScreen} />
        <Stack.Screen name="InvestorStrategy" component={InvestorStrategyScreen} />
        <Stack.Screen name="StyleDirection" component={StyleDirectionScreen} />
        <Stack.Screen name="Report" component={ReportScreen} />
        <Stack.Screen
          name="LeadCapture"
          component={LeadCaptureScreen}
          options={{ presentation: "modal", headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
