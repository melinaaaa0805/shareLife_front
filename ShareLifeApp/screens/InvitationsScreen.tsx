import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../api/api";
import { theme } from "../assets/style/theme";
import { RootStackParamList } from "../types/types";

type Nav = NativeStackNavigationProp<RootStackParamList, "Invitations">;

type Invitation = {
  id: string;
  group: { id: string; name: string };
  invitedBy: { id: string; firstName: string; email: string };
  createdAt: string;
};

const AVATAR_PALETTE = [
  "#9B7BEA",
  "#EAB1CF",
  "#A6D8C0",
  "#FFE27A",
  "#7BC4EA",
  "#EA9B7B",
  "#B1EAD4",
  "#C4B1EA",
];

function accentFor(name: string) {
  return AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length];
}

function InvitationCard({
  invitation,
  index,
  onAccept,
  onDecline,
  removing,
}: {
  invitation: Invitation;
  index: number;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  removing: boolean;
}) {
  const slideAnim = useRef(new Animated.Value(20)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 9,
        delay: index * 60,
      }),
    ]).start();
  }, []);

  React.useEffect(() => {
    if (removing) {
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.9, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [removing]);

  const accent = accentFor(invitation.group.name);
  const date = new Date(invitation.createdAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: opacityAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      <View style={[styles.cardAccent, { backgroundColor: accent }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: accent + "25", borderColor: accent },
            ]}
          >
            <Text style={[styles.avatarText, { color: accent }]}>
              {invitation.group.name[0].toUpperCase()}
            </Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.groupName}>{invitation.group.name}</Text>
            <Text style={styles.invitedBy}>
              Invité par{" "}
              {invitation.invitedBy.firstName || invitation.invitedBy.email}
            </Text>
          </View>
          <Text style={styles.date}>{date}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.declineBtn}
            onPress={() => onDecline(invitation.id)}
            activeOpacity={0.75}
          >
            <Ionicons name="close" size={14} color="#F44336" />
            <Text style={styles.declineText}>Refuser</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={() => onAccept(invitation.id)}
            activeOpacity={0.75}
          >
            <Ionicons name="checkmark" size={14} color="#FFF" />
            <Text style={styles.acceptText}>Rejoindre</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

function EmptyState() {
  const anim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[styles.emptyContainer, { opacity: anim }]}>
      <View style={styles.emptyIcon}>
        <Ionicons name="mail-outline" size={40} color={theme.colors.purple} />
      </View>
      <Text style={styles.emptyTitle}>Aucune invitation</Text>
      <Text style={styles.emptySubtitle}>
        Vous n'avez pas d'invitation en attente.{"\n"}
        Demandez à quelqu'un de vous inviter dans son groupe !
      </Text>
    </Animated.View>
  );
}

export default function InvitationsScreen() {
  const navigation = useNavigation<Nav>();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  const headerAnim = useRef(new Animated.Value(0)).current;

  const fetchInvitations = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get<Invitation[]>("/group-invitations/mine");
      setInvitations(data);
    } catch {
      // silently ignore — list stays empty
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchInvitations();
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    }, [fetchInvitations])
  );

  const removeAfterDelay = (id: string) => {
    setRemovingIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setInvitations((prev) => prev.filter((inv) => inv.id !== id));
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 280);
  };

  const handleAccept = async (id: string) => {
    try {
      await api.patch(`/group-invitations/${id}/accept`);
      removeAfterDelay(id);
    } catch {
      Alert.alert("Erreur", "Impossible d'accepter l'invitation.");
    }
  };

  const handleDecline = async (id: string) => {
    Alert.alert(
      "Refuser l'invitation",
      "Êtes-vous sûr de vouloir refuser cette invitation ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Refuser",
          style: "destructive",
          onPress: async () => {
            try {
              await api.patch(`/group-invitations/${id}/decline`);
              removeAfterDelay(id);
            } catch {
              Alert.alert("Erreur", "Impossible de refuser l'invitation.");
            }
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchInvitations(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.surface} />
      <Animated.View
        style={[
          styles.header,
          { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }] },
        ]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={20} color={theme.colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Invitations</Text>
          {invitations.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{invitations.length}</Text>
            </View>
          )}
        </View>
        <View style={styles.backBtn} />
      </Animated.View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.purple} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.purple}
            />
          }
        >
          {invitations.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <Text style={styles.sectionLabel}>
                {invitations.length} invitation{invitations.length > 1 ? "s" : ""} en attente
              </Text>
              {invitations.map((inv, i) => (
                <InvitationCard
                  key={inv.id}
                  invitation={inv}
                  index={i}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                  removing={removingIds.has(inv.id)}
                />
              ))}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingTop: Platform.OS === "ios" ? 54 : (StatusBar.currentHeight ?? 24) + 8,
    paddingBottom: 14,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: theme.typography.size.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
  },
  badge: {
    backgroundColor: theme.colors.purple,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#FFF",
  },

  // Content
  scrollContent: {
    padding: theme.spacing.md,
    flexGrow: 1,
  },
  sectionLabel: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },

  // Card
  card: {
    flexDirection: "row",
    backgroundColor: theme.colors.card,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
  },
  cardAccent: { width: 4 },
  cardBody: { flex: 1, padding: 14 },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 17,
    fontFamily: theme.typography.fontFamily.bold,
  },
  cardInfo: { flex: 1 },
  groupName: {
    fontSize: 15,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
  },
  invitedBy: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  date: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },

  // Actions
  actions: { flexDirection: "row", gap: 8 },
  declineBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#F4433650",
    backgroundColor: "#F4433612",
  },
  declineText: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: "#F44336",
  },
  acceptBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: theme.colors.purple,
  },
  acceptText: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: "#FFF",
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // Empty
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.purple + "18",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: theme.typography.size.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});
