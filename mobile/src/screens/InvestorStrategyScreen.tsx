import React, { useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { PrimaryButton } from "../components/PrimaryButton";
import { SelectableCard } from "../components/SelectableCard";
import { colors, spacing, typography } from "../theme/theme";
import { usePlanning } from "../state/PlanningContext";
import type { InvestorStrategy } from "../types/domain";

type Props = NativeStackScreenProps<RootStackParamList, "InvestorStrategy">;

const STRATEGIES: { value: InvestorStrategy; title: string; description: string }[] = [
  { value: "flip", title: "Flip", description: "Improve the property and resell for profit." },
  { value: "rental", title: "Rental", description: "Make smart updates for long-term rentability." },
  { value: "brrrr", title: "BRRRR", description: "Buy, rehab, rent, refinance, repeat." },
  {
    value: "keep_or_sell",
    title: "Keep or Sell Decision",
    description: "Compare whether this project is better as a rental, flip, or resale.",
  },
  { value: "not_sure", title: "Not Sure Yet", description: "Help me think through the best path." },
];

export function InvestorStrategyScreen({ navigation }: Props) {
  const { chooseInvestorStrategy, investorStrategy } = usePlanning();
  const [selected, setSelected] = useState<InvestorStrategy | null>(investorStrategy);
  const [saving, setSaving] = useState(false);

  async function onContinue() {
    if (!selected) return;
    setSaving(true);
    try {
      await chooseInvestorStrategy(selected);
      navigation.navigate("StyleDirection");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={typography.h2}>What investor strategy are you considering?</Text>
        {STRATEGIES.map((strategy) => (
          <SelectableCard
            key={strategy.value}
            title={strategy.title}
            description={strategy.description}
            selected={selected === strategy.value}
            onPress={() => setSelected(strategy.value)}
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
