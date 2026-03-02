import { supabase } from "@/lib/supabase";
import { colors, fontSizes, fonts, spacing } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import OptionSheet from "./OptionSheet";

interface SidebarProps {
  isVisible: boolean;
  onClose: () => void;
  filters: any;
  setFilters: (f: any) => void;
  resultsCount: number;
}

export default function FilterSidebar({
  isVisible,
  onClose,
  filters,
  setFilters,
  resultsCount,
}: SidebarProps) {
  const [dynamicBreeds, setDynamicBreeds] = useState<string[]>([]);
  const [isLoadingBreeds, setIsLoadingBreeds] = useState(false);

  // state to manage the pop-up picker
  const [pickerConfig, setPickerConfig] = useState<{
    visible: boolean;
    title: string;
    key: string;
    options: string[];
  }>({
    visible: false,
    title: "",
    key: "",
    options: [],
  });

  // fetch unique breeds from db whenever sidebar opens
  useEffect(() => {
    if (isVisible) {
      fetchUniqueBreeds();
    }
  }, [isVisible]);

  async function fetchUniqueBreeds() {
    setIsLoadingBreeds(true);
    try {
      // we select just the breed column and skip nulls
      const { data, error } = await supabase
        .from("pets")
        .select("breed")
        .eq("status", "active")
        .not("breed", "is", null);

      if (error) throw error;

      // extract just the strings and remove duplicates using a set
      const uniqueBreeds = Array.from(new Set(data.map((p) => p.breed))).sort();
      setDynamicBreeds(uniqueBreeds);
    } catch (err) {
      console.error("Error fetching breeds: ", err);
    } finally {
      setIsLoadingBreeds(false);
    }
  }

  const updateFilter = (key: string, value: any) => {
    setFilters({ ...filters, [key]: value });
  };

  const openPicker = (label: string, key: string, options: string[]) => {
    setPickerConfig({
      visible: true,
      title: `select ${label}`,
      key,
      options,
    });
  };

  const resetFilters = () => {
    setFilters({
      type: null,
      gender: null,
      breed: null,
      age_range: null,
      neutered_spayed: null,
      hypoallergenic: null,
      compatible_with: null,
    });
  };

  return (
    <>
      <Modal
        visible={isVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <View style={styles.sidebarContent}>
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color={colors.primary} />
                <Text style={styles.headerText}>search filters</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={resetFilters}>
                <Text style={styles.resetText}>reset</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionLabel}>pet type</Text>
              <View style={styles.typeContainer}>
                {["dog", "cat"].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.typeBtn,
                      filters.type === t && styles.typeBtnActive,
                    ]}
                    onPress={() =>
                      updateFilter("type", filters.type === t ? null : t)
                    }
                  >
                    <Text
                      style={[
                        styles.typeText,
                        filters.type === t && styles.typeTextActive,
                      ]}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* GENDER & AGE (Hardcoded options) */}
              <Text style={styles.sectionLabel}>gender</Text>
              <TouchableOpacity
                style={styles.dropdownTrigger}
                onPress={() =>
                  openPicker("gender", "gender", ["male", "female"])
                }
              >
                <Text style={styles.dropdownText}>
                  {filters.gender || "any gender"}
                </Text>
              </TouchableOpacity>

              <Text style={styles.sectionLabel}>age range</Text>
              <TouchableOpacity
                style={styles.dropdownTrigger}
                onPress={() =>
                  openPicker("age", "age_range", [
                    "baby",
                    "young",
                    "adult",
                    "senior",
                  ])
                }
              >
                <Text style={styles.dropdownText}>
                  {filters.age_range || "any age"}
                </Text>
              </TouchableOpacity>

              {/* DYNAMIC BREED DROPDOWN */}
              <Text style={styles.sectionLabel}>breed</Text>
              <TouchableOpacity
                style={styles.dropdownTrigger}
                onPress={() => openPicker("breed", "breed", dynamicBreeds)}
                disabled={isLoadingBreeds}
              >
                {isLoadingBreeds ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={styles.dropdownText}>
                    {filters.breed || "all breeds"}
                  </Text>
                )}
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={colors.primary}
                />
              </TouchableOpacity>

              {/* COMPATIBILITY */}
              <Text style={styles.sectionLabel}>compatible with</Text>
              <TouchableOpacity
                style={styles.dropdownTrigger}
                onPress={() =>
                  openPicker("compatibility", "compatible_with", [
                    "dogs",
                    "cats",
                    "kids",
                  ])
                }
              >
                <Text style={styles.dropdownText}>
                  {filters.compatible_with || "no preference"}
                </Text>
              </TouchableOpacity>

              {/* BOOLEANS */}
              <View style={styles.boolRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionLabel}>neutered?</Text>
                  <TouchableOpacity
                    style={[
                      styles.typeBtn,
                      filters.neutered_spayed === true && styles.typeBtnActive,
                    ]}
                    onPress={() =>
                      updateFilter(
                        "neutered_spayed",
                        filters.neutered_spayed === true ? null : true,
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.typeText,
                        filters.neutered_spayed === true &&
                          styles.typeTextActive,
                      ]}
                    >
                      yes
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.sectionLabel}>hypoallergenic?</Text>
                  <TouchableOpacity
                    style={[
                      styles.typeBtn,
                      filters.hypoallergenic === true && styles.typeBtnActive,
                    ]}
                    onPress={() =>
                      updateFilter(
                        "hypoallergenic",
                        filters.hypoallergenic === true ? null : true,
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.typeText,
                        filters.hypoallergenic === true &&
                          styles.typeTextActive,
                      ]}
                    >
                      yes
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity onPress={onClose} style={styles.applyBtn}>
                <Text style={styles.applyText}>
                  show {resultsCount} results
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <OptionSheet
        isVisible={pickerConfig.visible}
        title={pickerConfig.title}
        options={pickerConfig.options}
        selectedValue={filters[pickerConfig.key]}
        onClose={() => setPickerConfig({ ...pickerConfig, visible: false })}
        onSelect={(val) => updateFilter(pickerConfig.key, val)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sidebarContent: {
    backgroundColor: colors.background,
    height: "85%",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl,
    color: colors.primary,
  },
  resetText: {
    fontFamily: fonts.regular,
    color: colors.primary,
    textDecorationLine: "underline",
  },
  sectionLabel: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.primary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  typeContainer: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  typeBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: "center",
  },
  typeBtnActive: { backgroundColor: colors.primary },
  typeText: { fontFamily: fonts.bold, color: colors.primary },
  typeTextActive: { color: colors.background },
  dropdownTrigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#A08E74",
    marginBottom: spacing.md,
  },
  dropdownText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.primary,
  },
  boolRow: { flexDirection: "row", marginBottom: spacing.lg },
  applyBtn: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: 25,
    alignItems: "center",
    marginTop: spacing.xl,
    marginBottom: 50,
  },
  applyText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.background,
  },
});
