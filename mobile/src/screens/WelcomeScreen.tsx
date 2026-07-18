import React, { useState } from "react";
import {
  Alert,
  Image,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { PrimaryButton } from "../components/PrimaryButton";
import { colors, radii, spacing, typography } from "../theme/theme";
import { devError, devLog } from "../utils/log";

type Props = NativeStackScreenProps<RootStackParamList, "Welcome">;

const SAMPLE_IMAGE_URI =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80";

export function WelcomeScreen({ navigation }: Props) {
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [pickerError, setPickerError] = useState<string | null>(null);

  async function pickFromCamera() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    devLog("camera permission", permission);
    if (!permission.granted) {
      setPickerError("Camera access is needed to take a photo. You can enable it in Settings.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 1,
      exif: false,
    });
    devLog("image picker result (camera)", result);
    handlePickerResult(result);
  }

  async function pickFromLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    devLog("media library permission", permission);
    if (!permission.granted) {
      setPickerError("Photo library access is needed to choose a photo. You can enable it in Settings.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
      exif: false,
    });
    devLog("image picker result (library)", result);
    handlePickerResult(result);
  }

  function handlePickerResult(result: ImagePicker.ImagePickerResult) {
    if (result.canceled || !result.assets || result.assets.length === 0) return;
    const picked = result.assets[0];
    devLog("selected asset metadata", picked);

    if (!picked.uri || !picked.width || !picked.height) {
      setPickerError("That photo could not be prepared. Please try another image.");
      return;
    }

    setPickerError(null);
    setPreviewUri(picked.uri);
    navigation.navigate("Processing", {
      mode: "photo",
      asset: { uri: picked.uri, width: picked.width, height: picked.height },
    });
  }

  function onStartPress() {
    setPickerError(null);
    const options = ["Take a Photo", "Choose From Library", "Cancel"];
    Alert.alert("Add a room photo", undefined, [
      { text: options[0], onPress: pickFromCamera },
      { text: options[1], onPress: pickFromLibrary },
      { text: options[2], style: "cancel" },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View>
          <Text style={typography.h1}>Renovation Advisor</Text>
          <Text style={styles.subheading}>See what&apos;s possible. Before you spend a dollar.</Text>
        </View>

        <View style={styles.imageWrap}>
          <Image
            source={{ uri: previewUri || SAMPLE_IMAGE_URI }}
            style={styles.image}
            resizeMode="cover"
            onError={(e) => devError("welcome sample image failed to load", e.nativeEvent)}
          />
        </View>

        {pickerError ? <Text style={styles.errorText}>{pickerError}</Text> : null}

        <View style={styles.footer}>
          <PrimaryButton label="Start With a Photo" onPress={onStartPress} />
          <Text style={styles.disclaimerText}>
            For homeowners, buyers, sellers, agents, and investors — a quick, practical look at renovation
            potential.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.select({ ios: spacing.md, default: spacing.lg }),
    paddingBottom: spacing.lg,
    justifyContent: "space-between",
  },
  subheading: {
    ...typography.body,
    marginTop: spacing.sm,
    fontSize: 17,
  },
  imageWrap: {
    flex: 1,
    marginVertical: spacing.lg,
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: colors.accent,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  footer: {
    gap: spacing.sm,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  disclaimerText: {
    ...typography.caption,
    textAlign: "center",
  },
});
