import { getPetImage } from "@/constants/PetAssets";
import { supabase } from "@/lib/supabase";
import { colors, fonts, fontSizes, spacing } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [pets, setPets] = useState<any[]>([]);
  const [isAdoptingView, setIsAdoptingView] = useState(false);

  useEffect(() => {
    async function fetchUserData() {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // fetch display name
      const { data: profile } = await supabase
        .from("users")
        .select("display_name")
        .eq("id", user.id)
        .single();
      if (profile) setDisplayName(profile.display_name);

      // fetch pets based on toggle
      let query = supabase.from("pets").select("*");
      if (isAdoptingView) {
        query = query.eq("adopter_id", user.id);
      } else {
        query = query.eq("creator_id", user.id);
      }

      const { data: petData } = await query;
      setPets(petData || []);
      setLoading(false);
    }

    fetchUserData();
  }, [isAdoptingView]); // re-fetch when the toggle flips

  async function handleLogout() {
    setLoading(true);
    const { error } = await supabase.auth.signOut();

    if (error) {
      Alert.alert("Error logging out", error.message);
      setLoading(false);
    }
    // no need for router.push -> layout.tsx will see null session and auto take to login page
  }

  // individual item of pet list styling
  const renderPetItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.petCard}
      onPress={() => router.push(`/pet/${item.id}`)} // This points to app/pet/[id].tsx
      activeOpacity={0.7}
    >
      <View style={styles.imageBox}>
        <Image
          source={getPetImage(item.name)}
          style={styles.fullImage}
          resizeMode="cover"
        />
      </View>

      <View style={styles.petInfo}>
        <Text style={styles.petName}>{item.name}</Text>
        <Text style={styles.petSubtext}>{item.breed || item.species}</Text>
      </View>

      {item.status === "rehomed" && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>REHOMED</Text>
        </View>
      )}

      <Ionicons
        name="chevron-forward"
        size={20}
        color={colors.textPrimary}
        style={{ marginLeft: "auto" }}
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>my profile</Text>
        <Text style={styles.userName}>hi, {displayName || "user"}</Text>
      </View>

      {/* Rehoming vs Adopting Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, !isAdoptingView && styles.activeToggle]}
          onPress={() => setIsAdoptingView(false)}
        >
          <Text
            style={[
              styles.toggleText,
              !isAdoptingView && styles.activeToggleText,
            ]}
          >
            rehoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, isAdoptingView && styles.activeToggle]}
          onPress={() => setIsAdoptingView(true)}
        >
          <Text
            style={[
              styles.toggleText,
              isAdoptingView && styles.activeToggleText,
            ]}
          >
            adopting
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={pets}
          keyExtractor={(item) => item.id}
          renderItem={renderPetItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {isAdoptingView
                ? "no pets found in your adoption list"
                : "you haven't listed any pets for rehoming"}
            </Text>
          }
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/add-pet")}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="add" size={30} color={colors.background} />
          </View>
          <View>
            <Text style={styles.addText}>add a new pet</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={loading}
        >
          <Ionicons name="log-out-outline" size={24} color={colors.primary} />
          <Text style={styles.logoutText}>log out</Text>
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
  header: { marginTop: 40, marginBottom: spacing.md },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl,
    color: colors.primary,
  },
  userName: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.primary,
    opacity: 0.8,
  },

  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#D1C4B5",
    borderRadius: 25,
    padding: 4,
    marginVertical: spacing.md,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 21,
  },
  activeToggle: { backgroundColor: colors.primary },
  toggleText: { fontFamily: fonts.bold, color: colors.primary },
  activeToggleText: { color: colors.textPrimary },

  listContent: { paddingBottom: spacing.xl },
  petCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 15,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  petIconPlaceholder: {
    width: 45,
    height: 45,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  petInfo: {
    flex: 1,
    justifyContent: "center",
    marginLeft: spacing.md,
  },
  petName: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  petSubtext: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.textPrimary,
    opacity: 0.8,
  },
  badge: {
    marginLeft: "auto",
    backgroundColor: "#F9F4F0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  badgeText: { fontSize: 10, fontWeight: "bold", color: colors.primary },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    fontFamily: fonts.regular,
    color: colors.primary,
    opacity: 0.5,
  },

  footer: { marginTop: "auto" },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 20,
    gap: spacing.md,
  },
  iconCircle: {
    backgroundColor: colors.textPrimary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  addText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
    gap: spacing.sm,
  },
  logoutText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.primary,
  },
  imageBox: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#D1C4B5",
  },
  fullImage: {
    width: "100%",
    height: "100%",
  },
});
