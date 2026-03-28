import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Animated,
  Platform,
  Pressable,
} from "react-native";
import { useRoute, useNavigation, useIsFocused } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import api from "../api/api";
import { theme } from "../assets/style/theme";
import { useGroup } from "../context/GroupContext";
import { useAuth } from "../context/AuthContext";

const DAYS_FR_FULL = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const MONTHS_FR = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

/** Parse un YYYY-MM-DD en Date locale (évite le décalage UTC de new Date("YYYY-MM-DD")) */
function parseDateStr(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDayHeader(dateStr: string) {
  const d = parseDateStr(dateStr);
  const dayName = DAYS_FR_FULL[(d.getDay() + 6) % 7];
  const day = d.getDate();
  const month = MONTHS_FR[d.getMonth()];
  const year = d.getFullYear();
  return { dayName, dateLabel: `${day} ${month} ${year}` };
}

function isToday(dateStr: string) {
  const t = new Date();
  const todayStr = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  return todayStr === dateStr;
}

type TaskItem = {
  id: string;
  title: string;
  description?: string | null;
  duration?: number | null;
  weight?: number;
  taskAssignment?: {
    user?: { id: string; firstName?: string };
    status?: string;
  } | null;
};

function TaskCard({
  item,
  userId,
  isFunnyMode,
  isWeeklyAdmin,
  onAssign,
  onDone,
  index,
}: {
  item: TaskItem;
  userId?: string;
  isFunnyMode: boolean;
  isWeeklyAdmin: boolean;
  onAssign: (id: string) => void;
  onDone: (id: string) => void;
  index: number;
}) {
  const isAssigned = !!item.taskAssignment;
  const isMine = item.taskAssignment?.user?.id === userId;
  const status = item.taskAssignment?.status;
  const isDone = status === "DONE";
  const assigneeName = item.taskAssignment?.user?.firstName;

  const slideAnim = useRef(new Animated.Value(30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const doneScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, delay: index * 60, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 8, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleDone = () => {
    Animated.sequence([
      Animated.spring(doneScale, { toValue: 0.92, useNativeDriver: true, speed: 60 }),
      Animated.spring(doneScale, { toValue: 1, useNativeDriver: true, speed: 40 }),
    ]).start(() => onDone(item.id));
  };

  return (
    <Animated.View
      style={[
        styles.taskCard,
        isDone && styles.taskCardDone,
        isMine && !isDone && styles.taskCardMine,
        { opacity: opacityAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {/* Left accent bar */}
      <View
        style={[
          styles.cardAccentBar,
          isDone
            ? { backgroundColor: theme.colors.success }
            : isMine
            ? { backgroundColor: theme.colors.purple }
            : { backgroundColor: theme.colors.border },
        ]}
      />

      <View style={styles.cardBody}>
        {/* Top row */}
        <View style={styles.cardTopRow}>
          <Text style={[styles.taskTitle, isDone && styles.taskTitleDone]} numberOfLines={2}>
            {item.title}
          </Text>
          {isDone && (
            <View style={styles.doneBadge}>
              <Ionicons name="checkmark" size={12} color="#FFF" />
            </View>
          )}
        </View>

        {item.description ? (
          <Text style={styles.taskDesc} numberOfLines={2}>{item.description}</Text>
        ) : null}

        {/* Meta chips */}
        <View style={styles.metaRow}>
          {item.duration != null && item.duration > 0 && (
            <View style={styles.metaChip}>
              <Ionicons name="time-outline" size={11} color={theme.colors.textSecondary} />
              <Text style={styles.metaChipText}>{item.duration} min</Text>
            </View>
          )}
          {item.weight != null && item.weight > 0 && (
            <View style={styles.metaChip}>
              <Ionicons name="barbell-outline" size={11} color={theme.colors.textSecondary} />
              <Text style={styles.metaChipText}>{item.weight} pt{item.weight > 1 ? 's' : ''}</Text>
            </View>
          )}
          {isAssigned && assigneeName && !isMine && (
            <View style={[styles.metaChip, styles.assignedChip]}>
              <Ionicons name="person-outline" size={11} color={theme.colors.purple} />
              <Text style={[styles.metaChipText, { color: theme.colors.purple }]}>{assigneeName}</Text>
            </View>
          )}
          {isMine && !isDone && (
            <View style={[styles.metaChip, styles.mineChip]}>
              <Ionicons name="star" size={11} color={theme.colors.yellow} />
              <Text style={[styles.metaChipText, { color: theme.colors.yellow }]}>Ma tâche</Text>
            </View>
          )}
        </View>

        {/* Funny mode lock hint */}
        {isFunnyMode && !isWeeklyAdmin && !isAssigned && (
          <View style={styles.lockHint}>
            <Ionicons name="lock-closed-outline" size={12} color={theme.colors.textSecondary} />
            <Text style={styles.lockHintText}>Seul l'admin de la semaine peut attribuer</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {!isAssigned && (!isFunnyMode || isWeeklyAdmin) && (
            <TouchableOpacity style={styles.assignBtn} onPress={() => onAssign(item.id)} activeOpacity={0.8}>
              <Ionicons name="person-add-outline" size={13} color="#FFF" />
              <Text style={styles.assignBtnText}>S'assigner</Text>
            </TouchableOpacity>
          )}

          {isMine && !isDone && (
            <Animated.View style={{ transform: [{ scale: doneScale }] }}>
              <Pressable style={styles.doneBtn} onPress={handleDone}>
                <Ionicons name="checkmark-circle-outline" size={13} color="#FFF" />
                <Text style={styles.doneBtnText}>Marquer comme fait</Text>
              </Pressable>
            </Animated.View>
          )}

          {isDone && isMine && (
            <View style={styles.doneConfirm}>
              <Ionicons name="checkmark-circle" size={14} color={theme.colors.success} />
              <Text style={styles.doneConfirmText}>Terminé</Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

export default function DayTasksScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { date } = route.params as { date: string; dayIndex: number };

  const { currentGroup } = useGroup();
  const { user } = useAuth();
  const userId = user?.id;

  const [dayTasks, setDayTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  const isFunnyMode = currentGroup?.mode === "FUNNY";
  const isWeeklyAdmin = currentGroup?.weeklyAdmin?.id === userId;

  const headerAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(100, [
      Animated.timing(headerAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(statsAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (isFocused) fetchDayTasks();
  }, [isFocused]);

  const fetchDayTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get(`tasks/${date}/${currentGroup?.id}`);
      setDayTasks(res.data);
    } catch (e) {
      console.error("Erreur fetch tâches du jour", e);
    } finally {
      setLoading(false);
    }
  };

  const assignTask = async (taskId: string) => {
    try {
      await api.post(`task-assignment/${taskId}`);
      setDayTasks(prev =>
        prev.map(t =>
          t.id === taskId
            ? { ...t, taskAssignment: { user: { id: userId!, firstName: user?.firstName }, status: "PENDING" } }
            : t
        )
      );
    } catch (e) {
      console.error("Erreur assign tâche", e);
    }
  };

  const toggleDone = async (taskId: string) => {
    try {
      await api.patch(`tasks/${taskId}`, { status: "DONE" });
      setDayTasks(prev =>
        prev.map(t => (t.id === taskId ? { ...t, taskAssignment: { ...t.taskAssignment, status: "DONE" } } : t))
      );
    } catch (e) {
      console.error("Erreur update tâche", e);
    }
  };

  const { dayName, dateLabel } = formatDayHeader(date);
  const todayFlag = isToday(date);
  const totalTasks = dayTasks.length;
  const doneTasks = dayTasks.filter(t => t.taskAssignment?.status === "DONE").length;
  const myTasks = dayTasks.filter(t => t.taskAssignment?.user?.id === userId).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
        <View style={styles.headerLeft}>
          <View style={styles.dayNameRow}>
            <Text style={styles.dayName}>{dayName}</Text>
            {todayFlag && (
              <View style={styles.todayBadge}>
                <Text style={styles.todayBadgeText}>Aujourd'hui</Text>
              </View>
            )}
          </View>
          <Text style={styles.dateLabel}>{dateLabel}</Text>
        </View>

        {isFunnyMode && (
          <View style={[styles.modeBadge, isWeeklyAdmin && styles.modeBadgeAdmin]}>
            <Ionicons
              name={isWeeklyAdmin ? "crown" : "lock-closed"}
              size={12}
              color={isWeeklyAdmin ? theme.colors.yellow : theme.colors.textSecondary}
            />
            <Text style={[styles.modeBadgeText, isWeeklyAdmin && styles.modeBadgeTextAdmin]}>
              {isWeeklyAdmin ? "Admin" : "Mode Drôle"}
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Stats bar */}
      {totalTasks > 0 && (
        <Animated.View style={[styles.statsBar, { opacity: statsAnim }]}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalTasks}</Text>
            <Text style={styles.statLabel}>tâche{totalTasks > 1 ? "s" : ""}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.success }]}>{doneTasks}</Text>
            <Text style={styles.statLabel}>faite{doneTasks > 1 ? "s" : ""}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.purple }]}>{myTasks}</Text>
            <Text style={styles.statLabel}>à moi</Text>
          </View>

          {/* Progress bar */}
          <View style={styles.progressWrapper}>
            <View style={styles.progressBg}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0}%` as any },
                ]}
              />
            </View>
          </View>
        </Animated.View>
      )}

      {/* Task list */}
      <FlatList
        data={dayTasks}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <TaskCard
            item={item}
            userId={userId}
            isFunnyMode={isFunnyMode}
            isWeeklyAdmin={isWeeklyAdmin}
            onAssign={assignTask}
            onDone={toggleDone}
            index={index}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="sunny-outline" size={32} color={theme.colors.purple} />
              </View>
              <Text style={styles.emptyTitle}>Journée libre !</Text>
              <Text style={styles.emptySub}>Aucune tâche prévue pour cette journée.</Text>
            </View>
          ) : null
        }
      />
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
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerLeft: { flex: 1 },
  dayNameRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 2 },
  dayName: {
    fontSize: theme.typography.size.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
  },
  todayBadge: {
    backgroundColor: theme.colors.purple,
    borderRadius: theme.radius.round,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  todayBadgeText: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#FFF",
  },
  dateLabel: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  modeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.round,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 4,
  },
  modeBadgeAdmin: {
    borderColor: theme.colors.yellow + "60",
    backgroundColor: theme.colors.yellow + "12",
  },
  modeBadgeText: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textSecondary,
  },
  modeBadgeTextAdmin: { color: theme.colors.yellow },

  // Stats
  statsBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  statItem: { alignItems: "center" },
  statValue: {
    fontSize: theme.typography.size.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: theme.colors.border,
  },
  progressWrapper: { flex: 1 },
  progressBg: {
    height: 5,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.purple,
    borderRadius: 3,
  },

  // List
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: 40,
  },

  // Task card
  taskCard: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.sm,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  taskCardMine: {
    borderColor: theme.colors.purple + "50",
    backgroundColor: theme.colors.purple + "0A",
  },
  taskCardDone: {
    opacity: 0.7,
    borderColor: theme.colors.success + "40",
  },
  cardAccentBar: {
    width: 3,
    borderTopLeftRadius: theme.radius.md,
    borderBottomLeftRadius: theme.radius.md,
  },
  cardBody: {
    flex: 1,
    padding: 14,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 4,
  },
  taskTitle: {
    flex: 1,
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
    lineHeight: 22,
  },
  taskTitleDone: {
    textDecorationLine: "line-through",
    color: theme.colors.textSecondary,
  },
  doneBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  taskDesc: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },

  // Meta chips
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.round,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  assignedChip: {
    borderColor: theme.colors.purple + "40",
    backgroundColor: theme.colors.purple + "10",
  },
  mineChip: {
    borderColor: theme.colors.yellow + "40",
    backgroundColor: theme.colors.yellow + "10",
  },
  metaChipText: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
  },

  // Lock hint
  lockHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 8,
  },
  lockHintText: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    fontStyle: "italic",
  },

  // Actions
  actions: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  assignBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: theme.colors.purple,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: theme.radius.round,
  },
  assignBtnText: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: "#FFF",
  },
  doneBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: theme.colors.success,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: theme.radius.round,
  },
  doneBtnText: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: "#FFF",
  },
  doneConfirm: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  doneConfirmText: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.success,
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.purple + "18",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: theme.typography.size.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
  },
  emptySub: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
});
