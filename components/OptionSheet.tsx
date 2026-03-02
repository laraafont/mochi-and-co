import { colors, fonts, fontSizes, spacing } from "@/theme";
import React from "react";
import {
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface OptionSheetProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  options: string[];
  onSelect: (value: string) => void;
  selectedValue: string | null;
}

export default function OptionSheet({
  isVisible,
  onClose,
  title,
  options,
  onSelect,
  selectedValue,
}: OptionSheetProps) {
  return (
    <Modal visible={isVisible} transparent animationType="fade">
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>

          <FlatList
            data={options}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.option,
                  selectedValue === item && styles.selectedOption,
                ]}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedValue === item && styles.selectedOption,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: spacing.lg,
    maxHeight: "50%",
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.primary,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  option: { padding: spacing.md, borderRadius: 15, marginBottom: spacing.xs },
  selectedOption: {
    backgroundColor: colors.textPrimary,
  },
  optionText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.primary,
    textAlign: "center",
  },
  selectedOptionText: { color: colors.background, fontFamily: fonts.bold },
});
