import React, { useState } from "react";
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { PrimaryButton } from "../components/PrimaryButton";
import { SelectableCard } from "../components/SelectableCard";
import { colors, radii, spacing, typography } from "../theme/theme";
import { usePlanning } from "../state/PlanningContext";
import { ROOM_TYPES, RoomType } from "../types/domain";

type Props = NativeStackScreenProps<RootStackParamList, "RoomConfirmation">;

export function RoomConfirmationScreen({ navigation }: Props) {
  const { photoUri, detectedRoomType, confirmRoomType } = usePlanning();
  const [changingRoom, setChangingRoom] = useState(false);
  const [selected, setSelected] = useState<RoomType | null>(detectedRoomType);
  const [saving, setSaving] = useState(false);

  const roomLabel = detectedRoomType || "room";

  async function confirm(roomType: RoomType) {
    setSaving(true);
    try {
      await confirmRoomType(roomType);
      navigation.replace("ProjectGoal");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {photoUri ? (
          <View style={styles.imageWrap}>
            <Image source={{ uri: photoUri }} style={styles.image} resizeMode="cover" />
          </View>
        ) : null}

        {!changingRoom ? (
          <>
            <Text style={typography.h2}>
              We think this is a {roomLabel}. Is that right?
            </Text>
            <View style={styles.buttonGroup}>
              <PrimaryButton
                label="Yes, Continue"
                loading={saving}
                onPress={() => detectedRoomType && confirm(detectedRoomType)}
                disabled={!detectedRoomType}
              />
              <PrimaryButton label="Change Room Type" variant="secondary" onPress={() => setChangingRoom(true)} />
            </View>
          </>
        ) : (
          <>
            <Text style={typography.h2}>What type of room is this?</Text>
            <View style={styles.list}>
              {ROOM_TYPES.map((type) => (
                <SelectableCard
                  key={type}
                  title={type}
                  description=""
                  selected={selected === type}
                  onPress={() => setSelected(type)}
                />
              ))}
            </View>
            <PrimaryButton
              label="Confirm Room Type"
              loading={saving}
              disabled={!selected}
              onPress={() => selected && confirm(selected)}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  imageWrap: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: colors.accent,
  },
  image: { width: "100%", height: "100%" },
  buttonGroup: { gap: spacing.sm },
  list: { gap: 0 },
});
