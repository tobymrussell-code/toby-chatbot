import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { PrimaryButton } from "../components/PrimaryButton";
import { colors, radii, spacing, typography } from "../theme/theme";
import { usePlanning } from "../state/PlanningContext";
import { api } from "../api/client";
import { devError } from "../utils/log";

type Props = NativeStackScreenProps<RootStackParamList, "LeadCapture">;

type Intent = "selling" | "buying" | "investing" | "improving";

const INTENTS: { value: Intent; label: string }[] = [
  { value: "selling", label: "Selling" },
  { value: "buying", label: "Buying" },
  { value: "investing", label: "Investing" },
  { value: "improving", label: "Improving" },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LeadCaptureScreen({ navigation }: Props) {
  const { planningSessionId } = usePlanning();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [intent, setIntent] = useState<Intent | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = EMAIL_PATTERN.test(email.trim());

  async function onSubmit() {
    if (!planningSessionId) return;
    if (!emailValid) {
      setError("Please enter a valid email so Toby can follow up.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await api.createLead({
        planningSessionId,
        name: name.trim() || undefined,
        email: email.trim(),
        phone: phone.trim() || undefined,
        propertyAddress: propertyAddress.trim() || undefined,
        intent: intent || undefined,
      });
      Alert.alert("Thanks!", "Toby will follow up with you soon.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      devError("lead submission failed", err);
      setError(err instanceof Error ? err.message : "We could not save that. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={typography.h2}>Get Local Advice</Text>
          <Text style={typography.body}>
            Share a few details and Toby will follow up to help you figure out what's actually worth doing.
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your name" />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Phone (optional)</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="(555) 555-5555"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Property address (optional)</Text>
            <TextInput
              style={styles.input}
              value={propertyAddress}
              onChangeText={setPropertyAddress}
              placeholder="123 Main St"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Are you selling, buying, investing, or improving?</Text>
            <View style={styles.intentRow}>
              {INTENTS.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => setIntent(option.value)}
                  style={[styles.intentChip, intent === option.value && styles.intentChipSelected]}
                >
                  <Text style={[styles.intentChipText, intent === option.value && styles.intentChipTextSelected]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton label="Send" onPress={onSubmit} loading={submitting} disabled={!email.trim()} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
  field: { gap: spacing.xs },
  label: { ...typography.bodyStrong },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textDark,
  },
  intentRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  intentChip: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  intentChipSelected: {
    borderColor: colors.primary,
    backgroundColor: "#EFF5F1",
  },
  intentChipText: { ...typography.body },
  intentChipTextSelected: { color: colors.primary, fontWeight: "700" },
  error: { ...typography.body, color: colors.error },
});
