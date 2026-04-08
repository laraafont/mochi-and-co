import { getPetImageSource } from "@/constants/PetAssets";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { supabase } from "../../../lib/supabase";
import { colors, fonts, fontSizes, spacing } from "../../../theme";

export default function MessagesTab() {
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConversations() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data, error } = await supabase
        .from("conversations")
        .select(
          `
          *,
          pet:pet_id (name, image_url),
          seller:seller_id (display_name),
          adopter:adopter_id (display_name)
        `,
        )
        .or(`seller_id.eq.${user.id},adopter_id.eq.${user.id}`)
        .order("updated_at", { ascending: false });

      if (error) console.log("Error fetching convos:", error);
      else {
        const conversationsData = data || [];
        const conversationIds = conversationsData.map((conversation) => conversation.id);

        if (conversationIds.length === 0) {
          setConversations([]);
          setLoading(false);
          return;
        }

        const { data: unreadMessages, error: unreadError } = await supabase
          .from("messages")
          .select("conversation_id")
          .in("conversation_id", conversationIds)
          .eq("is_read", false)
          .neq("sender_id", user.id);

        if (unreadError) {
          console.log("Error fetching unread messages:", unreadError);
        }

        const unreadConversationIds = new Set(
          (unreadMessages || []).map((message) => message.conversation_id),
        );

        setConversations(
          conversationsData.map((conversation) => ({
            ...conversation,
            hasUnreadMessage: unreadConversationIds.has(conversation.id),
          })),
        );
      }
      setLoading(false);
    }

    fetchConversations();

    // Refresh inbox when either the conversation row changes or message read/unread state changes.
    const channel = supabase
      .channel("inbox-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => fetchConversations(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => fetchConversations(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const renderItem = ({ item }: { item: any }) => {
    // Determine the name to show (if I'm the seller, show the adopter's name)
    const isSeller = item.seller_id === userId;
    const otherParty = isSeller
      ? item.adopter?.display_name
      : item.seller?.display_name;
    const hasUnreadMessage = Boolean(item.hasUnreadMessage);

    return (
      <TouchableOpacity
        style={styles.convoItem}
        onPress={() => router.push(`/messages/${item.id}` as any)}
      >
        <View style={styles.petImageWrap}>
          <Image source={getPetImageSource(item.pet)} style={styles.petImage} />
          {hasUnreadMessage && <View style={styles.unreadBadge} />}
        </View>

        <View style={styles.convoInfo}>
          <View style={styles.headerRow}>
            <Text style={styles.petName}>{item.pet?.name}</Text>
            <Text style={styles.timeText}>
              {new Date(item.updated_at).toLocaleDateString()}
            </Text>
          </View>

          <Text style={styles.otherPartyText}>with {otherParty}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.pageTitleContainer}>
        <Text style={styles.pageTitleText}>messages</Text>
      </View>

      <View style={styles.whiteBox}>
        <View style={styles.chatHeader}>
          <Text style={styles.headerName}>recent chats</Text>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginTop: 50 }}
          />
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>no messages yet</Text>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
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

  whiteBox: {
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

  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomColor: colors.primary,
    borderBottomWidth: 2,
  },
  headerName: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },

  listContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },

  convoItem: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderCurve: "circular",
    borderRadius: 35,
    marginBottom: spacing.sm,
  },

  petImageWrap: {
    position: "relative",
  },
  petImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
  },

  convoInfo: { flex: 1, marginLeft: spacing.md },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  petName: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },

  otherPartyText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.xs,
    color: colors.textPrimary,
    opacity: 0.78,
    marginTop: 2,
  },

  timeText: { fontSize: 10, color: colors.textPrimary, opacity: 0.5 },

  unreadBadge: {
    position: "absolute",
    top: -1,
    right: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#FF6B6B",
    borderWidth: 2,
    borderColor: colors.primary,
  },

  emptyText: {
    textAlign: "center",
    marginTop: 50,
    fontFamily: fonts.regular,
    color: colors.primary,
    opacity: 0.5,
  },
});
