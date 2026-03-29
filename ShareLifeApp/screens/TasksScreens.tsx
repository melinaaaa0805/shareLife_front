import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Animated,
  Pressable,
  TouchableOpacity,
} from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import api from "../api/api";
import { useGroup } from "../context/GroupContext";
import { useAuth } from "../context/AuthContext";
import { theme } from "../assets/style/theme";

// ─── Types ────────────────────────────────────────────────────────────────────

type MyTask = {
  id: string;
  title: string;
  description?: string | null;
  weight: number;
  dayOfWeek: number;
  duration?: number | null;
  date?: string | null;
  status: "PENDING" | "DONE";
};

const DAYS_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const WEIGHT_COLORS = ["#4CAF50", "#8BC34A", "#FFC107", "#FF9800", "#F44336"];
const WEIGHT_LABELS = ["Tranquille", "Ça va", "Moyen", "Courage…", "RELLOU"];

// ─── Task card ────────────────────────────────────────────────────────────────

function TaskCard({ task, index, onToggle }: { task: MyTask; index: number; onToggle: (id: string) => void }) {
  const slideAnim = useRef(new Animated.Value(30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const checkAnim = useRef(new Animated.Value(task.status === "DONE" ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, delay: index * 60, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 9, delay: index * 60 }),
    ]).start();
  }, []);

  const isDone = task.status === "DONE";
  const weightColor = WEIGHT_COLORS[(task.weight ?? 1) - 1] ?? WEIGHT_COLORS[0];
  const weightLabel = WEIGHT_LABELS[(task.weight ?? 1) - 1] ?? "";

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, speed: 80 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50 }),
    ]).start();
    Animated.timing(checkAnim, { toValue: isDone ? 0 : 1, duration: 200, useNativeDriver: true }).start();
    onToggle(task.id);
  };

  return (
    <Animated.View style={{ opacity: opacityAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }}>
      <Pressable
        style={[styles.taskCard, isDone && styles.taskCardDone]}
        onPress={handlePress}
        onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 80 }).start()}
        onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50 }).start()}
      >
        {/* Left accent */}
        <View style={[styles.taskAccent, { backgroundColor: isDone ? theme.colors.success + "60" : weightColor + "80" }]} />

        <View style={styles.taskContent}>
          <View style={styles.taskTop}>
            <View style={styles.taskMeta}>
              <View style={[styles.dayBadge, isDone && styles.dayBadgeDone]}>
                <Text style={[styles.dayBadgeText, isDone && styles.dayBadgeTextDone]}>
                  {DAYS_SHORT[task.dayOfWeek] ?? "—"}
                </Text>
              </View>
              {task.duration && (
                <View style={styles.durationChip}>
                  <Ionicons name="time-outline" size={10} color={theme.colors.textSecondary} />
                  <Text style={styles.durationText}>{task.duration} min</Text>
                </View>
              )}
            </View>
            {/* Check button */}
            <Animated.View style={[
              styles.checkBtn,
              { backgroundColor: isDone ? theme.colors.success + "30" : "transparent", borderColor: isDone ? theme.colors.success : theme.colors.border },
            ]}>
              <Ionicons
                name={isDone ? "checkmark-circle" : "ellipse-outline"}
                size={22}
                color={isDone ? theme.colors.success : theme.colors.textSecondary}
              />
            </Animated.View>
          </View>

          <Text style={[styles.taskTitle, isDone && styles.taskTitleDone]} numberOfLines={2}>
            {task.title}
          </Text>

          {task.description ? (
            <Text style={styles.taskDesc} numberOfLines={1}>{task.description}</Text>
          ) : null}

          {/* Weight bar */}
          <View style={styles.weightRow}>
            <View style={styles.weightBar}>
              {[1, 2, 3, 4, 5].map((n) => (
                <View
                  key={n}
                  style={[
                    styles.weightSegment,
                    { backgroundColor: n <= (task.weight ?? 1) ? weightColor : theme.colors.border },
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.weightLabel, { color: isDone ? theme.colors.textSecondary : weightColor }]}>
              {isDone ? "Terminée ✓" : weightLabel}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Filter pill ──────────────────────────────────────────────────────────────

function FilterPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.pill, active && styles.pillActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type Filter = "ALL" | "PENDING" | "DONE";

export default function TasksScreen() {
  const { currentGroup } = useGroup();
  const { user } = useAuth();
  const isFocused = useIsFocused();

  const [tasks, setTasks] = useState<MyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("ALL");
  const headerAnim = useRef(new Animated.Value(0)).current;

  const fetchTasks = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await api.get(`/task-assignment/users/${user.id}`);
      setTasks(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }, [user?.id]);

  useEffect(() => {
    if (isFocused) fetchTasks();
  }, [isFocused]);

  const handleToggle = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === "DONE") return;
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: "DONE" } : t));
    try {
      await api.patch(`/task-assignment/${taskId}/done`);
    } catch {
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: "PENDING" } : t));
    }
  };

  const filtered = tasks.filter((t) =>
    filter === "ALL" ? true : filter === "DONE" ? t.status === "DONE" : t.status === "PENDING"
  );
  const doneCount = tasks.filter((t) => t.status === "DONE").length;
  const pendingCount = tasks.filter((t) => t.status === "PENDING").length;
  const totalWeight = tasks.reduce((s, t) => s + (t.weight ?? 1), 0);
  const pct = tasks.length ? doneCount / tasks.length : 0;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, { toValue: pct, duration: 800, delay: 200, useNativeDriver: false }).start();
  }, [pct]);

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
          <Text style={styles.headerTitle}>Mes tâches</Text>
          <Text style={styles.headerSub}>
            {currentGroup?.name ?? "Semaine en cours"}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{tasks.length}</Text>
          </View>
        </View>
      </Animated.View>

      {/* Progress + stats */}
      <Animated.View style={[styles.statsCard, { opacity: headerAnim }]}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.warning }]}>{pendingCount}</Text>
            <Text style={styles.statLabel}>En cours</Text>
          </View>
          <View style={[styles.statDivider]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.success }]}>{doneCount}</Text>
            <Text style={styles.statLabel}>Terminées</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.purple }]}>{totalWeight}</Text>
            <Text style={styles.statLabel}>Charge totale</Text>
          </View>
        </View>
        <View style={styles.progressBarBg}>
          <Animated.View
            style={[
              styles.progressBarFill,
              { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) },
            ]}
          />
        </View>
        <Text style={styles.progressLabel}>
          {Math.round(pct * 100)}% accompli
        </Text>
      </Animated.View>

      {/* Filters */}
      <Animated.View style={[styles.filters, { opacity: headerAnim }]}>
        <FilterPill label="Toutes" active={filter === "ALL"} onPress={() => setFilter("ALL")} />
        <FilterPill label={`En cours · ${pendingCount}`} active={filter === "PENDING"} onPress={() => setFilter("PENDING")} />
        <FilterPill label={`Terminées · ${doneCount}`} active={filter === "DONE"} onPress={() => setFilter("DONE")} />
      </Animated.View>

      {/* List */}
      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={48} color={theme.colors.success} />
            <Text style={styles.emptyTitle}>
              {filter === "DONE" ? "Aucune tâche terminée" : "Aucune tâche en cours"}
            </Text>
            <Text style={styles.emptySub}>Tu es à jour 🎉</Text>
          </View>
        ) : (
          filtered.map((task, i) => (
            <TaskCard key={task.id} task={task} index={i} onToggle={handleToggle} />
          ))
        )}
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
  headerTitle: {
    fontSize: theme.typography.size.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
  },
  headerSub: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  headerRight: {},
  countBadge: {
    backgroundColor: theme.colors.purple + "25",
    borderRadius: theme.radius.round,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: theme.colors.purple + "50",
  },
  countBadgeText: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.purple,
  },

  statsCard: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statsRow: { flexDirection: "row", marginBottom: theme.spacing.md },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: theme.typography.size.xl, fontFamily: theme.typography.fontFamily.bold },
  statLabel: { fontSize: 10, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: theme.colors.border, marginVertical: 4 },
  progressBarBg: { height: 6, backgroundColor: theme.colors.border, borderRadius: 3, overflow: "hidden", marginBottom: 6 },
  progressBarFill: { height: "100%", backgroundColor: theme.colors.purple, borderRadius: 3 },
  progressLabel: { fontSize: 11, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.textSecondary, textAlign: "right" },

  filters: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  pill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: theme.radius.round,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  pillActive: { backgroundColor: theme.colors.purple, borderColor: theme.colors.purple },
  pillText: { fontSize: 12, fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.textSecondary },
  pillTextActive: { color: "#FFF" },

  list: { paddingHorizontal: theme.spacing.md, paddingTop: 4 },

  taskCard: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
  },
  taskCardDone: { opacity: 0.65 },
  taskAccent: { width: 4 },
  taskContent: { flex: 1, padding: 14 },
  taskTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  taskMeta: { flexDirection: "row", gap: 6, alignItems: "center" },
  dayBadge: {
    backgroundColor: theme.colors.purple + "20",
    borderRadius: theme.radius.round,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dayBadgeDone: { backgroundColor: theme.colors.border },
  dayBadgeText: { fontSize: 11, fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.purple },
  dayBadgeTextDone: { color: theme.colors.textSecondary },
  durationChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.round,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  durationText: { fontSize: 10, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textSecondary },
  checkBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  taskTitle: { fontSize: theme.typography.size.sm, fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.textPrimary, marginBottom: 4 },
  taskTitleDone: { textDecorationLine: "line-through", color: theme.colors.textSecondary },
  taskDesc: { fontSize: 12, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textSecondary, marginBottom: 8 },
  weightRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  weightBar: { flexDirection: "row", gap: 2 },
  weightSegment: { width: 16, height: 4, borderRadius: 2 },
  weightLabel: { fontSize: 10, fontFamily: theme.typography.fontFamily.medium },

  emptyState: { alignItems: "center", paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: theme.typography.size.md, fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.textPrimary },
  emptySub: { fontSize: theme.typography.size.sm, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textSecondary },
});
