import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from "react-native";
import { useRoute, RouteProp, useIsFocused } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { theme } from "../assets/style/theme";

// ─── Types ────────────────────────────────────────────────────────────────────

type Member = {
  id: string;
  firstName: string;
  email: string;
};

type WeekTask = {
  id: string;
  title: string;
  weight: number;
  dayOfWeek: number;
  done: boolean;
  assignedUser: { id: string; firstName: string; email: string } | null;
};

type MemberStats = {
  member: Member;
  tasks: WeekTask[];
  totalWeight: number;
  doneCount: number;
  isMe: boolean;
};

type RouteProps = RouteProp<{ params: { groupId: string } }, "params">;

const DAYS_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const PALETTE = ["#9B7BEA", "#EAB1CF", "#FFE27A", "#A6D8C0", "#7BC8EA", "#EA9B7B"];
const WEIGHT_COLORS = ["#4CAF50", "#8BC34A", "#FFC107", "#FF9800", "#F44336"];

function getISOWeekAndYear(d: Date) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  const week = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return { week, year: date.getFullYear() };
}

// ─── Animated progress bar ────────────────────────────────────────────────────

function ProgressBar({ value, color, delay }: { value: number; color: string; delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: value, duration: 700, delay, useNativeDriver: false }).start();
  }, [value]);
  return (
    <View style={barStyles.bg}>
      <Animated.View
        style={[
          barStyles.fill,
          {
            width: anim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

const barStyles = StyleSheet.create({
  bg: { height: 5, backgroundColor: theme.colors.border, borderRadius: 3, overflow: "hidden", flex: 1 },
  fill: { height: "100%", borderRadius: 3 },
});

// ─── Member card ──────────────────────────────────────────────────────────────

function MemberCard({
  stats,
  index,
  expanded,
  onToggle,
}: {
  stats: MemberStats;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { member, tasks, totalWeight, doneCount, isMe } = stats;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const expandAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 1, duration: 350, delay: index * 80, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 75, friction: 9, delay: index * 80 }),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(expandAnim, { toValue: expanded ? 1 : 0, duration: 250, useNativeDriver: false }),
      Animated.timing(rotateAnim, { toValue: expanded ? 1 : 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [expanded]);

  const color = PALETTE[index % PALETTE.length];
  const initials = (member.firstName?.[0] ?? member.email?.[0] ?? "?").toUpperCase();
  const pct = tasks.length > 0 ? doneCount / tasks.length : 0;

  // Mental load: average weight of assigned tasks (1–5 scale)
  const avgWeight = tasks.length > 0 ? totalWeight / tasks.length : 0;
  const loadColor = WEIGHT_COLORS[Math.round(avgWeight) - 1] ?? theme.colors.border;
  const loadLabel = ["", "Légère", "Normale", "Élevée", "Lourde", "Extrême"][Math.round(avgWeight)] ?? "—";

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });

  const maxExpandHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.max(tasks.length * 46 + 8, 60)],
  });

  return (
    <Animated.View style={[styles.card, { opacity: opacityAnim, transform: [{ translateY: slideAnim }] }]}>
      <TouchableOpacity onPress={onToggle} activeOpacity={0.8}>
        <View style={styles.cardTop}>
          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: color + "25", borderColor: color + "60" }]}>
            <Text style={[styles.avatarText, { color }]}>{initials}</Text>
            {isMe && (
              <View style={[styles.meBadge, { backgroundColor: color }]}>
                <Text style={styles.meText}>moi</Text>
              </View>
            )}
          </View>

          {/* Info */}
          <View style={styles.memberInfo}>
            <View style={styles.memberNameRow}>
              <Text style={styles.memberName}>{member.firstName || member.email}</Text>
              <Animated.View style={{ transform: [{ rotate }] }}>
                <Ionicons name="chevron-down" size={16} color={theme.colors.textSecondary} />
              </Animated.View>
            </View>

            {/* Task count + progress */}
            <View style={styles.progressRow}>
              <ProgressBar value={pct} color={color} delay={200 + index * 80} />
              <Text style={styles.progressLabel}>{doneCount}/{tasks.length}</Text>
            </View>

            {/* Stats row */}
            <View style={styles.statsChips}>
              {/* Mental load */}
              <View style={[styles.loadChip, { backgroundColor: loadColor + "20", borderColor: loadColor + "50" }]}>
                <Ionicons name="barbell-outline" size={10} color={loadColor} />
                <Text style={[styles.loadText, { color: loadColor }]}>
                  {tasks.length > 0 ? `${loadLabel} (${avgWeight.toFixed(1)})` : "Aucune tâche"}
                </Text>
              </View>

              {/* Task count */}
              <View style={styles.chip}>
                <Ionicons name="list-outline" size={10} color={theme.colors.textSecondary} />
                <Text style={styles.chipText}>{tasks.length} tâche{tasks.length > 1 ? "s" : ""}</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Expanded task list */}
      <Animated.View style={{ maxHeight: maxExpandHeight, overflow: "hidden" }}>
        <View style={styles.taskList}>
          {tasks.length === 0 ? (
            <Text style={styles.noTaskText}>Aucune tâche assignée cette semaine</Text>
          ) : (
            tasks.map((task) => {
              const wColor = WEIGHT_COLORS[(task.weight ?? 1) - 1] ?? WEIGHT_COLORS[0];
              return (
                <View key={task.id} style={[styles.taskRow, task.done && styles.taskRowDone]}>
                  <Ionicons
                    name={task.done ? "checkmark-circle" : "ellipse-outline"}
                    size={16}
                    color={task.done ? theme.colors.success : theme.colors.textSecondary}
                  />
                  <Text style={[styles.taskTitle, task.done && styles.taskTitleDone]} numberOfLines={1}>
                    {task.title}
                  </Text>
                  <View style={styles.taskRight}>
                    <Text style={styles.taskDay}>{DAYS_SHORT[task.dayOfWeek] ?? "—"}</Text>
                    <View style={[styles.weightDot, { backgroundColor: wColor }]} />
                  </View>
                </View>
              );
            })
          )}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function GroupMembersScreen() {
  const route = useRoute<RouteProps>();
  const { groupId } = route.params;
  const { user } = useAuth();
  const isFocused = useIsFocused();

  const [memberStats, setMemberStats] = useState<MemberStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const headerAnim = useRef(new Animated.Value(0)).current;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { week, year } = getISOWeekAndYear(new Date());
      const [membersRes, tasksRes] = await Promise.all([
        api.get(`/group-member/${groupId}`),
        api.get(`/tasks/week/${groupId}/${year}/${week}`),
      ]);

      const members: Member[] = (membersRes.data || []).map((m: any) => ({
        id: m.id ?? m.userId,
        firstName: m.firstName,
        email: m.email,
      }));

      const tasks: WeekTask[] = tasksRes.data || [];

      const stats = members.map((member) => {
        const myTasks = tasks.filter((t) => t.assignedUser?.id === member.id);
        const totalWeight = myTasks.reduce((s, t) => s + (t.weight ?? 1), 0);
        const doneCount = myTasks.filter((t) => t.done).length;
        return {
          member,
          tasks: myTasks,
          totalWeight,
          doneCount,
          isMe: member.id === user?.id,
        };
      });

      // Sort: me first, then by total weight desc
      stats.sort((a, b) => {
        if (a.isMe) return -1;
        if (b.isMe) return 1;
        return b.totalWeight - a.totalWeight;
      });

      setMemberStats(stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }, [groupId, user?.id]);

  useEffect(() => {
    if (isFocused) fetchData();
  }, [isFocused]);

  const totalTasks = memberStats.reduce((s, m) => s + m.tasks.length, 0);
  const totalDone = memberStats.reduce((s, m) => s + m.doneCount, 0);
  const unassigned = memberStats.length > 0
    ? (memberStats[0]?.tasks?.length !== undefined ? 0 : 0) // placeholder
    : 0;

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Chargement…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
        <View>
          <Text style={styles.headerTitle}>Membres</Text>
          <Text style={styles.headerSub}>{memberStats.length} personne{memberStats.length > 1 ? "s" : ""} dans le groupe</Text>
        </View>
        <View style={styles.memberCountBadge}>
          <Ionicons name="people-outline" size={14} color={theme.colors.mint} />
          <Text style={styles.memberCountText}>{memberStats.length}</Text>
        </View>
      </Animated.View>

      {/* Summary */}
      <Animated.View style={[styles.summaryCard, { opacity: headerAnim }]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: theme.colors.purple }]}>{totalTasks}</Text>
          <Text style={styles.summaryLabel}>tâches assignées</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: theme.colors.success }]}>{totalDone}</Text>
          <Text style={styles.summaryLabel}>terminées</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: theme.colors.warning }]}>
            {totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0}%
          </Text>
          <Text style={styles.summaryLabel}>progression</Text>
        </View>
      </Animated.View>

      {/* Member cards */}
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {memberStats.map((stats, i) => (
          <MemberCard
            key={stats.member.id}
            stats={stats}
            index={i}
            expanded={expandedId === stats.member.id}
            onToggle={() => setExpandedId(expandedId === stats.member.id ? null : stats.member.id)}
          />
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  center: { flex: 1, backgroundColor: theme.colors.background, alignItems: "center", justifyContent: "center" },
  loadingText: { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily.regular },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  headerTitle: { fontSize: theme.typography.size.xl, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.textPrimary },
  headerSub: { fontSize: theme.typography.size.xs, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textSecondary, marginTop: 2 },
  memberCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: theme.colors.mint + "20",
    borderRadius: theme.radius.round,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: theme.colors.mint + "50",
  },
  memberCountText: { fontSize: 13, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.mint },

  summaryCard: {
    flexDirection: "row",
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  summaryItem: { flex: 1, alignItems: "center", gap: 4 },
  summaryValue: { fontSize: theme.typography.size.lg, fontFamily: theme.typography.fontFamily.bold },
  summaryLabel: { fontSize: 10, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textSecondary },
  summaryDivider: { width: 1, backgroundColor: theme.colors.border, marginVertical: 4 },

  list: { paddingHorizontal: theme.spacing.md, paddingTop: 4 },

  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTop: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    position: "relative",
  },
  avatarText: { fontSize: 18, fontFamily: theme.typography.fontFamily.bold },
  meBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    borderRadius: theme.radius.round,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  meText: { fontSize: 8, fontFamily: theme.typography.fontFamily.bold, color: "#000" },

  memberInfo: { flex: 1 },
  memberNameRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  memberName: { fontSize: theme.typography.size.sm, fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.textPrimary },

  progressRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  progressLabel: { fontSize: 11, fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.textSecondary, minWidth: 28, textAlign: "right" },

  statsChips: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  loadChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: theme.radius.round,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  loadText: { fontSize: 10, fontFamily: theme.typography.fontFamily.semiBold },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.round,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: { fontSize: 10, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textSecondary },

  // Task list (expanded)
  taskList: { paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.colors.border, marginTop: 10 },
  noTaskText: { fontSize: 12, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textSecondary, textAlign: "center", paddingVertical: 8 },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  taskRowDone: { opacity: 0.55 },
  taskTitle: {
    flex: 1,
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textPrimary,
  },
  taskTitleDone: { textDecorationLine: "line-through", color: theme.colors.textSecondary },
  taskRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  taskDay: { fontSize: 11, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textSecondary },
  weightDot: { width: 8, height: 8, borderRadius: 4 },
});
