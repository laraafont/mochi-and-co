import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme";

export default function MessagesScreen() {
  return (
    <View style={styles.container}>
      <Text>Messages Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
