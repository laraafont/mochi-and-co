import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getPetImage } from "@/constants/PetAssets";
import { supabase } from "../../lib/supabase";
import { colors, fonts, fontSizes, spacing } from "../../theme";

type Applicant = {
  user_id: string;
  users?: {
    display_name?: string | null;
  } | null;
};

export default function PetProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [pet, setPet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [interestCount, setInterestCount] = useState(0);

  useEffect(() => {
    async function fetchPetAndStatus() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: petData, error: petError } = await supabase
        .from("pets")
        .select("*")
        .eq("id", id)
        .single();

      if (petError) {
        console.log("Error fetching pet:", petError);
        setLoading(false);
        return;
      }

      setPet(petData);

      const {
        data: interestData,
        count,
        error: interestError,
      } = await supabase
        .from("pet_interests")
        .select("user_id", { count: "exact" })
        .eq("pet_id", id);

      if (interestError) {
        console.log("Error fetching pet interests:", interestError);
      }

      const userIds = interestData?.map((interest) => interest.user_id) || [];
      let applicantsWithProfiles: Applicant[] =
        (interestData as Applicant[]) || [];

      if (userIds.length > 0) {
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, display_name")
          .in("id", userIds);

        if (userError) {
          console.log("Error fetching applicant profiles:", userError);
        } else {
          const userMap = new Map(
            (userData || []).map((profile) => [
              profile.id,
              profile.display_name,
            ]),
          );

          applicantsWithProfiles = userIds.map((userId) => ({
            user_id: userId,
            users: { display_name: userMap.get(userId) ?? null },
          }));
        }
      }

      setApplicants(applicantsWithProfiles);
      setInterestCount(count || 0);
      setIsOwner(Boolean(user && petData.creator_id === user.id));
      setIsLiked(
        Boolean(
          user &&
          interestData?.some((interest) => interest.user_id === user.id),
        ),
      );
      setLoading(false);
    }

    if (id) {
      fetchPetAndStatus();
    }
  }, [id]);

  async function toggleAdoption() {
    if (isOwner) {
      Alert.alert(
        "You cannot adopt a pet you listed for rehoming, they are yours!",
      );
      return;
    }

    setActionLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      Alert.alert("You must be logged in to begin adopting a pet!");
      setActionLoading(false);
      return;
    }

    const interestQuery = supabase.from("pet_interests");
    const { error } = isLiked
      ? await interestQuery.delete().eq("pet_id", id).eq("user_id", user.id)
      : await interestQuery.insert({ pet_id: id, user_id: user.id });

    if (error) {
      Alert.alert("Error", "Could not update adoption status.");
      setActionLoading(false);
      return;
    }

    setIsLiked(!isLiked);
    setInterestCount((currentCount) =>
      isLiked ? Math.max(0, currentCount - 1) : currentCount + 1,
    );
    setApplicants((currentApplicants) => {
      if (isLiked) {
        return currentApplicants.filter(
          (applicant) => applicant.user_id !== user.id,
        );
      }

      return [
        ...currentApplicants,
        {
          user_id: user.id,
          users: { display_name: user.user_metadata?.display_name ?? "You" },
        },
      ];
    });
    Alert.alert(
      !isLiked
        ? `Yay! ${pet?.name ?? "This pet"} is now in your 'Adopting' list.`
        : "Pet removed from your 'Adopting' list.",
    );
    setActionLoading(false);
  }

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </>
    );
  }

  if (!pet) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.center}>
          <Text>Pet not found.</Text>
        </View>
      </>
    );
  }

  const petDetails = [
    pet.species,
    pet.gender,
    pet.age_years ? `${pet.age_years} years` : null,
    pet.breed,
    pet.neutered_spayed ? "neutered/spayed" : null,
    pet.hypoallergenic ? "hypoallergenic" : null,
    pet.compatible_with_kids ? "good with kids" : null,
    pet.compatible_with_dogs ? "good with dogs" : null,
    pet.compatible_with_cats ? "good with cats" : null,
  ].filter(Boolean);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topRow}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={28} color={colors.primary} />
            </TouchableOpacity>

            {isOwner ? (
              <TouchableOpacity
                style={styles.badgeButton}
                onPress={() => setModalVisible(true)}
              >
                <Ionicons name="people" size={26} color={colors.primary} />
                {interestCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{interestCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={toggleAdoption}
                disabled={actionLoading}
              >
                <Ionicons
                  name={isLiked ? "heart" : "heart-outline"}
                  size={28}
                  color={isLiked ? "#FF6B6B" : colors.primary}
                />
              </TouchableOpacity>
            )}
          </View>

          <Modal
            animationType="slide"
            transparent
            visible={isModalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>interested adopters</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons
                      name="close"
                      size={24}
                      color={colors.textPrimary}
                    />
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={applicants}
                  keyExtractor={(item) => item.user_id}
                  ListEmptyComponent={
                    <Text style={styles.emptyApplicantsText}>
                      no one has expressed interest yet
                    </Text>
                  }
                  renderItem={({ item }) => (
                    <View style={styles.applicantItem}>
                      <View style={styles.avatarPill}>
                        <Text style={styles.avatarLetter}>
                          {item.users?.display_name?.charAt(0)?.toUpperCase() ??
                            "?"}
                        </Text>
                      </View>
                      <Text style={styles.applicantName}>
                        {item.users?.display_name ?? "Unknown user"}
                      </Text>
                      <TouchableOpacity style={styles.chatButton}>
                        <Text style={styles.chatButtonText}>
                          finalize adoption
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                />
              </View>
            </View>
          </Modal>

          <View style={styles.namePill}>
            <Text style={styles.nameText}>{pet.name}</Text>
          </View>

          <View style={styles.imageBox}>
            <Image
              source={getPetImage(pet.name)}
              style={styles.fullImage}
              resizeMode="cover"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{pet.name}&apos; bio</Text>
              <Text style={styles.cardText}>
                {pet.bio || "No bio has been added for this pet yet."}
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>{pet.name}&apos; info</Text>
              {petDetails.map((detail) => (
                <Text key={detail} style={styles.cardText}>
                  {"\u2022"} {detail}
                </Text>
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.buttonRow}>
            {isOwner ? (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => Alert.alert("Coming Soon!")}
              >
                <Text style={styles.primaryButtonText}>edit pet</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>message rehomer</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>apply to adopt</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },

  namePill: {
    alignSelf: "center",
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginBottom: spacing.lg,
  },

  nameText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl,
    color: colors.textPrimary,
  },

  imageBox: {
    height: 200,
    backgroundColor: colors.primary,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },

  fullImage: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
  },

  divider: {
    height: 2,
    backgroundColor: colors.primary,
    marginVertical: spacing.md,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },

  card: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 16,
  },

  cardTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    marginBottom: 8,
  },

  cardText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.textPrimary,
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },

  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 20,
    alignItems: "center",
  },

  primaryButtonText: {
    color: colors.textSecondary,
    fontFamily: fonts.semiBold,
  },

  badgeButton: {
    position: "relative",
    padding: 5,
  },

  badge: {
    position: "absolute",
    right: -5,
    top: -5,
    backgroundColor: "#FF6B6B",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  badgeText: {
    color: "white",
    fontSize: 12,
    fontFamily: fonts.bold,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },

  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    height: "50%",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.primary,
  },

  emptyApplicantsText: {
    textAlign: "center",
    color: colors.primary,
    fontFamily: fonts.regular,
    opacity: 0.7,
    marginTop: spacing.lg,
  },

  applicantItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 15,
    marginBottom: 10,
  },

  avatarPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },

  avatarLetter: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontSize: fontSizes.xs,
  },

  applicantName: {
    flex: 1,
    fontFamily: fonts.semiBold,
    color: colors.textPrimary,
    marginLeft: 12,
  },

  chatButton: {
    backgroundColor: colors.background,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },

  chatButtonText: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontSize: 12,
  },
});
