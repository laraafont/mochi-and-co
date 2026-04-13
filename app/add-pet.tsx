import OptionSheet from "@/components/OptionSheet";
import { supabase } from "@/lib/supabase"; // Ensure this path matches your project structure
import { colors, fonts } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const PET_PHOTOS_BUCKET = "pet-photos";

type SelectedImage = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
};

export default function AddPetScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);

  const [form, setForm] = useState({
    name: "",
    species: "",
    gender: "",
    age: "",
    breed: "",
    bio: "",
    neutered: null as boolean | null,
    hypoallergenic: null as boolean | null,
    compatible_with: [] as string[],
    status: "active",
  });

  const [picker, setPicker] = useState({
    visible: false,
    title: "",
    key: "",
    options: [] as string[],
  });

  const openPicker = (title: string, key: string, options: string[]) => {
    setPicker({ visible: true, title, key, options });
  };

  const handleSelect = (val: string) => {
    if (picker.key === "neutered" || picker.key === "hypoallergenic") {
      setForm({ ...form, [picker.key]: val === "yes" });
    } else if (picker.key === "compatible_with") {
      const current = [...form.compatible_with];
      const index = current.indexOf(val);
      if (index > -1) {
        current.splice(index, 1);
      } else {
        current.push(val);
      }
      setForm({ ...form, compatible_with: current });
    } else {
      setForm({ ...form, [picker.key]: val });
    }
  };

  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission Needed",
          "Photo library access is required to upload a pet photo.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      setSelectedImage({
        uri: asset.uri,
        mimeType: asset.mimeType,
        fileName: asset.fileName,
      });
    } catch (error: any) {
      Alert.alert(
        "Image Error",
        error?.message || "Could not open the image picker.",
      );
    }
  };

  const getFileExtension = (image: SelectedImage, blobType?: string) => {
    const fromFileName = image.fileName?.split(".").pop()?.toLowerCase();
    if (fromFileName) return fromFileName;

    const mimeType = image.mimeType || blobType;
    if (mimeType?.includes("png")) return "png";
    if (mimeType?.includes("webp")) return "webp";
    return "jpg";
  };

  const uploadPetImage = async (userId: string) => {
    if (!selectedImage) return null;

    const response = await fetch(selectedImage.uri);
    if (!response.ok) {
      throw new Error("Could not read the selected image.");
    }

    const arrayBuffer = await response.arrayBuffer();
    const blobType = selectedImage.mimeType || "image/jpeg";
    const extension = getFileExtension(selectedImage, blobType);
    const safeName =
      form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "pet";
    const filePath = `${userId}/${Date.now()}-${safeName}.${extension}`;

    const { error } = await supabase.storage
      .from(PET_PHOTOS_BUCKET)
      .upload(filePath, arrayBuffer, {
        contentType: blobType,
        upsert: false,
      });

    if (error) throw error;
    return filePath;
  };

  const handleSavePet = async () => {
    if (!form.name || !form.species) {
      Alert.alert(
        "Missing Info",
        "Please provide at least a name and species.",
      );
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) {
        throw new Error("You must be signed in to add a pet.");
      }

      let imagePath: string | null = null;
      let imageUploadErrorMessage: string | null = null;

      if (selectedImage) {
        try {
          imagePath = await uploadPetImage(user.id);
        } catch (error: any) {
          imageUploadErrorMessage =
            error?.message || "Photo upload failed, but the pet can still be saved.";
          console.error("Error uploading pet image:", error);
        }
      }

      const payload = {
        name: form.name.trim(),
        creator_id: user.id,
        species: form.species,
        breed: form.breed.trim() || null,
        gender: form.gender || null,
        age_years: parseInt(form.age, 10) || 0,
        bio: form.bio.trim() || null,
        neutered_spayed: form.neutered,
        hypoallergenic: form.hypoallergenic,
        compatible_with_dogs: form.compatible_with.includes("dogs"),
        compatible_with_cats: form.compatible_with.includes("cats"),
        compatible_with_kids: form.compatible_with.includes("kids"),
        image_url: imagePath,
        status: form.status,
      };

      const { error } = await supabase.from("pets").insert([payload]);

      if (error) throw error;

      if (imageUploadErrorMessage) {
        Alert.alert(
          "Pet Saved Without Photo",
          `${form.name} was added, but the image upload failed.\n\n${imageUploadErrorMessage}`,
        );
      } else {
        Alert.alert("Success!", `${form.name} is now listed.`);
      }
      router.replace("/(tabs)/browse");
    } catch (error: any) {
      const debugMessage = [
        error?.message || "Unknown error",
        error?.code ? `Code: ${error.code}` : null,
        error?.details ? `Details: ${error.details}` : null,
        error?.hint ? `Hint: ${error.hint}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      Alert.alert("Error saving pet", debugMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back-circle" size={40} color="#7A5C46" />
        </TouchableOpacity>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>still up for adoption?</Text>
          <Switch
            value={form.status === "active"}
            onValueChange={(val) =>
              setForm({ ...form, status: val ? "active" : "inactive" })
            }
            trackColor={{ false: "#D1C4B2", true: "#7A5C46" }}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TextInput
          style={styles.nameInput}
          placeholder="enter pet name"
          placeholderTextColor="#A08E74"
          value={form.name}
          onChangeText={(v) => setForm({ ...form, name: v })}
        />

        <View style={styles.imageBox}>
          <Text style={styles.imageLabel}>upload pet&apos;s pics</Text>
          <TouchableOpacity
            style={styles.imagePlaceholder}
            onPress={pickImage}
            activeOpacity={0.85}
          >
            {selectedImage ? (
              <Image
                source={{ uri: selectedImage.uri }}
                style={styles.selectedImage}
                resizeMode="cover"
              />
            ) : (
              <Ionicons
                name="image"
                size={80}
                color="#7A5C46"
                style={{ opacity: 0.2 }}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.imageAction} onPress={pickImage}>
            <Text style={styles.imageActionText}>
              {selectedImage ? "replace photo" : "choose photo"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          <View style={styles.bioCard}>
            <Text style={styles.cardTitle}>enter pet&apos;s bio</Text>
            <View style={styles.bioInputContainer}>
              <TextInput
                style={styles.bioInput}
                multiline
                placeholder="type bio here..."
                placeholderTextColor="#A08E74"
                value={form.bio}
                onChangeText={(v) => setForm({ ...form, bio: v })}
              />
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>enter pet&apos;s info</Text>
            <View style={styles.infoList}>
              <InfoRow
                label="dog or cat:"
                value={form.species}
                onPress={() => openPicker("species", "species", ["dog", "cat"])}
              />
              <InfoRow
                label="gender:"
                value={form.gender}
                onPress={() =>
                  openPicker("gender", "gender", ["male", "female"])
                }
              />

              <View style={styles.infoRowContainer}>
                <Text style={styles.infoLabel}>age years:</Text>
                <TextInput
                  style={styles.infoValueInput}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#A08E74"
                  value={form.age}
                  onChangeText={(v) => setForm({ ...form, age: v })}
                />
              </View>

              <View style={styles.infoRowContainer}>
                <Text style={styles.infoLabel}>breed:</Text>
                <TextInput
                  style={styles.infoValueInput}
                  placeholder="type..."
                  placeholderTextColor="#A08E74"
                  value={form.breed}
                  onChangeText={(v) => setForm({ ...form, breed: v })}
                />
              </View>

              <InfoRow
                label="neutered/spay:"
                value={
                  form.neutered === null ? "" : form.neutered ? "yes" : "no"
                }
                onPress={() =>
                  openPicker("neutered", "neutered", ["yes", "no"])
                }
              />
              <InfoRow
                label="hypoallergenic:"
                value={
                  form.hypoallergenic === null
                    ? ""
                    : form.hypoallergenic
                      ? "yes"
                      : "no"
                }
                onPress={() =>
                  openPicker("hypoallergenic", "hypoallergenic", ["yes", "no"])
                }
              />
              <InfoRow
                label="compatible w/:"
                value={
                  form.compatible_with.length > 0
                    ? form.compatible_with.join(", ")
                    : ""
                }
                onPress={() =>
                  openPicker("compatibility", "compatible_with", [
                    "dogs",
                    "cats",
                    "kids",
                  ])
                }
              />
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.surveyBtn}>
          <Text style={styles.surveyText}>create application survey +</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveBtn, loading && { opacity: 0.7 }]}
          onPress={handleSavePet}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveText}>save pet</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <OptionSheet
        isVisible={picker.visible}
        title={picker.title}
        options={picker.options}
        selectedValue={null}
        onClose={() => setPicker({ ...picker, visible: false })}
        onSelect={handleSelect}
      />
    </View>
  );
}

function InfoRow({ label, value, onPress }: any) {
  return (
    <TouchableOpacity style={styles.infoRowContainer} onPress={onPress}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValueInput} numberOfLines={1}>
        {value || "select..."}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  statusRow: { alignItems: "flex-end" },
  statusLabel: { fontSize: 12, color: colors.primary, fontFamily: fonts.bold },
  scrollContent: { padding: 20, alignItems: "center" },
  nameInput: {
    backgroundColor: colors.primary,
    width: "70%",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#7A5C46",
    textAlign: "center",
    fontFamily: fonts.regular,
    marginBottom: 20,
  },
  imageBox: {
    backgroundColor: colors.primary,
    width: "100%",
    borderRadius: 20,
    padding: 15,
    alignItems: "center",
  },
  imageLabel: {
    color: colors.textSecondary,
    marginBottom: 10,
    fontFamily: fonts.regular,
  },
  imagePlaceholder: {
    backgroundColor: colors.textPrimary,
    width: "60%",
    height: 120,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedImage: {
    width: "100%",
    height: "100%",
  },
  imageAction: {
    marginTop: 10,
    backgroundColor: colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  imageActionText: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  dotRow: { flexDirection: "row", gap: 5, marginTop: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#A08E74" },
  grid: { flexDirection: "row", width: "100%", gap: 10, marginTop: 20 },
  bioCard: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 10,
  },
  infoCard: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 10,
  },
  cardTitle: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 10,
    fontFamily: fonts.regular,
  },
  bioInputContainer: {
    backgroundColor: colors.textPrimary,
    flex: 1,
    borderRadius: 15,
    padding: 10,
    minHeight: 150,
  },
  bioInput: { fontFamily: fonts.regular, color: "#7A5C46" },
  infoList: { gap: 5 },
  infoRowContainer: {
    backgroundColor: colors.textPrimary,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  infoLabel: { color: colors.primary, fontSize: 10, flex: 1 },
  infoValueInput: {
    color: colors.primary,
    fontSize: 10,
    flex: 1,
    textAlign: "right",
  },
  surveyBtn: {
    backgroundColor: colors.primary,
    width: "100%",
    padding: 12,
    borderRadius: 15,
    marginTop: 20,
    alignItems: "center",
  },
  surveyText: { color: colors.textSecondary, fontFamily: fonts.bold },
  saveBtn: {
    backgroundColor: colors.textPrimary,
    width: "50%",
    padding: 15,
    borderRadius: 30,
    marginTop: 15,
    alignItems: "center",
  },
  saveText: { color: colors.primary, fontSize: 18, fontFamily: fonts.bold },
});
