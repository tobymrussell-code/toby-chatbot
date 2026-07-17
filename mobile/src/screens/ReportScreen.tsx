import React, { useState } from "react";
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { Card } from "../components/Card";
import { PrimaryButton } from "../components/PrimaryButton";
import { colors, radii, spacing, typography } from "../theme/theme";
import { usePlanning } from "../state/PlanningContext";
import { saveReportLocally, shareReportSummary } from "../utils/reportExport";
import { devError } from "../utils/log";

type Props = NativeStackScreenProps<RootStackParamList, "Report">;

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function Bullets({ items }: { items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <View style={styles.bulletList}>
      {items.map((item, i) => (
        <View key={i} style={styles.bulletRow}>
          <Text style={styles.bulletDot}>{"•"}</Text>
          <Text style={[typography.body, styles.bulletText]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function Badge({ label, tone }: { label: string; tone: "high" | "medium" | "low" | "neutral" }) {
  const toneColor =
    tone === "high" ? colors.primary : tone === "medium" ? "#8A6D3B" : tone === "low" ? colors.textSecondary : colors.textDark;
  return (
    <View style={[styles.badge, { borderColor: toneColor }]}>
      <Text style={[styles.badgeText, { color: toneColor }]}>{label}</Text>
    </View>
  );
}

function impactTone(impact: string): "high" | "medium" | "low" {
  const lower = impact.toLowerCase();
  if (lower === "high") return "high";
  if (lower === "medium") return "medium";
  return "low";
}

export function ReportScreen({ navigation }: Props) {
  const { report, startAnotherRoom } = usePlanning();
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);

  if (!report) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyState}>
          <Text style={typography.h3}>No report available yet.</Text>
          <PrimaryButton label="Start Another Room" onPress={() => navigation.popToTop()} />
        </View>
      </SafeAreaView>
    );
  }

  const r = report.reportJson;

  async function onSave() {
    setSaving(true);
    try {
      await saveReportLocally(report!);
      Alert.alert("Report saved", "Your renovation report was saved to this device.");
    } catch (err) {
      devError("save report failed", err);
      Alert.alert("Could not save", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function onShare() {
    setSharing(true);
    try {
      await shareReportSummary(report!);
    } catch (err) {
      devError("share report failed", err);
      Alert.alert("Could not share", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSharing(false);
    }
  }

  function onStartAnother() {
    startAnotherRoom();
    navigation.popToTop();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={typography.h1}>Your Renovation Advisor Report</Text>
        <Text style={styles.subtitle}>
          {r.summary.roomType} • {r.summary.goal} • {r.summary.styleDirection}
        </Text>

        {/* Quick Summary */}
        <Card>
          <SectionTitle>Quick Summary</SectionTitle>
          <View style={styles.summaryRow}>
            <Text style={typography.bodyStrong}>Recommended level</Text>
            <Text style={typography.body}>{r.summary.recommendedProjectLevel}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={typography.bodyStrong}>Priority score</Text>
            <Text style={typography.body}>{r.summary.priorityScore}/10</Text>
          </View>
          <Text style={[typography.body, { marginTop: spacing.sm }]}>{r.summary.bestNextMove}</Text>
        </Card>

        {/* What We See */}
        <Card>
          <SectionTitle>What We See</SectionTitle>
          {r.observations.map((obs, i) => (
            <View key={i} style={i > 0 ? styles.observationSpacing : undefined}>
              <Text style={typography.bodyStrong}>{obs.title}</Text>
              <Text style={typography.body}>{obs.detail}</Text>
            </View>
          ))}
        </Card>

        {/* Recommended Project Level */}
        <Card>
          <SectionTitle>Recommended Project Level</SectionTitle>
          {r.projectLevels.map((level) => (
            <View key={level.name} style={styles.levelBlock}>
              <View style={styles.levelHeaderRow}>
                <Text style={typography.h3}>{level.name}</Text>
                <Text style={styles.levelCost}>{level.costRange}</Text>
              </View>
              <Text style={typography.caption}>{level.timeline} • {level.bestFor}</Text>
              {level.tasks?.length ? (
                <>
                  <Text style={styles.levelSubhead}>Includes</Text>
                  <Bullets items={level.tasks} />
                </>
              ) : null}
              {level.pros?.length ? (
                <>
                  <Text style={styles.levelSubhead}>Pros</Text>
                  <Bullets items={level.pros} />
                </>
              ) : null}
              {level.cons?.length ? (
                <>
                  <Text style={styles.levelSubhead}>Cons</Text>
                  <Bullets items={level.cons} />
                </>
              ) : null}
            </View>
          ))}
        </Card>

        {/* Priority Checklist */}
        <Card>
          <SectionTitle>Priority Checklist</SectionTitle>
          {r.priorityChecklist.map((item, i) => (
            <View key={i} style={styles.checklistItem}>
              <View style={styles.checklistHeaderRow}>
                <Text style={styles.checklistNumber}>{i + 1}</Text>
                <Text style={[typography.bodyStrong, { flex: 1 }]}>{item.task}</Text>
              </View>
              <Text style={typography.body}>{item.why}</Text>
              <View style={styles.checklistMetaRow}>
                <Badge label={item.difficulty} tone="neutral" />
                <Badge label={`${item.impact} impact`} tone={impactTone(item.impact)} />
                <Text style={styles.checklistCost}>{item.costRange}</Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Seller Advice */}
        {r.sellerAdvice ? (
          <Card>
            <SectionTitle>Seller Advice</SectionTitle>
            <Text style={styles.levelSubhead}>What buyers may notice first</Text>
            <Bullets items={r.sellerAdvice.buyersNoticeFirst} />
            <Text style={styles.levelSubhead}>Possible objections</Text>
            <Bullets items={r.sellerAdvice.possibleObjections} />
            <Text style={styles.levelSubhead}>Worth doing before listing</Text>
            <Bullets items={r.sellerAdvice.worthDoingBeforeListing} />
            <Text style={styles.levelSubhead}>Avoid over-improving</Text>
            <Bullets items={r.sellerAdvice.avoidOverImproving} />
            <Text style={styles.levelSubhead}>Photo readiness tips</Text>
            <Bullets items={r.sellerAdvice.photoReadinessTips} />
          </Card>
        ) : null}

        {/* Buyer Advice */}
        {r.buyerAdvice ? (
          <Card>
            <SectionTitle>Buyer Advice</SectionTitle>
            <Text style={styles.levelSubhead}>Cosmetic items</Text>
            <Bullets items={r.buyerAdvice.cosmeticItems} />
            <Text style={styles.levelSubhead}>May need professional inspection</Text>
            <Bullets items={r.buyerAdvice.mayNeedInspection} />
            <Text style={styles.levelSubhead}>Budget cushion</Text>
            <Text style={typography.body}>{r.buyerAdvice.budgetCushionAdvice}</Text>
            <Text style={styles.levelSubhead}>Questions to ask</Text>
            <Bullets items={r.buyerAdvice.questionsToAsk} />
            <Text style={styles.levelSubhead}>Negotiation considerations</Text>
            <Bullets items={r.buyerAdvice.negotiationConsiderations} />
          </Card>
        ) : null}

        {/* Homeowner Advice */}
        {r.homeownerAdvice ? (
          <Card>
            <SectionTitle>Homeowner Advice</SectionTitle>
            <Text style={styles.levelSubhead}>Comfort and function</Text>
            <Bullets items={r.homeownerAdvice.comfortAndFunction} />
            <Text style={styles.levelSubhead}>Design options</Text>
            <Bullets items={r.homeownerAdvice.designOptions} />
            <Text style={styles.levelSubhead}>Livability upgrades</Text>
            <Bullets items={r.homeownerAdvice.livabilityUpgrades} />
            <Text style={styles.levelSubhead}>Now vs. later</Text>
            <Text style={typography.body}>{r.homeownerAdvice.doNowVsLater}</Text>
            <Text style={styles.levelSubhead}>Where to avoid wasting money</Text>
            <Bullets items={r.homeownerAdvice.whereToAvoidWastingMoney} />
          </Card>
        ) : null}

        {/* Investor Advice */}
        {r.investorAdvice ? (
          <Card>
            <SectionTitle>Investor Advice</SectionTitle>
            <View style={styles.summaryRow}>
              <Text style={typography.bodyStrong}>Risk level</Text>
              <Badge label={r.investorAdvice.riskLevel} tone={impactTone(r.investorAdvice.riskLevel)} />
            </View>
            <Text style={styles.levelSubhead}>Best scope for this strategy</Text>
            <Text style={typography.body}>{r.investorAdvice.bestScopeForStrategy}</Text>
            <Text style={styles.levelSubhead}>Strategy considerations</Text>
            <Bullets items={r.investorAdvice.strategyConsiderations} />
            <Text style={styles.levelSubhead}>Over-improvement warning</Text>
            <Text style={typography.body}>{r.investorAdvice.overImprovementWarning}</Text>
            <Text style={styles.levelSubhead}>Durable material suggestions</Text>
            <Bullets items={r.investorAdvice.durableMaterialSuggestions} />
            <Text style={styles.levelSubhead}>Rent-ready vs. resale-ready</Text>
            <Text style={typography.body}>{r.investorAdvice.rentReadyVsResaleReady}</Text>
          </Card>
        ) : null}

        {/* Design Direction */}
        <Card>
          <SectionTitle>Design Direction</SectionTitle>
          <View style={styles.summaryRow}>
            <Text style={typography.bodyStrong}>Wall color family</Text>
            <Text style={typography.body}>{r.designDirection.wallColorFamily}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={typography.bodyStrong}>Trim color</Text>
            <Text style={typography.body}>{r.designDirection.trimColor}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={typography.bodyStrong}>Flooring direction</Text>
            <Text style={typography.body}>{r.designDirection.flooringDirection}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={typography.bodyStrong}>Lighting style</Text>
            <Text style={typography.body}>{r.designDirection.lightingStyle}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={typography.bodyStrong}>Hardware finish</Text>
            <Text style={typography.body}>{r.designDirection.hardwareFinish}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={typography.bodyStrong}>Staging direction</Text>
            <Text style={typography.body}>{r.designDirection.stagingDirection}</Text>
          </View>
          {r.designDirection.accentIdeas?.length ? (
            <>
              <Text style={styles.levelSubhead}>Optional accent ideas</Text>
              <Bullets items={r.designDirection.accentIdeas} />
            </>
          ) : null}
        </Card>

        {/* Estimated Budget */}
        <Card>
          <SectionTitle>Estimated Budget</SectionTitle>
          <View style={styles.summaryRow}>
            <Text style={typography.bodyStrong}>Minimum Prep</Text>
            <Text style={typography.body}>{r.budget.minimumPrep}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={typography.bodyStrong}>Smart Refresh</Text>
            <Text style={typography.body}>{r.budget.smartRefresh}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={typography.bodyStrong}>Full Transformation</Text>
            <Text style={typography.body}>{r.budget.fullTransformation}</Text>
          </View>
          <Text style={[typography.caption, { marginTop: spacing.sm }]}>{r.budget.disclaimer}</Text>
        </Card>

        {/* Shopping List */}
        <Card>
          <SectionTitle>Suggested Shopping List</SectionTitle>
          <Bullets items={r.shoppingList} />
        </Card>

        {/* Before You Spend Money */}
        <Card>
          <SectionTitle>Before You Spend Money</SectionTitle>
          <Bullets items={r.warnings} />
        </Card>

        {/* Final Recommendation */}
        <Card>
          <SectionTitle>Final Recommendation</SectionTitle>
          <Text style={typography.body}>{r.finalRecommendation}</Text>
        </Card>

        <Text style={styles.disclaimer}>{r.disclaimer}</Text>

        <View style={styles.actions}>
          <PrimaryButton label="Save Report" onPress={onSave} loading={saving} />
          <PrimaryButton label="Share Report" variant="secondary" onPress={onShare} loading={sharing} />
          <PrimaryButton label="Start Another Room" variant="secondary" onPress={onStartAnother} />

          <View style={styles.contactCard}>
            <Text style={typography.h3}>Want help deciding what is worth doing before you list?</Text>
            <PrimaryButton
              label="Contact Toby"
              onPress={() => navigation.navigate("LeadCapture")}
              style={{ marginTop: spacing.md }}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  subtitle: {
    ...typography.body,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  observationSpacing: { marginTop: spacing.md },
  levelBlock: {
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  levelHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  levelCost: { ...typography.bodyStrong, color: colors.primary },
  levelSubhead: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.textDark,
    marginTop: spacing.sm,
    marginBottom: 2,
  },
  bulletList: { gap: 2 },
  bulletRow: { flexDirection: "row", gap: 6 },
  bulletDot: { ...typography.body, color: colors.primary },
  bulletText: { flex: 1 },
  checklistItem: {
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  checklistHeaderRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: 2 },
  checklistNumber: {
    ...typography.bodyStrong,
    color: colors.primary,
    width: 20,
  },
  checklistMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  checklistCost: { ...typography.caption, marginLeft: "auto" },
  badge: {
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 12, fontWeight: "700" },
  disclaimer: {
    ...typography.caption,
    textAlign: "center",
    marginVertical: spacing.lg,
  },
  actions: { gap: spacing.sm },
  contactCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.accent,
    borderRadius: radii.md,
  },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md, padding: spacing.lg },
});
