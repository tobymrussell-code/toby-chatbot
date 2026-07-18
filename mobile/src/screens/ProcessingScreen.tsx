import React, { useCallback, useEffect } from "react";
import { ActivityIndicator, Image, SafeAreaView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { PrimaryButton } from "../components/PrimaryButton";
import { colors, radii, spacing, typography } from "../theme/theme";
import { usePlanning } from "../state/PlanningContext";

type Props = NativeStackScreenProps<RootStackParamList, "Processing">;

const PHOTO_MESSAGES: Record<string, string> = {
  preparing_photo: "Preparing your photo…",
  uploading: "Uploading your room…",
  processing: "Looking at layout, condition, and renovation potential…",
};

export function ProcessingScreen({ navigation, route }: Props) {
  const { mode, asset } = route.params;
  const planning = usePlanning();
  const { status, errorMessage, photoUri, submitPhoto, buildReport } = planning;

  const runPhotoFlow = useCallback(async () => {
    if (!asset) return;
    try {
      await submitPhoto(asset);
      navigation.replace("RoomConfirmation");
    } catch {
      // error surfaced via context status/errorMessage; screen shows retry UI
    }
  }, [asset, submitPhoto, navigation]);

  const runReportFlow = useCallback(async () => {
    try {
      await buildReport();
      navigation.replace("Report");
    } catch {
      // error surfaced via context status/errorMessage; screen shows retry UI
    }
  }, [buildReport, navigation]);

  useEffect(() => {
    if (mode === "photo") {
      runPhotoFlow();
    } else {
      runReportFlow();
    }
    // Only run once when the screen mounts for this particular photo/report attempt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isFailed = status === "failed";
  const message =
    mode === "photo"
      ? PHOTO_MESSAGES[status] || "Preparing your photo…"
      : "Building your renovation plan…";

  const isConnectionError = !!errorMessage && errorMessage.toLowerCase().includes("wi-fi");

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {photoUri ? (
          <View style={styles.imageWrap}>
            <Image source={{ uri: photoUri }} style={styles.image} resizeMode="cover" />
          </View>
        ) : null}

        {!isFailed ? (
          <View style={styles.statusWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.statusText}>{message}</Text>
          </View>
        ) : (
          <View style={styles.statusWrap}>
            <Text style={styles.errorTitle}>
              {isConnectionError
                ? "We could not reach the renovation server. Make sure your phone and computer are on the same Wi-Fi, then try again."
                : errorMessage || "We could not upload that photo. Check your connection and try again."}
            </Text>
            <View style={styles.buttonGroup}>
              <PrimaryButton
                label="Try Again"
                onPress={() => (mode === "photo" ? runPhotoFlow() : runReportFlow())}
              />
              <PrimaryButton
                label={mode === "photo" ? "Choose Another Photo" : "Start Over"}
                variant="secondary"
                onPress={() => navigation.popToTop()}
              />
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: "center",
  },
  imageWrap: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: colors.accent,
    marginBottom: spacing.xl,
  },
  image: { width: "100%", height: "100%" },
  statusWrap: {
    alignItems: "center",
    gap: spacing.md,
  },
  statusText: {
    ...typography.h3,
    textAlign: "center",
  },
  errorTitle: {
    ...typography.body,
    color: colors.error,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  buttonGroup: {
    width: "100%",
    gap: spacing.sm,
  },
});
