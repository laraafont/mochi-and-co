import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView } from "react-native";
import PetCard from "../../components/PetCard";
import { supabase } from "../../lib/supabase";
import { colors, spacing } from "../../theme";

// main screen component for browse tab
export default function BrowseScreen() {
  // create state variaable called pets
  // pets = current value
  // setPets = function to update it
  // initial value is empty array
  const [pets, setPets] = useState<any[]>([]);

  const router = useRouter();

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
    // scrollview allows vertical scrolling if many pets exist
    // contentcontainerstyle styles the inside content
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.lg }}
    >
      {/*
        pets.map loops over each pet in array
        for each pet, render a PetCard component
      */}
      {pets.map((pet) => (
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
  );
}
