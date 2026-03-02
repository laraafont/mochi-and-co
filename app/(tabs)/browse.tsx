import FilterSidebar from "@/components/FilterSidebar";
import { usePetFilters } from "@/hooks/use-pet-filters";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import PetCard from "../../components/PetCard";
import { supabase } from "../../lib/supabase";
import { colors, fonts, fontSizes, spacing } from "../../theme";

export default function BrowseScreen() {
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();

  const { filters, setFilters, filteredPets } = usePetFilters(pets);

  useEffect(() => {
    fetchPets();
  }, []);

  async function fetchPets() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("pets")
        .select("*")
        .eq("status", "active");

      if (error) throw error;
      setPets(data || []);
    } catch (error) {
      console.error("Error fetching pets:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* search bar */}
      <TouchableOpacity
        style={styles.searchBarTrigger}
        onPress={() => setIsSidebarOpen(true)}
      >
        <Ionicons name="search" size={20} color={colors.background} />
        <Text style={styles.searchPlaceholder}>find your purrfect pet</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.lg }}
        >
          {/* no results found */}
          {filteredPets.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="paw-outline"
                size={64}
                color={colors.primary}
                style={{ opacity: 0.3 }}
              />
              <Text style={styles.emptyText}>no pets match those filters.</Text>
              <TouchableOpacity
                onPress={() =>
                  setFilters({
                    type: null,
                    gender: null,
                    breed: null,
                    age_range: null,
                    neutered_spayed: null,
                    hypoallergenic: null,
                    compatible_with: null,
                  })
                }
              >
                <Text style={styles.clearFiltersLink}>clear all filters</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredPets.map((pet) => (
              <PetCard
                key={pet.id}
                pet={pet}
                onPress={() =>
                  router.push({
                    pathname: "/pet/[id]",
                    params: { id: pet.id },
                  })
                }
              />
            ))
          )}
        </ScrollView>
      )}

      <FilterSidebar
        isVisible={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        filters={filters}
        setFilters={setFilters}
        resultsCount={filteredPets.length}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  searchBarTrigger: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: 25,
    gap: 10,
  },
  searchPlaceholder: {
    color: colors.background,
    fontSize: fontSizes.md,
    fontFamily: fonts.regular,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 100,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.primary,
    marginTop: 20,
  },
  clearFiltersLink: {
    fontFamily: fonts.bold,
    color: colors.primary,
    textDecorationLine: "underline",
    marginTop: 10,
  },
});
