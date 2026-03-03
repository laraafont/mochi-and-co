import { colors, fonts, fontSizes, spacing } from "@/theme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>messages</Text>
        <Text style={styles.addSubtext}>coming soon</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  header: { marginTop: 40, marginBottom: spacing.xl },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl,
    color: colors.primary,
  },
  addSubtext: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.primary,
    opacity: 0.7,
  },
});
