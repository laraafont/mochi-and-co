import { getPetImageSource } from "@/constants/PetAssets";
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

function isAdoptedStatus(status?: string | null) {
  return status === "adopted" || status === "rehomed";
}

type PetWithAdopter = {
  id: string;
  status?: string | null;
  adopted_by_user_id?: string | null;
  adopted_by?: {
    display_name?: string | null;
  } | null;
};

type MainView = "rehoming" | "adopting";
type RehomingFilter = "current" | "rehomed";
type AdoptingFilter = "interested" | "adopted";

export default function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [pets, setPets] = useState<PetWithAdopter[]>([]);
  const [mainView, setMainView] = useState<MainView>("rehoming");
  const [rehomingFilter, setRehomingFilter] =
    useState<RehomingFilter>("current");
  const [adoptingFilter, setAdoptingFilter] =
    useState<AdoptingFilter>("interested");

  useEffect(() => {
    async function fetchUserData() {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      // fetch display name
      const { data: profile } = await supabase
        .from("users")
        .select("display_name")
        .eq("id", user.id)
        .single();
      if (profile) setDisplayName(profile.display_name);

      // fetch pets based on top-level view
      if (mainView === "adopting") {
        const { data: interestData, error: interestError } = await supabase
          .from("pet_interests")
          .select("pet_id")
          .eq("user_id", user.id);

        if (interestError) {
          console.log("Error fetching interested pets:", interestError);
          setPets([]);
          setLoading(false);
          return;
        }

        const interestedPetIds =
          interestData?.map((interest) => interest.pet_id) || [];

        const { data: interestedPets, error: interestPetsError } =
          interestedPetIds.length
            ? await supabase
                .from("pets")
                .select("*, adopted_by:adopted_by_user_id(display_name)")
                .in("id", interestedPetIds)
            : { data: [], error: null };

        if (interestPetsError) {
          console.log("Error fetching interested pets:", interestPetsError);
          setPets([]);
          setLoading(false);
          return;
        }

        const { data: adoptedPets, error: adoptedPetsError } = await supabase
          .from("pets")
          .select("*, adopted_by:adopted_by_user_id(display_name)")
          .eq("adopted_by_user_id", user.id);

        if (adoptedPetsError) {
          console.log("Error fetching adopted pets:", adoptedPetsError);
          setPets([]);
        } else {
          const combinedPets = [...(interestedPets || []), ...(adoptedPets || [])];
          const uniquePets = Array.from(
            new Map(
              combinedPets.map((pet) => [pet.id, pet as PetWithAdopter])
            ).values()
          );

          setPets(uniquePets);
        }
      } else {
        const { data: petData, error: petError } = await supabase
          .from("pets")
          .select("*, adopted_by:adopted_by_user_id(display_name)")
          .eq("creator_id", user.id);

        if (petError) {
          console.log("Error fetching pets:", petError);
          setPets([]);
        } else {
          setPets(petData || []);
        }
      }
      setLoading(false);
    }

    fetchUserData();
  }, [mainView]); // re-fetch when the toggle flips

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
  const renderPetItem = ({ item }: { item: PetWithAdopter & any }) => {
    const adoptedByName =
      (item as PetWithAdopter)?.adopted_by?.display_name ?? "Unknown adopter";

    return (
      <TouchableOpacity
        style={styles.petCard}
        onPress={() => router.push(`/pet/${item.id}`)} // This points to app/pet/[id].tsx
        activeOpacity={0.7}
      >
        <View style={styles.imageBox}>
          <Image
            source={getPetImageSource(item)}
            style={styles.fullImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.petInfo}>
          <Text style={styles.petName}>{item.name}</Text>
          <Text style={styles.petSubtext}>{item.breed || item.species}</Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textPrimary}
          style={{ marginLeft: "auto" }}
        />

        {isAdoptedStatus(item.status) && (
          <View style={styles.adoptedOverlay}>
            <Text style={styles.adoptedOverlayText}>ADOPTED</Text>
            <Text style={styles.adoptedOverlaySubtext}>by: {adoptedByName}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const filteredPets = pets.filter((pet) => {
    if (mainView === "rehoming") {
      return rehomingFilter === "current"
        ? !isAdoptedStatus(pet.status)
        : isAdoptedStatus(pet.status);
    }

    return adoptingFilter === "interested"
      ? !isAdoptedStatus(pet.status)
      : pet.adopted_by_user_id === userId;
  });

  const emptyMessage =
    mainView === "rehoming"
      ? rehomingFilter === "current"
        ? "you haven't listed any pets that are still up for rehoming"
        : "you haven't rehomed any pets yet"
      : adoptingFilter === "interested"
      ? "no pets found in your interested list"
      : "you haven't adopted any pets yet";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.title}>my profile</Text>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={loading}
          >
            <Ionicons
              name="log-out-outline"
              size={22}
              color={colors.primary}
            />
            <Text style={styles.logoutText}>log out</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.userName}>hi, {displayName || "user"}</Text>
      </View>

      {/* Rehoming vs Adopting Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            mainView === "rehoming" && styles.activeToggle,
          ]}
          onPress={() => setMainView("rehoming")}
        >
          <Text
            style={[
              styles.toggleText,
              mainView === "rehoming" && styles.activeToggleText,
            ]}
          >
            rehoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            mainView === "adopting" && styles.activeToggle,
          ]}
          onPress={() => setMainView("adopting")}
        >
          <Text
            style={[
              styles.toggleText,
              mainView === "adopting" && styles.activeToggleText,
            ]}
          >
            adopting
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.subToggleContainer}>
        {mainView === "rehoming" ? (
          <>
            <TouchableOpacity
              style={[
                styles.subToggleButton,
                rehomingFilter === "current" && styles.activeSubToggle,
              ]}
              onPress={() => setRehomingFilter("current")}
            >
              <Text
                style={[
                  styles.subToggleText,
                  rehomingFilter === "current" && styles.activeSubToggleText,
                ]}
              >
                current
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.subToggleButton,
                rehomingFilter === "rehomed" && styles.activeSubToggle,
              ]}
              onPress={() => setRehomingFilter("rehomed")}
            >
              <Text
                style={[
                  styles.subToggleText,
                  rehomingFilter === "rehomed" && styles.activeSubToggleText,
                ]}
              >
                rehomed
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[
                styles.subToggleButton,
                adoptingFilter === "interested" && styles.activeSubToggle,
              ]}
              onPress={() => setAdoptingFilter("interested")}
            >
              <Text
                style={[
                  styles.subToggleText,
                  adoptingFilter === "interested" && styles.activeSubToggleText,
                ]}
              >
                interested
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.subToggleButton,
                adoptingFilter === "adopted" && styles.activeSubToggle,
              ]}
              onPress={() => setAdoptingFilter("adopted")}
            >
              <Text
                style={[
                  styles.subToggleText,
                  adoptingFilter === "adopted" && styles.activeSubToggleText,
                ]}
              >
                adopted
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={filteredPets}
          keyExtractor={(item) => item.id}
          renderItem={renderPetItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>{emptyMessage}</Text>
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
  header: { marginTop: 40, marginBottom: spacing.md, gap: spacing.xs },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
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
  subToggleContainer: {
    flexDirection: "row",
    alignSelf: "center",
    backgroundColor: "rgba(111, 77, 56, 0.12)",
    borderRadius: 20,
    padding: 4,
    marginBottom: spacing.md,
  },
  subToggleButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: 16,
  },
  activeSubToggle: {
    backgroundColor: colors.primary,
  },
  subToggleText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xs,
    color: colors.primary,
  },
  activeSubToggleText: {
    color: colors.textPrimary,
  },

  listContent: { paddingBottom: spacing.xl },
  petCard: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 15,
    marginBottom: spacing.sm,
    gap: spacing.md,
    overflow: "hidden",
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
  adoptedOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(111, 77, 56, 0.88)",
    justifyContent: "center",
    alignItems: "center",
  },
  adoptedOverlayText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  adoptedOverlaySubtext: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textPrimary,
    marginTop: 4,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    fontFamily: fonts.regular,
    color: colors.primary,
    opacity: 0.5,
  },

  footer: { marginTop: 20 },
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
    paddingVertical: spacing.xs,
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
