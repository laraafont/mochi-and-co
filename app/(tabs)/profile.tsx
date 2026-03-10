import { supabase } from "@/lib/supabase";
import { colors, fonts, fontSizes, spacing } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    const { error } = await supabase.auth.signOut();

    if (error) {
      Alert.alert("Error logging out", error.message);
      setLoading(false);
    }
    // no need for router.push -> layout.tsx will see null session and auto take to login page
  }
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>my profile</Text>
      </View>

      <View style={styles.menuContainer}>
        {/* add pet button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/add-pet")}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="add" size={30} color={colors.background} />
          </View>
          <View>
            <Text style={styles.addText}>add a new pet</Text>
            <Text style={styles.addSubtext}>find them a forever home</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.primary}
            style={{ marginLeft: "auto" }}
          />
        </TouchableOpacity>

        {/* logout button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <Ionicons
                name="log-out-outline"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.logoutText}>log out</Text>
            </>
          )}
        </TouchableOpacity>
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
  menuContainer: { gap: spacing.md },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.primary,
    gap: spacing.md,
  },
  iconCircle: {
    backgroundColor: colors.textPrimary,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  addText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  addSubtext: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.textPrimary,
    opacity: 0.7,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  logoutText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.primary,
  },
});
