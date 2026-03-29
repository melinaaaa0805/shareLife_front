import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import api from "../api/api";
import { theme } from "../assets/style/theme";
import { GroupMember, MemberProfile, TaskType } from "../types/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getISOWeek(d: Date): { week: number; year: number } {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  const week =
    Math.round(
      ((date.getTime() - week1.getTime()) / 86400000 +
        ((week1.getDay() + 6) % 7)) /
        7
    ) + 1;
  return { week, year: date.getFullYear() };
}

const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const TASK_TYPE_META: Record<TaskType, { emoji: string; label: string; color: string }> = {
  FAMILY:      { emoji: "👨‍👩‍👧‍👦", label: "Famille",       color: theme.colors.mint },
  ADULT:       { emoji: "🧑",        label: "Adulte",         color: theme.colors.purple },
  ADULT_CHILD: { emoji: "🤝",        label: "Adulte & Enfant", color: theme.colors.yellow },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface UnassignedTask {
  id: string;
  title: string;
  description?: string | null;
  weight?: number;
  duration?: number | null;
  dayOfWeek?: number;
  taskType?: TaskType;
}

interface MemberWithProfile extends GroupMember {
  profile: MemberProfile;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SmartAssignScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { groupId } = route.params as { groupId: string };

  const { week: currentWeek, year: currentYear } = getISOWeek(new Date());

  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [unassigned, setUnassigned] = useState<UnassignedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [done, setDone] = useState(false);
  const [assignedCount, setAssignedCount] = useState(0);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(30)).current;
  const successScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(cardAnim, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
    ]).start();
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [membersRes, unassignedRes] = await Promise.all([
        api.get(`/group-member/${groupId}`),
        api.get(`/task-assignment/unassigned/${groupId}`),
      ]);
      const membersData: MemberWithProfile[] = (membersRes.data ?? []).map((m: any) => ({
        id: m.id,
        firstName: m.firstName,
        email: m.email,
        profile: m.profile ?? "ADULT",
      }));
      setMembers(membersData);
      setUnassigned(unassignedRes.data ?? []);
    } catch {
      Alert.alert("Erreur", "Impossible de charger les données.");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (unassigned.length === 0) {
      Alert.alert("Aucune tâche", "Toutes les tâches de la semaine sont déjà assignées.");
      return;
    }
    setAssigning(true);
    try {
      const res = await api.post(`/groups/${groupId}/smart-assign`, {
        weekNumber: currentWeek,
        year: currentYear,
      });
      const count: number = res.data?.assigned ?? 0;
      setAssignedCount(count);
      setDone(true);
      Animated.spring(successScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }).start();
    } catch {
      Alert.alert("Erreur", "La répartition a échoué. Réessayez.");
    } finally {
      setAssigning(false);
    }
  };

  const adultsCount = members.filter((m) => m.profile === "ADULT").length;
  const childrenCount = members.filter((m) => m.profile === "CHILD").length;

  const familyTasks = unassigned.filter((t) => !t.taskType || t.taskType === "FAMILY").length;
  const adultTasks = unassigned.filter((t) => t.taskType === "ADULT").length;
  const adultChildTasks = unassigned.filter((t) => t.taskType === "ADULT_CHILD").length;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.purple} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerAnim }]}>
          <Text style={styles.screenTitle}>Répartition intelligente</Text>
          <Text style={styles.screenSub}>Semaine {currentWeek} · {currentYear}</Text>
        </Animated.View>

        <Animated.View style={{ transform: [{ translateY: cardAnim }] }}>

          {/* Résumé membres */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              <Ionicons name="people-outline" size={14} color={theme.colors.purple} /> Membres du groupe
            </Text>
            <View style={styles.profileSummaryRow}>
              <View style={styles.profileStat}>
                <Text style={styles.profileStatEmoji}>🧑</Text>
                <Text style={styles.profileStatCount}>{adultsCount}</Text>
                <Text style={styles.profileStatLabel}>Adulte{adultsCount > 1 ? "s" : ""}</Text>
              </View>
              <View style={styles.profileStatDivider} />
              <View style={styles.profileStat}>
                <Text style={styles.profileStatEmoji}>👶</Text>
                <Text style={[styles.profileStatCount, { color: theme.colors.mint }]}>{childrenCount}</Text>
                <Text style={styles.profileStatLabel}>Enfant{childrenCount > 1 ? "s" : ""}</Text>
              </View>
            </View>
            {members.map((m) => (
              <View key={m.id} style={styles.memberRow}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>{m.firstName[0].toUpperCase()}</Text>
                </View>
                <Text style={styles.memberName}>{m.firstName}</Text>
                <View style={[styles.profileTag, m.profile === "CHILD" && styles.profileTagChild]}>
                  <Text style={styles.profileTagText}>
                    {m.profile === "CHILD" ? "👶 Enfant" : "🧑 Adulte"}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Résumé tâches */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              <Ionicons name="list-outline" size={14} color={theme.colors.purple} /> Tâches à assigner ({unassigned.length})
            </Text>
            <View style={styles.taskTypeSummary}>
              {[
                { count: familyTasks,     type: "FAMILY" as TaskType },
                { count: adultTasks,      type: "ADULT" as TaskType },
                { count: adultChildTasks, type: "ADULT_CHILD" as TaskType },
              ].map(({ count, type }) => {
                const meta = TASK_TYPE_META[type];
                return (
                  <View key={type} style={styles.taskTypeStat}>
                    <Text style={styles.taskTypeEmoji}>{meta.emoji}</Text>
                    <Text style={[styles.taskTypeCount, { color: meta.color }]}>{count}</Text>
                    <Text style={styles.taskTypeLabel}>{meta.label}</Text>
                  </View>
                );
              })}
            </View>

            {unassigned.slice(0, 8).map((task) => {
              const meta = TASK_TYPE_META[task.taskType ?? "FAMILY"];
              return (
                <View key={task.id} style={styles.taskRow}>
                  <Text style={styles.taskTypeTagEmoji}>{meta.emoji}</Text>
                  <View style={styles.taskInfo}>
                    <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
                    <View style={styles.taskMeta}>
                      {task.dayOfWeek != null && (
                        <Text style={styles.taskMetaText}>{DAYS_FR[task.dayOfWeek]}</Text>
                      )}
                      {task.weight != null && (
                        <Text style={styles.taskMetaText}>⚖️ {task.weight}</Text>
                      )}
                      {task.duration != null && (
                        <Text style={styles.taskMetaText}>⏱ {task.duration} min</Text>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
            {unassigned.length > 8 && (
              <Text style={styles.moreText}>+ {unassigned.length - 8} autres tâches…</Text>
            )}
          </View>

          {/* Algo explication */}
          <View style={styles.algoBox}>
            <Ionicons name="flash-outline" size={16} color={theme.colors.yellow} />
            <View style={styles.algoText}>
              <Text style={styles.algoTitle}>Comment ça marche ?</Text>
              <Text style={styles.algoDesc}>
                Chaque tâche est attribuée au membre avec le score de charge le plus faible.{"\n"}
                Score = poids × (1 + durée / 60){"\n"}
                • Famille → tout le monde{"\n"}
                • Adulte → adultes seulement{"\n"}
                • Adulte & Enfant → 1 adulte + 1 enfant
              </Text>
            </View>
          </View>

          {/* Succès */}
          {done && (
            <Animated.View style={[styles.successCard, { transform: [{ scale: successScale }] }]}>
              <Ionicons name="checkmark-circle" size={48} color={theme.colors.mint} />
              <Text style={styles.successTitle}>Répartition effectuée !</Text>
              <Text style={styles.successSub}>
                {assignedCount} tâche{assignedCount > 1 ? "s" : ""} attribuée{assignedCount > 1 ? "s" : ""} équitablement.
              </Text>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.backBtnText}>Retour au groupe</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {!done && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.assignBtn, assigning && styles.assignBtnDisabled]}
            onPress={handleAssign}
            disabled={assigning || unassigned.length === 0}
            activeOpacity={0.85}
          >
            {assigning ? (
              <ActivityIndicator size="small" color="#0E0E0E" />
            ) : (
              <>
                <Ionicons name="flash" size={18} color="#0E0E0E" />
                <Text style={styles.assignBtnText}>
                  Attribuer {unassigned.length} tâche{unassigned.length > 1 ? "s" : ""} automatiquement
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.background },
  scroll: { padding: theme.spacing.lg },

  header: { marginBottom: theme.spacing.lg },
  screenTitle: {
    fontSize: theme.typography.size.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
  },
  screenSub: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },

  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    gap: 10,
  },
  cardTitle: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  profileSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
    paddingVertical: 8,
  },
  profileStat: { alignItems: "center", gap: 4 },
  profileStatEmoji: { fontSize: 28 },
  profileStatCount: {
    fontSize: theme.typography.size.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.purple,
  },
  profileStatLabel: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  profileStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.border,
  },

  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.purple + "22",
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatarText: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.purple,
  },
  memberName: {
    flex: 1,
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textPrimary,
  },
  profileTag: {
    backgroundColor: theme.colors.purple + "18",
    borderRadius: theme.radius.round,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: theme.colors.purple + "40",
  },
  profileTagChild: {
    backgroundColor: theme.colors.mint + "18",
    borderColor: theme.colors.mint + "40",
  },
  profileTagText: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
  },

  taskTypeSummary: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  taskTypeStat: { alignItems: "center", gap: 4 },
  taskTypeEmoji: { fontSize: 22 },
  taskTypeCount: {
    fontSize: theme.typography.size.lg,
    fontFamily: theme.typography.fontFamily.bold,
  },
  taskTypeLabel: {
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },

  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  taskTypeTagEmoji: { fontSize: 18, width: 24, textAlign: "center" },
  taskInfo: { flex: 1 },
  taskTitle: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textPrimary,
  },
  taskMeta: { flexDirection: "row", gap: 8, marginTop: 2 },
  taskMetaText: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  moreText: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: "center",
    paddingTop: 4,
  },

  algoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: theme.colors.yellow + "10",
    borderWidth: 1,
    borderColor: theme.colors.yellow + "40",
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  algoText: { flex: 1 },
  algoTitle: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.yellow,
    marginBottom: 6,
  },
  algoDesc: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },

  successCard: {
    backgroundColor: theme.colors.mint + "14",
    borderWidth: 1,
    borderColor: theme.colors.mint + "50",
    borderRadius: theme.radius.md,
    padding: theme.spacing.xl,
    alignItems: "center",
    gap: 12,
    marginBottom: theme.spacing.md,
  },
  successTitle: {
    fontSize: theme.typography.size.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
  },
  successSub: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  backBtn: {
    marginTop: 8,
    backgroundColor: theme.colors.mint,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: theme.radius.round,
  },
  backBtnText: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#0E0E0E",
  },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.lg,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  assignBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: theme.colors.mint,
    paddingVertical: 16,
    borderRadius: theme.radius.round,
    shadowColor: theme.colors.mint,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  assignBtnDisabled: { opacity: 0.6 },
  assignBtnText: {
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#0E0E0E",
  },
});
