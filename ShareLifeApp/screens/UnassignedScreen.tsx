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
import { useRoute, RouteProp, useIsFocused } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { theme } from "../assets/style/theme";

// ─── Types ────────────────────────────────────────────────────────────────────

type UnassignedTask = {
  id: string;
  title: string;
  description?: string | null;
  weight: number;
  dayOfWeek: number;
  duration?: number | null;
  date?: string | null;
  frequency: string;
};

type RouteProps = RouteProp<{ params: { groupId: string } }, "params">;

const DAYS_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const WEIGHT_COLORS = ["#4CAF50", "#8BC34A", "#FFC107", "#FF9800", "#F44336"];
const WEIGHT_EMOJIS = ["😌", "🙂", "😐", "😓", "😵‍💫"];

// ─── Task card ────────────────────────────────────────────────────────────────

function UnassignedCard({
  task,
  index,
  onTake,
  taking,
}: {
  task: UnassignedTask;
  index: number;
  onTake: (id: string) => void;
  taking: boolean;
}) {
  const slideAnim = useRef(new Animated.Value(40)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, delay: index * 70, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 75, friction: 9, delay: index * 70 }),
    ]).start();
  }, []);

  const weightColor = WEIGHT_COLORS[(task.weight ?? 1) - 1] ?? WEIGHT_COLORS[0];
  const weightEmoji = WEIGHT_EMOJIS[(task.weight ?? 1) - 1] ?? "😌";

  return (
    <Animated.View style={{ opacity: opacityAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={styles.card}>
        {/* Top row */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.dayBadge, { backgroundColor: theme.colors.purple + "20" }]}>
              <Text style={styles.dayBadgeText}>{DAYS_SHORT[task.dayOfWeek] ?? "—"}</Text>
            </View>
            {task.duration ? (
              <View style={styles.chip}>
                <Ionicons name="time-outline" size={10} color={theme.colors.textSecondary} />
                <Text style={styles.chipText}>{task.duration} min</Text>
              </View>
            ) : null}
            <View style={styles.chip}>
              <Text style={{ fontSize: 12 }}>{weightEmoji}</Text>
            </View>
          </View>

          {/* Weight dots */}
          <View style={styles.weightDots}>
            {[1, 2, 3, 4, 5].map((n) => (
              <View
                key={n}
                style={[
                  styles.dot,
                  { backgroundColor: n <= (task.weight ?? 1) ? weightColor : theme.colors.border },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Title */}
        <Text style={styles.cardTitle} numberOfLines={2}>{task.title}</Text>
        {task.description ? (
          <Text style={styles.cardDesc} numberOfLines={2}>{task.description}</Text>
        ) : null}

        {/* Take button */}
        <Pressable
          style={({ pressed }) => [styles.takeBtn, taking && styles.takeBtnLoading, pressed && styles.takeBtnPressed]}
          onPress={() => onTake(task.id)}
          disabled={taking}
          onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, speed: 80 }).start()}
          onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50 }).start()}
        >
          <Animated.View style={{ flexDirection: "row", alignItems: "center", gap: 6, transform: [{ scale: scaleAnim }] }}>
            <Ionicons
              name={taking ? "hourglass-outline" : "hand-left-outline"}
              size={15}
              color={taking ? theme.colors.textSecondary : theme.colors.purple}
            />
            <Text style={[styles.takeBtnText, taking && { color: theme.colors.textSecondary }]}>
              {taking ? "En cours…" : "Je prends cette tâche"}
            </Text>
          </Animated.View>
        </Pressable>
      </View>
    </Animated.View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function UnassignedTasksScreen() {
  const route = useRoute<RouteProps>();
  const { groupId } = route.params;
  const { user } = useAuth();
  const isFocused = useIsFocused();

  const [tasks, setTasks] = useState<UnassignedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [takingId, setTakingId] = useState<string | null>(null);
  const headerAnim = useRef(new Animated.Value(0)).current;

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/task-assignment/unassigned/${groupId}`);
      setTasks(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }, [groupId]);

  useEffect(() => {
    if (isFocused) fetchTasks();
  }, [isFocused]);

  const handleTake = async (taskId: string) => {
    if (!user?.id || takingId) return;
    setTakingId(taskId);
    // Optimistic: remove from list
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await api.post(`/task-assignment/${taskId}`);
    } catch (err: any) {
      // Revert on error
      fetchTasks();
    } finally {
      setTakingId(null);
    }
  };

  const totalWeight = tasks.reduce((s, t) => s + (t.weight ?? 1), 0);

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
          <Text style={styles.headerTitle}>Tâches disponibles</Text>
          <Text style={styles.headerSub}>Prends une tâche pour ton groupe</Text>
        </View>
        {tasks.length > 0 && (
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{tasks.length} restante{tasks.length > 1 ? "s" : ""}</Text>
            </View>
          </View>
        )}
      </Animated.View>

      {/* Summary */}
      {tasks.length > 0 && (
        <Animated.View style={[styles.summaryCard, { opacity: headerAnim }]}>
          <View style={styles.summaryItem}>
            <Ionicons name="list-outline" size={18} color={theme.colors.warning} />
            <Text style={styles.summaryValue}>{tasks.length}</Text>
            <Text style={styles.summaryLabel}>tâches</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Ionicons name="barbell-outline" size={18} color={theme.colors.purple} />
            <Text style={styles.summaryValue}>{totalWeight}</Text>
            <Text style={styles.summaryLabel}>charge totale</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Ionicons name="trending-up-outline" size={18} color={theme.colors.mint} />
            <Text style={styles.summaryValue}>{(totalWeight / tasks.length).toFixed(1)}</Text>
            <Text style={styles.summaryLabel}>charge moy.</Text>
          </View>
        </Animated.View>
      )}

      {/* List */}
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="star-outline" size={52} color={theme.colors.success} />
            <Text style={styles.emptyTitle}>Tout est assigné !</Text>
            <Text style={styles.emptySub}>Toutes les tâches ont été prises en charge.</Text>
          </View>
        ) : (
          tasks.map((task, i) => (
            <UnassignedCard
              key={task.id}
              task={task}
              index={i}
              onTake={handleTake}
              taking={takingId === task.id}
            />
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
  headerTitle: { fontSize: theme.typography.size.xl, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.textPrimary },
  headerSub: { fontSize: theme.typography.size.xs, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textSecondary, marginTop: 2 },
  badgeRow: {},
  badge: {
    backgroundColor: theme.colors.warning + "20",
    borderRadius: theme.radius.round,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: theme.colors.warning + "50",
  },
  badgeText: { fontSize: 12, fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.warning },

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
  summaryValue: { fontSize: theme.typography.size.lg, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.textPrimary },
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
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  dayBadge: {
    borderRadius: theme.radius.round,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  dayBadgeText: { fontSize: 11, fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.purple },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.round,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  chipText: { fontSize: 10, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textSecondary },
  weightDots: { flexDirection: "row", gap: 3 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  cardTitle: { fontSize: theme.typography.size.sm, fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.textPrimary, marginBottom: 4 },
  cardDesc: { fontSize: 12, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textSecondary, marginBottom: 12 },

  takeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.purple + "60",
    backgroundColor: theme.colors.purple + "12",
    marginTop: 8,
  },
  takeBtnLoading: { borderColor: theme.colors.border, backgroundColor: "transparent" },
  takeBtnPressed: { backgroundColor: theme.colors.purple + "25" },
  takeBtnText: { fontSize: 13, fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.purple },

  emptyState: { alignItems: "center", paddingVertical: 70, gap: 12 },
  emptyTitle: { fontSize: theme.typography.size.md, fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.textPrimary },
  emptySub: { fontSize: theme.typography.size.sm, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textSecondary, textAlign: "center", paddingHorizontal: 20 },
});
