import { getPetImageSource } from "@/constants/PetAssets";
import { supabase } from "@/lib/supabase";
import { colors, fonts, fontSizes, spacing } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ListRenderItem,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
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

type ProfileTab = "current" | "rehomed" | "interested" | "adopted";

type ProfileTabItem = {
  id: ProfileTab;
  label: string;
  section: "rehoming" | "adopting";
};

const profileTabs: ProfileTabItem[] = [
  { id: "current", label: "current", section: "rehoming" },
  { id: "rehomed", label: "rehomed", section: "rehoming" },
  { id: "interested", label: "interested", section: "adopting" },
  { id: "adopted", label: "adopted", section: "adopting" },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const pageWidth = windowWidth - spacing.lg * 2;
  const pagerRef = useRef<FlatList<ProfileTabItem>>(null);
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [rehomingPets, setRehomingPets] = useState<PetWithAdopter[]>([]);
  const [adoptingPets, setAdoptingPets] = useState<PetWithAdopter[]>([]);
  const [activeTab, setActiveTab] = useState<ProfileTab>("current");

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

      const { data: listedPets, error: listedPetsError } = await supabase
        .from("pets")
        .select("*, adopted_by:adopted_by_user_id(display_name)")
        .eq("creator_id", user.id);

      if (listedPetsError) {
        console.log("Error fetching listed pets:", listedPetsError);
        setRehomingPets([]);
        setAdoptingPets([]);
        setLoading(false);
        return;
      }

      setRehomingPets((listedPets || []) as PetWithAdopter[]);

      const { data: interestData, error: interestError } = await supabase
        .from("pet_interests")
        .select("pet_id")
        .eq("user_id", user.id);

      if (interestError) {
        console.log("Error fetching interested pets:", interestError);
        setAdoptingPets([]);
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
        setAdoptingPets([]);
        setLoading(false);
        return;
      }

      const { data: adoptedPets, error: adoptedPetsError } = await supabase
        .from("pets")
        .select("*, adopted_by:adopted_by_user_id(display_name)")
        .eq("adopted_by_user_id", user.id);

      if (adoptedPetsError) {
        console.log("Error fetching adopted pets:", adoptedPetsError);
        setAdoptingPets([]);
      } else {
        const combinedPets = [
          ...(interestedPets || []),
          ...(adoptedPets || []),
        ];
        const uniquePets = Array.from(
          new Map(
            combinedPets.map((pet) => [pet.id, pet as PetWithAdopter]),
          ).values(),
        );

        setAdoptingPets(uniquePets);
      }

      setLoading(false);
    }

    fetchUserData();
  }, []);

  useEffect(() => {
    const activeIndex = profileTabs.findIndex((tab) => tab.id === activeTab);
    if (activeIndex === -1) return;

    pagerRef.current?.scrollToOffset({
      offset: activeIndex * pageWidth,
      animated: false,
    });
  }, [activeTab, pageWidth]);

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
            <Text style={styles.adoptedOverlaySubtext}>
              by: {adoptedByName}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const tabContent: Record<
    ProfileTab,
    { pets: PetWithAdopter[]; emptyMessage: string }
  > = {
    current: {
      pets: rehomingPets.filter((pet) => !isAdoptedStatus(pet.status)),
      emptyMessage:
        "you haven't listed any pets that are still up for rehoming",
    },
    rehomed: {
      pets: rehomingPets.filter((pet) => isAdoptedStatus(pet.status)),
      emptyMessage: "you haven't rehomed any pets yet",
    },
    interested: {
      pets: adoptingPets.filter((pet) => !isAdoptedStatus(pet.status)),
      emptyMessage: "no pets found in your interested list",
    },
    adopted: {
      pets: adoptingPets.filter((pet) => pet.adopted_by_user_id === userId),
      emptyMessage: "you haven't adopted any pets yet",
    },
  };

  function scrollToTab(tabId: ProfileTab) {
    const tabIndex = profileTabs.findIndex((tab) => tab.id === tabId);
    if (tabIndex === -1) return;

    pagerRef.current?.scrollToIndex({ index: tabIndex, animated: true });
    setActiveTab(tabId);
  }

  function handlePagerMomentumEnd(
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
    const nextTab = profileTabs[nextIndex]?.id;

    if (nextTab && nextTab !== activeTab) {
      setActiveTab(nextTab);
    }
  }

  const renderTabPage: ListRenderItem<ProfileTabItem> = ({ item }) => {
    const { pets, emptyMessage } = tabContent[item.id];

    return (
      <View style={[styles.page, { width: pageWidth }]}>
        <FlatList
          data={pets}
          keyExtractor={(pet) => pet.id}
          renderItem={renderPetItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>{emptyMessage}</Text>
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  };

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
            <Ionicons name="log-out-outline" size={22} color={colors.primary} />
            <Text style={styles.logoutText}>log out</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.userName}>hi, {displayName || "user"}</Text>
      </View>

      <View style={styles.tabSection}>
        <View style={styles.tabSectionInner}>
          <View style={styles.sectionLabels}>
            <View style={styles.sectionLabelBlock}>
              <Text style={styles.sectionLabel}>rehoming</Text>
            </View>
            <View style={styles.sectionLabelBlock}>
              <Text style={styles.sectionLabel}>adopting</Text>
            </View>
          </View>

          <View style={styles.tabRailBackground}>
            <View style={styles.tabGrid}>
              {profileTabs.map((tab, index) => (
                <React.Fragment key={tab.id}>
                  <TouchableOpacity
                    style={[
                      styles.tabPill,
                      activeTab === tab.id && styles.activeTabPill,
                    ]}
                    onPress={() => scrollToTab(tab.id)}
                  >
                    <Text
                      style={[
                        styles.tabPillText,
                        activeTab === tab.id && styles.activeTabPillText,
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                  {index === 1 && <View style={styles.tabDivider} />}
                </React.Fragment>
              ))}
            </View>
          </View>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />
      ) : (
        <View style={styles.pagerSection}>
          <FlatList
            ref={pagerRef}
            data={profileTabs}
            keyExtractor={(item) => item.id}
            renderItem={renderTabPage}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handlePagerMomentumEnd}
            getItemLayout={(_, index) => ({
              length: pageWidth,
              offset: pageWidth * index,
              index,
            })}
          />
          <View style={styles.paginationDots}>
            {profileTabs.map((tab) => (
              <View
                key={tab.id}
                style={[
                  styles.paginationDot,
                  activeTab === tab.id && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>
        </View>
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

  tabSection: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  tabSectionInner: {
    backgroundColor: colors.primary,
    borderRadius: 28,
    padding: spacing.md,
  },
  sectionLabels: {
    flexDirection: "row",
    marginBottom: spacing.sm,
  },
  sectionLabelBlock: {
    flex: 1,
    alignItems: "center",
  },
  sectionLabel: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
  tabRailBackground: {
    backgroundColor: colors.background,
    borderRadius: 999,
    padding: spacing.xs,
  },
  tabGrid: {
    flexDirection: "row",
    alignItems: "center",
  },
  tabPill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 0,
    paddingVertical: spacing.sm + 2,
    borderRadius: 999,
    backgroundColor: "#E6D8C8",
    paddingHorizontal: spacing.sm,
    marginRight: spacing.xs,
  },
  tabDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: "rgba(111, 77, 56, 0.22)",
    marginHorizontal: spacing.sm,
  },
  activeTabPill: {
    backgroundColor: colors.primary,
  },
  tabPillText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: "#6F4D38",
  },
  activeTabPillText: {
    color: "#E6D8C8",
  },

  listContent: { paddingBottom: spacing.xl },
  pagerSection: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  paginationDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  paginationDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "rgba(111, 77, 56, 0.22)",
  },
  paginationDotActive: {
    width: 18,
    backgroundColor: "rgba(111, 77, 56, 0.5)",
  },
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
