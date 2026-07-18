import React, { useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { PrimaryButton } from "../components/PrimaryButton";
import { SelectableCard } from "../components/SelectableCard";
import { colors, spacing, typography } from "../theme/theme";
import { usePlanning } from "../state/PlanningContext";
import type { GoalPath } from "../types/domain";

type Props = NativeStackScreenProps<RootStackParamList, "ProjectGoal">;

const GOALS: { value: GoalPath; title: string; description: string }[] = [
  {
    value: "sell_for_more",
    title: "Sell For More",
    description: "I'm preparing to sell and want to know which updates are worth it.",
  },
  {
    value: "improve_my_home",
    title: "Improve My Home",
    description: "I live here and want the space to look or function better.",
  },
  {
    value: "buy_with_confidence",
    title: "Buy With Confidence",
    description: "I'm thinking about buying and want to understand renovation potential.",
  },
  {
    value: "investor_analysis",
    title: "Investor Analysis",
    description: "I'm evaluating this as a flip, rental, or BRRRR project.",
  },
  {
    value: "just_exploring",
    title: "Just Exploring Ideas",
    description: "I want design ideas and rough cost ranges.",
  },
];

export function ProjectGoalScreen({ navigation }: Props) {
  const { chooseGoal, goalPath } = usePlanning();
  const [selected, setSelected] = useState<GoalPath | null>(goalPath);
  const [saving, setSaving] = useState(false);

  async function onContinue() {
    if (!selected) return;
    setSaving(true);
    try {
      await chooseGoal(selected);
      navigation.navigate(selected === "investor_analysis" ? "InvestorStrategy" : "StyleDirection");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={typography.h2}>What are you trying to do with this project?</Text>
        {GOALS.map((goal) => (
          <SelectableCard
            key={goal.value}
            title={goal.title}
            description={goal.description}
            selected={selected === goal.value}
            onPress={() => setSelected(goal.value)}
          />
        ))}
        <PrimaryButton label="Continue" disabled={!selected} loading={saving} onPress={onContinue} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
});
