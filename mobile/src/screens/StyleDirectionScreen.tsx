import React, { useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { PrimaryButton } from "../components/PrimaryButton";
import { SelectableCard } from "../components/SelectableCard";
import { colors, spacing, typography } from "../theme/theme";
import { usePlanning } from "../state/PlanningContext";
import type { StyleDirection } from "../types/domain";

type Props = NativeStackScreenProps<RootStackParamList, "StyleDirection">;

const STYLES: { value: StyleDirection; title: string; description: string }[] = [
  { value: "clean_and_neutral", title: "Clean and Neutral", description: "Broad buyer appeal with simple, safe finishes." },
  {
    value: "modern_farmhouse",
    title: "Modern Farmhouse",
    description: "Warm, casual, light colors, black accents, and wood texture.",
  },
  { value: "updated_traditional", title: "Updated Traditional", description: "Classic and clean without feeling trendy." },
  { value: "modern_contemporary", title: "Modern / Contemporary", description: "Sleek, simple, and more dramatic." },
  { value: "budget_refresh", title: "Budget Refresh", description: "Paint, lighting, cleaning, staging, and small updates." },
  {
    value: "high_end_transformation",
    title: "High-End Transformation",
    description: "Premium finishes and bigger design changes.",
  },
];

export function StyleDirectionScreen({ navigation }: Props) {
  const { chooseStyle, styleDirection } = usePlanning();
  const [selected, setSelected] = useState<StyleDirection | null>(styleDirection);
  const [saving, setSaving] = useState(false);

  async function onBuild() {
    if (!selected) return;
    setSaving(true);
    try {
      await chooseStyle(selected);
      navigation.navigate("Processing", { mode: "report" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={typography.h2}>What style direction do you want?</Text>
        {STYLES.map((style) => (
          <SelectableCard
            key={style.value}
            title={style.title}
            description={style.description}
            selected={selected === style.value}
            onPress={() => setSelected(style.value)}
          />
        ))}
        <PrimaryButton label="Build My Plan" disabled={!selected} loading={saving} onPress={onBuild} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
});
