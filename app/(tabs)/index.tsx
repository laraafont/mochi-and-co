import { getPetImageSource } from "@/constants/PetAssets";
import { supabase } from "@/lib/supabase";
import { colors, fonts, fontSizes, spacing } from "@/theme";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function HomeScreen() {
  const router = useRouter();
  const [recentPets, setRecentPets] = useState<any[]>([]);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // One useEffect to rule them all
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        await Promise.all([getProfile(), fetchRecentPets()]);
      } catch (error) {
        console.error("Error loading home data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  async function getProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("users")
        .select("display_name")
        .eq("id", user.id)
        .single();

      if (data) setDisplayName(data.display_name);
    }
  }

  async function fetchRecentPets() {
    const { data, error } = await supabase
      .from("pets")
      .select("id, name, breed, species, image_url")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) throw error;
    setRecentPets(data || []);
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator color="#6D4C3D" size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>hi, {displayName || "friend"}</Text>
        <Image
          source={require("@/assets/images/cocomascot.png")}
          style={styles.mascot}
          resizeMode="contain"
        />
      </View>

      {/* curved container */}
      <View style={styles.curveWrapper}>
        <View style={styles.darkSection}>
          <Text style={styles.sectionTitle}>recently posted</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.petScroll}
          >
            {loading ? (
              <ActivityIndicator color="#E6D8C1" />
            ) : (
              recentPets.map((pet) => (
                <TouchableOpacity
                  key={pet.id}
                  style={styles.petCard}
                  onPress={() => router.push(`/pet/${pet.id}`)}
                >
                  <View style={styles.imagePlaceholder}>
                    <Image
                      source={getPetImageSource(pet)}
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 10,
                      }}
                    />
                  </View>
                  <Text style={styles.petName} numberOfLines={1}>
                    {pet.name}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>

      {/* get started */}
      <View style={styles.footer}>
        <Text style={styles.footerTitle}>get started</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push("/(tabs)/browse")}
          >
            <Text style={styles.btnText}>find a pet</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push("/add-pet")}
          >
            <Text style={styles.btnText}>rehome</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: "center",
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  greeting: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl,
    color: colors.primary,
    marginBottom: 10,
  },
  mascot: {
    width: 150,
    height: 150,
  },
  curveWrapper: {
    backgroundColor: colors.primary,
  },
  darkSection: {
    backgroundColor: colors.primary,
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
    borderBottomRightRadius: 100,
    borderBottomLeftRadius: 100,
    paddingVertical: 30,
    minHeight: 250,
    marginHorizontal: -20,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    textAlign: "center",
    marginBottom: 20,
  },
  petScroll: {
    paddingHorizontal: 40,
    gap: 15,
  },
  petCard: {
    width: 110,
    height: 130,
    backgroundColor: "#E6D8C1",
    borderRadius: 15,
    padding: 10,
    alignItems: "center",
  },
  imagePlaceholder: {
    backgroundColor: "#D1C4B2",
    width: "100%",
    height: 80,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },
  placeholderIcon: { width: 30, height: 30, opacity: 0.3 },
  petName: { fontFamily: fonts.bold, color: colors.primary, fontSize: 12 },

  footer: { padding: 30, alignItems: "center" },
  footerTitle: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.primary,
    marginBottom: 20,
  },
  buttonRow: { flexDirection: "row", gap: 15, width: "100%" },
  actionBtn: {
    flex: 1,
    backgroundColor: "#A08E74",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
  },
  btnText: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: 16 },
});
