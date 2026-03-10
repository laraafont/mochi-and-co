import { supabase } from "@/lib/supabase";
import { colors, fonts, fontSizes } from "@/theme";
import { useState } from "react";
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) Alert.alert("Log In Error", error.message);
    setLoading(false);
  }

  async function handleSignUp() {
    if (!isLogin && !displayName) {
      Alert.alert("Missing Info", "Please provide a display name.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });

    if (error) {
      Alert.alert("Sign Up Error", error.message);
    } else if (!data.session) {
      Alert.alert("Check your email!", "Verify your account to continue.");
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.headerCircle}>
        <Text style={styles.headerTitle}>{isLogin ? "log in" : "sign up"}</Text>
        <Image
          source={require("@/assets/images/cocomascot.png")}
          style={styles.mascot}
          resizeMode="contain"
        />
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.label}>email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          placeholder="Value"
        />

        {!isLogin && (
          <>
            <Text style={styles.label}>display name</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Value"
            />
          </>
        )}

        <Text style={styles.label}>password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          placeholder="Value"
        />

        <TouchableOpacity
          style={styles.actionButton}
          onPress={isLogin ? handleLogin : handleSignUp}
          disabled={loading}
        >
          <Text style={styles.actionButtonText}>
            {loading ? "..." : isLogin ? "log in" : "sign up"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setIsLogin(!isLogin)}
          style={{ marginTop: 15 }}
        >
          <Text style={styles.toggleText}>
            {isLogin
              ? "don't have an account? sign up"
              : "already have an account? log in"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerCircle: {
    backgroundColor: colors.primary,
    height: "45%",
    borderBottomLeftRadius: 200,
    borderBottomRightRadius: 200,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.xl,
    fontFamily: fonts.semiBold,
    marginBottom: 20,
  },
  pixelArtPlaceholder: {
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  formContainer: { paddingHorizontal: 40, marginTop: 20 },
  label: {
    color: colors.primary,
    fontSize: fontSizes.md,
    fontFamily: fonts.semiBold,
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#D1C4B5",
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#6D4C3D",
  },
  actionButton: {
    backgroundColor: "#B5A696",
    padding: 16,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 20,
  },
  actionButtonText: {
    color: "#000",
    fontSize: fontSizes.md,
    fontFamily: fonts.semiBold,
  },
  toggleText: {
    color: colors.primary,
    textAlign: "center",
    fontSize: fontSizes.xs,
    fontFamily: fonts.regular,
  },
  mascot: {
    width: 150,
    height: 150,
  },
});
