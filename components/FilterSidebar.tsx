import { colors, fontSizes, fonts, spacing } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// defines what props (inputs) this component needs to work
interface SidebarProps {
  isVisible: boolean; // is sidebar open?
  onClose: () => void; // a function to call when we want to close it
  filters: any; // the current filter selections
  setFilters: (f: any) => void; // function to update filters
}

export default function FilterSidebar({
  isVisible,
  onClose,
  filters,
  setFilters,
}: SidebarProps) {
  // step keeps track of if we are on the dog/cat screen or the dropdown filters
  const [step, setStep] = useState(1);
  const [draftFilters, setDraftFilters] = useState(filters);

  useEffect(() => {
    if (isVisible) {
      setStep(1);
      setDraftFilters(filters);
    }
  }, [isVisible, filters]);

  // helper function to close the sidebar and reset back to step 1 (dog/cat screen)
  const handleDismiss = () => {
    setStep(1);
    onClose();
  };

  const handleApply = () => {
    setFilters(draftFilters);
    handleDismiss();
  };

  return (
    // modal is a built in react native component that slides over the current screen
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        {/* make background dacker when sidebar is visible */}
        <View style={styles.sidebarContent}>
          {/* header area */}
          <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>

          {/* step 1: dog or cat? */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.questionText}>dog or cat?</Text>

              {/* clicking dog updates the filter and moves us to step 2 */}
              <TouchableOpacity
                style={styles.choiceBtn}
                onPress={() => {
                  setDraftFilters({ ...draftFilters, type: "dog" });
                  setStep(2);
                }}
              >
                <Text style={styles.choiceText}>dog</Text>
              </TouchableOpacity>

              {/* cat button */}
              <TouchableOpacity
                style={styles.choiceBtn}
                onPress={() => {
                  setDraftFilters({ ...draftFilters, type: "cat" });
                  setStep(2);
                }}
              >
                <Text style={styles.choiceText}>cat</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* step 2 UI: dropdowns */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.questionText}>fine tune your search</Text>
              <TouchableOpacity onPress={handleApply} style={styles.applyBtn}>
                <Text style={styles.applyText}>apply filters</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)", // darken background behind sidebar
    justifyContent: "flex-end", // align sidebar to the bottom
  },
  sidebarContent: {
    backgroundColor: colors.background,
    height: "90%",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: spacing.lg,
  },
  closeBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  stepContainer: {
    flex: 1,
    alignItems: "center",
    paddingTop: spacing.md,
  },
  questionText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.primary,
    marginBottom: spacing.xl,
  },
  choiceBtn: {
    backgroundColor: colors.primary,
    width: "100%",
    padding: spacing.md,
    borderRadius: 15,
    marginBottom: spacing.md,
    alignItems: "center",
  },
  choiceText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.background,
  },
  applyBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 25,
    marginTop: "auto", // pushes button to the bottom of container
    marginBottom: spacing.xl,
  },
  applyText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
});
