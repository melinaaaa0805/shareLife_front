import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
  Alert,
  Modal,
  Platform,
} from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import api from "../api/api";
import { RootStackParamList, Group, GroupMode, GroupMember, MemberProfile } from "../types/types";
import { useGroup } from "../context/GroupContext";
import { theme } from "../assets/style/theme";
import MemberItem from "../components/MemberItem";

type GroupDetailRouteProp = RouteProp<RootStackParamList, "GroupDetail">;
type GroupDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, "GroupDetail">;

const GROUP_COLORS = [
  theme.colors.purple,
  theme.colors.pink,
  theme.colors.mint,
  "#7BC4EA",
  theme.colors.yellow,
];

function getGroupColor(name: string) {
  const idx = name.charCodeAt(0) % GROUP_COLORS.length;
  return GROUP_COLORS[idx];
}

export default function GroupDetailScreen() {
  const route = useRoute<GroupDetailRouteProp>();
  const { groupId, group: initialGroup } = route.params;
  const [group, setGroup] = useState<Group | null>(initialGroup ?? null);
  const navigation = useNavigation<GroupDetailNavigationProp>();
  const { setCurrentGroup } = useGroup();

  // Animations
  const headerAnim = useRef(new Animated.Value(-20)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(30)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const modeBtnScale = useRef(new Animated.Value(1)).current;
  const startBtnScale = useRef(new Animated.Value(1)).current;

  const [profileModalMember, setProfileModalMember] = useState<GroupMember | null>(null);

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(headerAnim, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
      Animated.timing(contentOpacity, { toValue: 1, duration: 400, delay: 120, useNativeDriver: true }),
      Animated.spring(contentAnim, { toValue: 0, tension: 60, friction: 10, delay: 120, useNativeDriver: true }),
    ]).start();
  };

  const fetchGroup = async () => {
    try {
      if (groupId === "new") return;
      const res = await api.get(`/groups/${groupId}`);
      setGroup(res.data);
      animateIn();
    } catch (error) {
      console.error(error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchGroup();
    }, [groupId])
  );

  useEffect(() => {
    fetchGroup();
  }, []);

  const handleSetMode = async (mode: GroupMode) => {
    Animated.sequence([
      Animated.timing(modeBtnScale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.spring(modeBtnScale, { toValue: 1, useNativeDriver: true }),
    ]).start();
    try {
      await api.patch(`/groups/${groupId}/mode`, { mode });
      setGroup((prev) => (prev ? { ...prev, mode } : prev));
    } catch {
      Alert.alert("Erreur", "Impossible de changer le mode.");
    }
  };

  const handleSetProfile = async (member: GroupMember, profile: MemberProfile) => {
    setProfileModalMember(null);
    try {
      await api.patch(`/groups/${groupId}/members/${member.id}/profile`, { profile });
      setGroup((prev) =>
        prev
          ? {
              ...prev,
              members: prev.members?.map((m) =>
                m.id === member.id ? { ...m, profile } : m
              ),
            }
          : prev
      );
    } catch {
      Alert.alert("Erreur", "Impossible de modifier le profil.");
    }
  };

  const startGroup = () => {
    Animated.sequence([
      Animated.timing(startBtnScale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.spring(startBtnScale, { toValue: 1, useNativeDriver: true }),
    ]).start(() => {
      setCurrentGroup(group);
      navigation.replace("MainTabs");
    });
  };

  if (!group) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement…</Text>
      </View>
    );
  }

  const accentColor = getGroupColor(group.name);
  const initial = group.name[0].toUpperCase();
  const memberCount = group.members?.length ?? 0;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero header ── */}
        <Animated.View
          style={[
            styles.hero,
            { transform: [{ translateY: headerAnim }], opacity: headerOpacity },
          ]}
        >
          <View style={[styles.groupAvatar, { backgroundColor: accentColor + "22", borderColor: accentColor }]}>
            <Text style={[styles.groupAvatarText, { color: accentColor }]}>{initial}</Text>
          </View>
          <Text style={styles.groupName}>{group.name}</Text>
          <View style={styles.metaRow}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>
                📅{" "}
                {new Date(group.createdAt).toLocaleDateString("fr-FR", {
                  month: "long",
                  year: "numeric",
                })}
              </Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>
                {memberCount} membre{memberCount !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Corps ── */}
        <Animated.View
          style={{
            transform: [{ translateY: contentAnim }],
            opacity: contentOpacity,
          }}
        >
          {/* Section membres */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Membres</Text>
              <TouchableOpacity
                style={styles.addMemberBtn}
                onPress={() => navigation.navigate("AddMember", { groupId })}
              >
                <Text style={styles.addMemberBtnText}>+ Ajouter</Text>
              </TouchableOpacity>
            </View>

            {group.members && group.members.length > 0 ? (
              group.members.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={group.mode === "SMART" ? 0.7 : 1}
                  onPress={() => group.mode === "SMART" && setProfileModalMember(item)}
                  style={styles.memberRowWrapper}
                >
                  <MemberItem
                    firstName={item.firstName}
                    email={item.email}
                    index={index}
                    isAdmin={group.weeklyAdmin?.id === item.id}
                  />
                  {group.mode === "SMART" && (
                    <View style={[
                      styles.profileBadge,
                      item.profile === "CHILD" && styles.profileBadgeChild,
                    ]}>
                      <Text style={styles.profileBadgeText}>
                        {item.profile === "CHILD" ? "👶 Enfant" : "🧑 Adulte"}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyMembers}>
                <Text style={styles.emptyMembersText}>
                  Aucun membre pour l'instant
                </Text>
              </View>
            )}
          </View>

          {/* Section mode */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mode du groupe</Text>

            <Animated.View style={[styles.modeRow, { transform: [{ scale: modeBtnScale }] }]}>
              <TouchableOpacity
                style={[styles.modeBtn, group.mode === "FREE" && styles.modeBtnActive]}
                onPress={() => handleSetMode("FREE")}
                activeOpacity={0.8}
              >
                <Text style={styles.modeEmoji}>🕊️</Text>
                <Text style={[styles.modeBtnLabel, group.mode === "FREE" && styles.modeBtnLabelActive]}>
                  Libre
                </Text>
                <Text style={styles.modeDesc}>Chacun s'attribue ses tâches</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeBtn, group.mode === "FUNNY" && styles.modeBtnActive]}
                onPress={() => handleSetMode("FUNNY")}
                activeOpacity={0.8}
              >
                <Text style={styles.modeEmoji}>🎡</Text>
                <Text style={[styles.modeBtnLabel, group.mode === "FUNNY" && styles.modeBtnLabelActive]}>
                  Drôle
                </Text>
                <Text style={styles.modeDesc}>Un chef tiré au sort distribue</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeBtn, group.mode === "SMART" && styles.modeBtnActiveSmart]}
                onPress={() => handleSetMode("SMART")}
                activeOpacity={0.8}
              >
                <Text style={styles.modeEmoji}>🤖</Text>
                <Text style={[styles.modeBtnLabel, group.mode === "SMART" && styles.modeBtnLabelSmart]}>
                  Intelligent
                </Text>
                <Text style={styles.modeDesc}>Répartition auto équilibrée</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Admin badge (FUNNY) */}
            {group.mode === "FUNNY" && group.weeklyAdmin && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeEmoji}>👑</Text>
                <View>
                  <Text style={styles.adminBadgeLabel}>Chef de la semaine</Text>
                  <Text style={styles.adminBadgeName}>{group.weeklyAdmin.firstName}</Text>
                </View>
              </View>
            )}

            {/* Bouton roue (FUNNY) */}
            {group.mode === "FUNNY" && (
              <TouchableOpacity
                style={styles.spinButton}
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate("SpinWheel", {
                    groupId,
                    members: [
                      { id: group.owner.id, firstName: group.owner.firstName, email: group.owner.email },
                      ...(group.members ?? []).filter(m => m.id !== group.owner.id),
                    ],
                  })
                }
              >
                <Text style={styles.spinButtonText}>🎰 Tirer le chef de la semaine</Text>
              </TouchableOpacity>
            )}

            {/* SMART mode info + action */}
            {group.mode === "SMART" && (
              <>
                <View style={styles.smartInfoBox}>
                  <Ionicons name="information-circle-outline" size={16} color={theme.colors.mint} />
                  <Text style={styles.smartInfoText}>
                    Appuyez sur un membre pour définir son profil (Adulte / Enfant), puis lancez la répartition intelligente.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.smartAssignButton}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate("SmartAssign", { groupId })}
                >
                  <Ionicons name="flash" size={16} color="#0E0E0E" />
                  <Text style={styles.smartAssignButtonText}>🤖 Lancer la répartition intelligente</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Animated.View>

        {/* Espace pour le footer fixe */}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── Footer fixe ── */}
      <View style={styles.footer}>
        <Animated.View style={{ transform: [{ scale: startBtnScale }] }}>
          <Pressable style={styles.startButton} onPress={startGroup}>
            <Text style={styles.startButtonText}>Commencer →</Text>
          </Pressable>
        </Animated.View>
      </View>

      {/* ── Modal profil membre (mode SMART) ── */}
      <Modal
        visible={!!profileModalMember}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileModalMember(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setProfileModalMember(null)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              Profil de {profileModalMember?.firstName}
            </Text>
            <Text style={styles.modalSub}>
              Choisissez si ce membre est adulte ou enfant pour la répartition intelligente.
            </Text>
            <TouchableOpacity
              style={[
                styles.profileOption,
                profileModalMember?.profile !== "CHILD" && styles.profileOptionActive,
              ]}
              onPress={() => profileModalMember && handleSetProfile(profileModalMember, "ADULT")}
            >
              <Text style={styles.profileOptionEmoji}>🧑</Text>
              <View style={styles.profileOptionInfo}>
                <Text style={styles.profileOptionLabel}>Adulte</Text>
                <Text style={styles.profileOptionDesc}>Peut faire toutes les tâches</Text>
              </View>
              {profileModalMember?.profile !== "CHILD" && (
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.purple} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.profileOption,
                profileModalMember?.profile === "CHILD" && styles.profileOptionActiveChild,
              ]}
              onPress={() => profileModalMember && handleSetProfile(profileModalMember, "CHILD")}
            >
              <Text style={styles.profileOptionEmoji}>👶</Text>
              <View style={styles.profileOptionInfo}>
                <Text style={styles.profileOptionLabel}>Enfant</Text>
                <Text style={styles.profileOptionDesc}>Tâches adaptées à son âge</Text>
              </View>
              {profileModalMember?.profile === "CHILD" && (
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.mint} />
              )}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },

  // Hero
  hero: {
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  groupAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.md,
  },
  groupAvatarText: {
    fontSize: 28,
    fontFamily: theme.typography.fontFamily.bold,
  },
  groupName: {
    fontSize: theme.typography.size.xxl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
    textAlign: "center",
    marginBottom: theme.spacing.sm,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.round,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  chipText: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.medium,
  },

  // Sections
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  addMemberBtn: {
    backgroundColor: theme.colors.purple + "22",
    borderWidth: 1,
    borderColor: theme.colors.purple,
    borderRadius: theme.radius.round,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  addMemberBtnText: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.purple,
  },
  emptyMembers: {
    paddingVertical: theme.spacing.lg,
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: "dashed",
  },
  emptyMembersText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.regular,
  },

  // Mode
  modeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: theme.spacing.md,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
  },
  modeBtnActive: {
    borderColor: theme.colors.purple,
    backgroundColor: theme.colors.purple + "18",
  },
  modeEmoji: {
    fontSize: 22,
    marginBottom: 6,
  },
  modeBtnLabel: {
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  modeBtnLabelActive: {
    color: theme.colors.purple,
  },
  modeDesc: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    textAlign: "center",
    fontFamily: theme.typography.fontFamily.regular,
    lineHeight: 15,
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFD70014",
    borderWidth: 1,
    borderColor: "#FFD70055",
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  adminBadgeEmoji: {
    fontSize: 28,
  },
  adminBadgeLabel: {
    fontSize: theme.typography.size.xs,
    color: "#FFD700",
    fontFamily: theme.typography.fontFamily.medium,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  adminBadgeName: {
    fontSize: theme.typography.size.md,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.bold,
    marginTop: 2,
  },
  spinButton: {
    borderWidth: 1.5,
    borderColor: theme.colors.pink,
    backgroundColor: theme.colors.pink + "18",
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: "center",
  },
  spinButtonText: {
    color: theme.colors.pink,
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.size.md,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    paddingTop: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  startButton: {
    backgroundColor: theme.colors.purple,
    paddingVertical: 16,
    borderRadius: theme.radius.round,
    alignItems: "center",
    shadowColor: theme.colors.purple,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  startButtonText: {
    color: "#FFF",
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.size.md,
    letterSpacing: 0.3,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.lg,
    fontFamily: theme.typography.fontFamily.regular,
  },

  // SMART mode
  modeBtnActiveSmart: {
    borderColor: theme.colors.mint,
    backgroundColor: theme.colors.mint + "18",
  },
  modeBtnLabelSmart: { color: theme.colors.mint },
  smartInfoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: theme.colors.mint + "12",
    borderWidth: 1,
    borderColor: theme.colors.mint + "40",
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  smartInfoText: {
    flex: 1,
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.mint,
    lineHeight: 18,
  },
  smartAssignButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.colors.mint,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
  },
  smartAssignButtonText: {
    color: "#0E0E0E",
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.size.md,
  },

  // Member profile badge
  memberRowWrapper: { position: "relative" },
  profileBadge: {
    position: "absolute",
    right: 0,
    top: "50%",
    transform: [{ translateY: -10 }],
    backgroundColor: theme.colors.purple + "22",
    borderRadius: theme.radius.round,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: theme.colors.purple + "44",
  },
  profileBadgeChild: {
    backgroundColor: theme.colors.mint + "22",
    borderColor: theme.colors.mint + "44",
  },
  profileBadgeText: {
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
  },

  // Profile modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: theme.spacing.lg,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    gap: 12,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: theme.typography.size.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
  },
  modalSub: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  profileOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  profileOptionActive: {
    borderColor: theme.colors.purple,
    backgroundColor: theme.colors.purple + "12",
  },
  profileOptionActiveChild: {
    borderColor: theme.colors.mint,
    backgroundColor: theme.colors.mint + "12",
  },
  profileOptionEmoji: { fontSize: 26 },
  profileOptionInfo: { flex: 1 },
  profileOptionLabel: {
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  profileOptionDesc: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
});
