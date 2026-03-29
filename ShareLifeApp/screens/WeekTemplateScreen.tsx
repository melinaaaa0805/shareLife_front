import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Animated,
  Pressable,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import api from "../api/api";
import { useGroup } from "../context/GroupContext";
import { theme } from "../assets/style/theme";

// ─── Types ────────────────────────────────────────────────────────────────────

type TemplateTask = {
  id: string;
  title: string;
  description?: string | null;
  frequency: "ONCE" | "DAILY" | "WEEKLY";
  dayOfWeek: number;
  weight: number;
  duration?: number | null;
};

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const DAYS_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const WEIGHT_COLORS = ["#4CAF50", "#8BC34A", "#FFC107", "#FF9800", "#F44336"];
const WEIGHT_LABELS = ["Tranquille", "Ça va", "Moyen", "Courage…", "RELLOU"];

function getISOWeekAndYear(d: Date) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  const week = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return { week, year: date.getFullYear() };
}

// ─── Task row ─────────────────────────────────────────────────────────────────

function TaskRow({ task, index }: { task: TemplateTask; index: number }) {
  const slideAnim = useRef(new Animated.Value(20)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 1, duration: 250, delay: index * 40, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 90, friction: 10, delay: index * 40 }),
    ]).start();
  }, []);

  const wColor = WEIGHT_COLORS[(task.weight ?? 1) - 1] ?? WEIGHT_COLORS[0];

  return (
    <Animated.View style={[styles.taskRow, { opacity: opacityAnim, transform: [{ translateX: slideAnim }] }]}>
      <View style={[styles.taskAccent, { backgroundColor: wColor }]} />
      <View style={styles.taskBody}>
        <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
        {task.description ? (
          <Text style={styles.taskDesc} numberOfLines={1}>{task.description}</Text>
        ) : null}
        <View style={styles.taskMeta}>
          {task.duration ? (
            <View style={styles.chip}>
              <Ionicons name="time-outline" size={10} color={theme.colors.textSecondary} />
              <Text style={styles.chipText}>{task.duration} min</Text>
            </View>
          ) : null}
          <View style={[styles.chip, { backgroundColor: wColor + "20", borderColor: wColor + "50" }]}>
            <Text style={[styles.chipText, { color: wColor }]}>{WEIGHT_LABELS[(task.weight ?? 1) - 1]}</Text>
          </View>
          {task.frequency === "DAILY" && (
            <View style={[styles.chip, { backgroundColor: theme.colors.purple + "20", borderColor: theme.colors.purple + "50" }]}>
              <Text style={[styles.chipText, { color: theme.colors.purple }]}>Tous les jours</Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Day section ──────────────────────────────────────────────────────────────

function DaySection({ day, tasks, index }: { day: string; tasks: TemplateTask[]; index: number }) {
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacityAnim, { toValue: 1, duration: 300, delay: index * 60, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[styles.daySection, { opacity: opacityAnim }]}>
      <View style={styles.dayHeader}>
        <View style={styles.dayDot} />
        <Text style={styles.dayName}>{day}</Text>
        <View style={styles.dayCountBadge}>
          <Text style={styles.dayCountText}>{tasks.length}</Text>
        </View>
      </View>
      {tasks.map((task, i) => (
        <TaskRow key={task.id} task={task} index={i} />
      ))}
    </Animated.View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function WeekTemplateScreen() {
  const navigation = useNavigation();
  const { currentGroup } = useGroup();
  const isFocused = useIsFocused();

  const [templates, setTemplates] = useState<TemplateTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const headerAnim = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  const { week, year } = getISOWeekAndYear(new Date());

  const fetchTemplates = useCallback(async () => {
    if (!currentGroup?.id) return;
    setLoading(true);
    try {
      const res = await api.get(`/tasks/${currentGroup.id}/template`);
      setTemplates(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }, [currentGroup?.id]);

  useEffect(() => {
    if (isFocused) fetchTemplates();
  }, [isFocused]);

  const handleApply = async () => {
    if (!currentGroup?.id) return;
    Alert.alert(
      "Appliquer le modèle",
      `Créer toutes ces tâches pour la semaine ${week} (${year}) ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Appliquer",
          onPress: async () => {
            setApplying(true);
            try {
              await api.post(`/tasks/group/${currentGroup.id}/apply-template`, { weekNumber: week, year });
              Alert.alert("C'est fait !", "Toutes les tâches ont été créées pour cette semaine.", [
                { text: "OK", onPress: () => navigation.goBack() },
              ]);
            } catch (e: any) {
              Alert.alert("Erreur", e.response?.data?.message ?? "Impossible d'appliquer le modèle.");
            } finally {
              setApplying(false);
            }
          },
        },
      ]
    );
  };

  // Organiser par jour (DAILY → affiché dans "Quotidien", WEEKLY → dans leur jour)
  const dailyTasks = templates.filter((t) => t.frequency === "DAILY");
  const tasksByDay: Record<number, TemplateTask[]> = {};
  templates
    .filter((t) => t.frequency !== "DAILY")
    .forEach((t) => {
      if (!tasksByDay[t.dayOfWeek]) tasksByDay[t.dayOfWeek] = [];
      tasksByDay[t.dayOfWeek].push(t);
    });

  const totalTasks = dailyTasks.length * 7 + Object.values(tasksByDay).flat().length;
  const totalWeight = templates.reduce((s, t) => s + (t.weight ?? 1), 0);

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
        <Text style={styles.title}>Modèle de semaine</Text>
        <Text style={styles.subtitle}>
          {currentGroup?.name} · Semaine {week}/{year}
        </Text>
      </Animated.View>

      {/* Summary */}
      <Animated.View style={[styles.summaryCard, { opacity: headerAnim }]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: theme.colors.purple }]}>{templates.length}</Text>
          <Text style={styles.summaryLabel}>modèles</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: theme.colors.warning }]}>{totalTasks}</Text>
          <Text style={styles.summaryLabel}>tâches créées</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: theme.colors.mint }]}>{totalWeight}</Text>
          <Text style={styles.summaryLabel}>charge totale</Text>
        </View>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Quotidien */}
        {dailyTasks.length > 0 && (
          <DaySection day="Quotidien (tous les jours)" tasks={dailyTasks} index={0} />
        )}

        {/* Par jour */}
        {[0, 1, 2, 3, 4, 5, 6].map((d, i) =>
          tasksByDay[d]?.length > 0 ? (
            <DaySection
              key={d}
              day={DAYS[d]}
              tasks={tasksByDay[d]}
              index={dailyTasks.length > 0 ? i + 1 : i}
            />
          ) : null
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer CTA */}
      <View style={styles.footer}>
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <Pressable
            style={[styles.applyBtn, applying && styles.applyBtnDisabled]}
            onPress={handleApply}
            disabled={applying}
            onPressIn={() => Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true, speed: 60 }).start()}
            onPressOut={() => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 40 }).start()}
          >
            <Ionicons
              name={applying ? "hourglass-outline" : "flash-outline"}
              size={20}
              color="#FFF"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.applyBtnText}>
              {applying ? "Application en cours…" : `Appliquer à la semaine ${week}`}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  center: { flex: 1, backgroundColor: theme.colors.background, alignItems: "center", justifyContent: "center" },
  loadingText: { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily.regular },

  header: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  title: { fontSize: theme.typography.size.xl, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.textPrimary },
  subtitle: { fontSize: theme.typography.size.xs, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textSecondary, marginTop: 3 },

  summaryCard: {
    flexDirection: "row",
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  summaryItem: { flex: 1, alignItems: "center", gap: 4 },
  summaryValue: { fontSize: theme.typography.size.xl, fontFamily: theme.typography.fontFamily.bold },
  summaryLabel: { fontSize: 10, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textSecondary },
  summaryDivider: { width: 1, backgroundColor: theme.colors.border, marginVertical: 4 },

  scroll: { paddingHorizontal: theme.spacing.md },

  daySection: { marginBottom: theme.spacing.md },
  dayHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  dayDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.purple },
  dayName: { flex: 1, fontSize: theme.typography.size.sm, fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.textPrimary },
  dayCountBadge: {
    backgroundColor: theme.colors.purple + "20",
    borderRadius: theme.radius.round,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  dayCountText: { fontSize: 11, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.purple },

  taskRow: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
  },
  taskAccent: { width: 3 },
  taskBody: { flex: 1, paddingHorizontal: 12, paddingVertical: 10 },
  taskTitle: { fontSize: theme.typography.size.sm, fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.textPrimary, marginBottom: 2 },
  taskDesc: { fontSize: 11, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textSecondary, marginBottom: 6 },
  taskMeta: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.round,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "transparent",
  },
  chipText: { fontSize: 10, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.textSecondary },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 28,
    paddingTop: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  applyBtn: {
    flexDirection: "row",
    backgroundColor: theme.colors.purple,
    paddingVertical: 16,
    borderRadius: theme.radius.round,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.colors.purple,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  applyBtnDisabled: { backgroundColor: theme.colors.disabled, shadowOpacity: 0, elevation: 0 },
  applyBtnText: { color: "#FFF", fontSize: theme.typography.size.md, fontFamily: theme.typography.fontFamily.bold },
});
