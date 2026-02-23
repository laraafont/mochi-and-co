import FilterSidebar from "@/components/FilterSidebar";
import { usePetFilters } from "@/hooks/use-pet-filters";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import PetCard from "../../components/PetCard";
import { supabase } from "../../lib/supabase";
import { colors, fonts, fontSizes, spacing } from "../../theme";

// main screen component for browse tab
export default function BrowseScreen() {
  // create state variaable called pets
  // pets = current value
  // setPets = function to update it
  // initial value is empty array
  const [pets, setPets] = useState<any[]>([]);

  // a boolean to show or hide the sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const router = useRouter();

  // connect the hook, pass it pets array from supabase
  // we get back filteredPets, which is the list that shrinks as the user picks filters
  const { filters, setFilters, filteredPets } = usePetFilters(pets);

  // useEffect runs after component mounts
  // empty dependency array [] means:
  // run only once when screen loads
  useEffect(() => {
    fetchPets();
  }, []);

  async function fetchPets() {
    const { data, error } = await supabase
      .from("pets")
      .select("*")
      .eq("status", "active");

    // if database returns error
    if (error) {
      console.log("Error fetching pets:", error);
    } else {
      // if successful:
      // update state with return data
      // data could be null, so fallback to []
      setPets(data || []);
    }
  }

  // render UI
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* search bar: when onPress -> isSidebarOpen: true */}
      <TouchableOpacity
        style={styles.searchBarTrigger}
        onPress={() => setIsSidebarOpen(true)}
      >
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <Text style={styles.searchPlaceholder}>find your purrfect pet</Text>
      </TouchableOpacity>

      {/* scrollview allows vertical scrolling if many pets exist
      contentcontainerstyle styles the inside content */}
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: spacing.lg }}
      >
        {/*
          pets.map loops over each pet in array
          for each pet, render a PetCard component
        */}
        {filteredPets.map((pet) => (
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
        ))}
      </ScrollView>

      {/* sidebar component:
      we pass 'isVisible' so it knows when to pop up
      onClose lets the sidebar tell this file to close it
      filters and setFilters connect sidebar UI to hook logic */}
      <FilterSidebar
        isVisible={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        filters={filters}
        setFilters={setFilters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchBarTrigger: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    margin: spacing.lg,
    padding: spacing.md,
    borderRadius: 25,
    gap: 10,
  },
  searchPlaceholder: {
    color: colors.textPrimary,
    fontSize: fontSizes.xs,
    fontFamily: fonts.regular,
  },
});
