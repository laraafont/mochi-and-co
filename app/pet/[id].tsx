import React, { useEffect, useState } from "react";
// this hook gives us access to dynamic route paramters, so [id]
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
// import supabase client to fetch the pet by ID
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { colors, fonts, fontSizes, spacing } from "../../theme";

// this component represents one individual pet profile page
export default function PetProfileScreen() {
  // extract the dunamic parameter from the URL
  // useLocalSearchParams returns an object containing all dynamic route parameters
  // because this file is [id].tsx, expo router provides { id } automatically
  const { id } = useLocalSearchParams();

  const router = useRouter();

  // state to hold the pet object
  // pet = current state value
  // setPet = function to update state
  // initial value is null because we haven't fetched yet
  const [pet, setPet] = useState<any>(null);

  // state to manage loading spinner
  // stores whether we are still loading
  // starts as true because we haven't fetched yet
  const [loading, setLoading] = useState(true);

  // useEffect runs after component renders
  // takes two arguments:
  // 1. a function to run
  // 2. a dependency array

  // dependency array -> "only re-run this effect if these values change"
  // we include [id] because -> if the route id changes, we should re-fetch that pet
  useEffect(() => {
    // async: this function uses "await" inside it
    async function fetchPet() {
      const { data, error } = await supabase
        .from("pets")
        .select("*")
        .eq("id", id)
        .single(); // supabase returns only one object

      // if there's an error, log it
      if (error) {
        console.log("Error fetching pet: ", error);
      } else {
        // update state with returned pet object
        setPet(data);
      }

      // stop loading spinner
      setLoading(false);
    }
    // only fetch if id exists
    if (id) {
      fetchPet();
    }
  }, [id]); // <-- dependency array

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
      <View style={styles.center}>
        <Text>Pet not found.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        {/* top navigation row */}
        <View style={styles.topRow}>
          {/* back button */}
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.icon}>←</Text>
          </TouchableOpacity>

          {/* favorite icon */}
          <Text style={styles.icon}>♡</Text>
        </View>

        {/* pet name pill */}
        <View style={styles.namePill}>
          <Text style={styles.nameText}>{pet.name}</Text>
        </View>

        {/* image placeholder box */}
        <View style={styles.imageBox}>
          <Text style={{ color: colors.textSecondary }}>image placeholder</Text>
        </View>

        {/* divider */}
        <View style={styles.divider} />

        {/* bio + info row */}
        <View style={styles.infoRow}>
          {/* bio card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{pet.name}&apos; bio</Text>
            <Text style={styles.cardText}>{pet.bio}</Text>
          </View>

          {/* info card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{pet.name}&apos; info</Text>
            <Text style={styles.cardText}>• {pet.species}</Text>
            <Text style={styles.cardText}>• {pet.gender}</Text>
            <Text style={styles.cardText}>• {pet.age_years} years</Text>
            <Text style={styles.cardText}>• {pet.breed}</Text>
            {pet.neutered_spayed && (
              <Text style={styles.cardText}>• neutered/spayed</Text>
            )}

            {pet.hypoallergenic && (
              <Text style={styles.cardText}>• hypoallergenic</Text>
            )}

            {pet.compatible_with_kids && (
              <Text style={styles.cardText}>• good with kids</Text>
            )}

            {pet.compatible_with_dogs && (
              <Text style={styles.cardText}>• good with dogs</Text>
            )}

            {pet.compatible_with_cats && (
              <Text style={styles.cardText}>• good with cats</Text>
            )}
          </View>
        </View>

        {/* divider */}
        <View style={styles.divider} />

        {/* buttons row */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>message rehomer</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>apply to adopt</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },

  icon: {
    fontSize: 24,
    color: colors.primary,
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

  divider: {
    height: 2,
    backgroundColor: colors.primary,
    marginVertical: spacing.md,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  card: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 16,
    marginHorizontal: 4,
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
  },

  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 20,
    alignItems: "center",
    marginLeft: 8,
  },

  primaryButtonText: {
    color: colors.textSecondary,
    fontFamily: fonts.semiBold,
  },
});
