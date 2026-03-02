import { colors, fontSizes, fonts, spacing } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface SidebarProps {
  isVisible: boolean;
  onClose: () => void;
  filters: any;
  setFilters: (f: any) => void;
}

export default function FilterSidebar({
  isVisible,
  onClose,
  filters,
  setFilters,
}: SidebarProps) {
  const updateFilter = (key: string, value: any) => {
    setFilters({ ...filters, [key]: value });
  };

  // Logic to clear all filters
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
            {/* TYPE SELECTION */}
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

            {/* DYNAMIC DROPDOWNS */}
            {[
              { label: "gender", key: "gender", options: ["male", "female"] },
              {
                label: "age range",
                key: "age_range",
                options: ["baby", "young", "adult", "senior"],
              },
              {
                label: "breed",
                key: "breed",
                options: ["Golden Retriever", "Poodle", "Tabby", "Siamese"],
              },
              {
                label: "compatible with",
                key: "compatible_with",
                options: ["dogs", "cats", "kids"],
              },
            ].map((item) => (
              <View key={item.key}>
                <Text style={styles.sectionLabel}>{item.label}</Text>
                <TouchableOpacity
                  style={styles.dropdownTrigger}
                  onPress={() => {
                    // Temporary: Cyles options on click until we build the picker
                    const cur = item.options.indexOf(filters[item.key]);
                    updateFilter(
                      item.key,
                      item.options[(cur + 1) % item.options.length],
                    );
                  }}
                >
                  <Text style={styles.dropdownText}>
                    {filters[item.key] || `any ${item.label}`}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </View>
            ))}

            {/* BOOLEAN TOGGLES */}
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
                      filters.neutered_spayed === true && styles.typeTextActive,
                    ]}
                  >
                    yes
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.sectionLabel}>allergies?</Text>
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
                      filters.hypoallergenic === true && styles.typeTextActive,
                    ]}
                  >
                    yes
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.applyBtn}>
              <Text style={styles.applyText}>show results</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
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
    fontSize: fontSizes.md,
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
