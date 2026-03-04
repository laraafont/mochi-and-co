import { getPetImage } from "@/constants/PetAssets";
import React from "react"; // import react because we are creating a react component
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, fonts, fontSizes } from "../theme";

// typescript type definition for props
// this describes what data this component expects to receive
type PetCardProps = {
  pet: {
    id: string; // unique ID from database (used as React key)
    name: string;
    species: string;
    age_years: number;
    breed: string;
    size: string;
  };
  onPress?: () => void; // optional function (when card is tapped)
};

// this is a functional react component
// it receives props and returns UI
export default function PetCard({ pet, onPress }: PetCardProps) {
  return (
    // touchableopacity makes the entire card clickable
    // onPress runs the function passed from parent
    <TouchableOpacity onPress={onPress} style={styles.card}>
      {/* photo section */}
      <View style={styles.imageContainer}>
        <Image
          source={getPetImage(pet.name)}
          style={styles.petPhoto}
          resizeMode="cover"
        />
      </View>

      {/* display pet name */}
      <Text style={styles.name}>{pet.name}</Text>

      {/* display species and age */}
      <Text style={styles.details}>
        {pet.species} • {pet.age_years} years old {"\n"}
        {pet.breed} • {pet.gender}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // styling for the outer card container
  card: {
    backgroundColor: colors.primary,
    padding: 16, // internal spacing
    borderRadius: 16, // rounded corners
    marginBottom: 16, // space between cards
  },
  // styling for pet name
  name: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
  // styling for secondary details text
  details: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.textPrimary,
    marginTop: 4,
  },
  imageContainer: {
    height: 150,
    width: "100%",
    backgroundColor: "#D1C4B2",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
  },
  petPhoto: { width: "100%", height: "100%" },
});
