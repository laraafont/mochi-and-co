import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { supabase } from "../../../lib/supabase";
import { colors, fonts, fontSizes, spacing } from "../../../theme";

export default function ChatScreen() {
  const { id: conversationId } = useLocalSearchParams();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const currentUserIdRef = useRef<string | null>(null);

  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [otherUserName, setOtherUserName] = useState("Chat");
  const [petName, setPetName] = useState("this pet");

  const markConversationRead = useCallback(
    async (userId: string) => {
      if (!conversationId) return;

      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .eq("is_read", false)
        .neq("sender_id", userId);

      if (error) {
        console.error("Error marking conversation as read:", error);
      }
    },
    [conversationId],
  );

  useEffect(() => {
    async function setupChat() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);
      currentUserIdRef.current = user.id;

      // 1. Fetch messages using correct snake_case column
      const { data: messageData } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (messageData) setMessages(messageData);

      // 2. Fetch the "Other User" for header (with explicit typing for joins)
      const { data: convoData } = await supabase
        .from("conversations")
        .select(
          `
          pet:pet_id(name),
          seller:seller_id(display_name, id),
          adopter:adopter_id(display_name, id)
        `,
        )
        .eq("id", conversationId)
        .single();

      if (convoData) {
        const pet = convoData.pet as { name?: string | null } | null;
        const seller = convoData.seller as any;
        const adopter = convoData.adopter as any;
        const otherUser = seller.id === user.id ? adopter : seller;
        setOtherUserName(otherUser?.display_name || "Pet Lover");
        setPetName(pet?.name || "this pet");
      }

      await markConversationRead(user.id);

      setLoading(false);
    }

    setupChat();

    // 3. Real-time Subscription (Correct snake_case column)
    const channel = supabase
      .channel(`convo-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((current) => [...current, payload.new]);
          const activeUserId = currentUserIdRef.current;
          if (payload.new.sender_id !== activeUserId && activeUserId) {
            void markConversationRead(activeUserId);
          }
          setTimeout(
            () => flatListRef.current?.scrollToEnd({ animated: true }),
            100,
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, markConversationRead]);

  async function sendMessage() {
    if (!inputText.trim() || !currentUserId) return;

    const messageContent = inputText.trim();
    setInputText("");

    const { error } = await supabase.from("messages").insert({
      // Column name is snake_case: conversation_id
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: messageContent,
    });

    if (error) {
      console.error("Error sending message:", error);
    }
  }

  const renderMessage = ({ item }: { item: any }) => {
    const isMine = item.sender_id === currentUserId;

    return (
      <View
        style={[styles.messageRow, isMine ? styles.myRow : styles.theirRow]}
      >
        {!isMine && (
          <View style={[styles.avatar, { marginRight: 8 }]}>
            <Ionicons name="person-circle" size={32} color={colors.primary} />
          </View>
        )}
        <View
          style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}
        >
          <Text
            style={[
              styles.messageText,
              isMine ? styles.myText : styles.theirText,
            ]}
          >
            {item.content}
          </Text>
        </View>
        {isMine && (
          <View style={[styles.avatar, { marginLeft: 8 }]}>
            <Ionicons
              name="person-circle-outline"
              size={32}
              color={colors.primary}
            />
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Hide default header so bottom tabs remain visible */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* 1. Outside Page Title (Match Mockup) */}
      <View style={styles.pageTitleContainer}>
        <Text style={styles.pageTitleText}>messages</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0} // Adjust for bottom tab height
      >
        {/* 2. The White "Overlay Box" Container */}
        <View style={styles.whiteContainer}>
          {/* 3. In-Box Chat Header (Arrow + Name) */}
          <View style={styles.chatHeader}>
            <TouchableOpacity
              onPress={() => router.replace("/messages")}
              style={styles.backButton}
            >
              <Ionicons
                name="arrow-back-circle-outline"
                size={28}
                color={colors.primary}
              />
            </TouchableOpacity>
            <Text style={styles.headerName}>
              {otherUserName}{" "}
              <Text
                style={{ fontSize: fontSizes.xs, color: colors.textSecondary }}
              >
                is interested in{" "}
              </Text>
              <Text style={{ color: colors.primary, fontSize: fontSizes.xs }}>
                {petName}
              </Text>
            </Text>
          </View>

          {/* 4. Chat Bubbles List */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            showsVerticalScrollIndicator={false}
          />

          {/* 5. In-Box Input Area */}
          <View style={styles.inputArea}>
            <TextInput
              style={styles.input}
              placeholder="write your message..."
              placeholderTextColor={colors.textSecondary + "70"} // Transparent light text
              value={inputText}
              onChangeText={setInputText}
              multiline={false}
              returnKeyType="send"
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                !inputText.trim() && styles.sendBtnDisabled,
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim()}
            >
              <Ionicons name="send" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Main background (matching cream/beige in mockup)
  container: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },

  keyboardView: { flex: 1 },

  // Outside Page Title Styling
  pageTitleContainer: {
    paddingVertical: spacing.md,
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  pageTitleText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xl,
    color: colors.primary,
  },

  // The White "Overlay Box"
  whiteContainer: {
    flex: 1,
    backgroundColor: "#F8ECDD",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },

  // In-Box Chat Header (Match mockup with back arrow next to name)
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomColor: colors.primary,
    borderBottomWidth: 2,
  },
  backButton: {
    marginRight: spacing.sm,
  },
  headerName: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },

  // List Styling
  listContent: { padding: spacing.lg, paddingBottom: spacing.md },

  // Bubbles Logic
  messageRow: {
    flexDirection: "row",
    marginBottom: 15,
    alignItems: "flex-end",
  },
  myRow: { justifyContent: "flex-end" },
  theirRow: { justifyContent: "flex-start" },
  avatar: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  bubble: {
    maxWidth: "75%",
    padding: 12,
    borderRadius: 18,
  },
  myBubble: {
    backgroundColor: colors.primary, // Dark olive/brown bubble
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: "#C9AE8F",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs, // Using smaller theme size for chat text
  },
  myText: { color: colors.textSecondary }, // Light text on dark bubble
  theirText: { color: colors.primary },

  // In-Box Input Area (Simplified pill design)
  inputArea: {
    flexDirection: "row",
    padding: spacing.md,
    alignItems: "center",
    backgroundColor: "#F8ECDD", // Keep inside white box
    borderTopWidth: 1,
    borderTopColor: colors.primary + "15", // Subtle divider
    paddingBottom: Platform.OS === "ios" ? spacing.md : spacing.lg, // Adjust for OS
  },
  input: {
    flex: 1,
    // Dark olive/brown input area with pill shape
    backgroundColor: colors.primary,
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    marginRight: 10,
    fontFamily: fonts.regular,
    fontSize: fontSizes.xs,
    color: colors.textSecondary, // Light text inside dark input
  },
  sendBtn: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: {
    opacity: 0.45,
  },
});
