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
import { getISOWeek } from "../utils/date";
import { formatDuration, getTaskIcon } from "../utils/format";
import { TemplateTask } from "../types/types";

// (TemplateTask importé depuis types/types)

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

const WEIGHT_COLORS = ["#4CAF50", "#8BC34A", "#FFC107", "#FF9800", "#F44336"];
const WEIGHT_LABELS = ["Tranquille", "Ça va", "Moyen", "Courage…", "RELLOU"];

const DAY_COLORS = [
  "#7C3AED", // Lun — violet
  "#2563EB", // Mar — bleu
  "#0891B2", // Mer — cyan
  "#059669", // Jeu — vert
  "#D97706", // Ven — ambre
  "#DC2626", // Sam — rouge
  "#7C3AED", // Dim — violet
];


// ─── Task row ─────────────────────────────────────────────────────────────────

function TaskRow({ task, index, accentColor }: { task: TemplateTask; index: number; accentColor: string }) {
  const slideAnim = useRef(new Animated.Value(16)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 1, duration: 220, delay: index * 35, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 100, friction: 12, delay: index * 35 }),
    ]).start();
  }, []);

  const wColor = WEIGHT_COLORS[(task.weight ?? 1) - 1] ?? WEIGHT_COLORS[0];
  const icon = getTaskIcon(task.title);

  return (
    <Animated.View style={[styles.taskRow, { opacity: opacityAnim, transform: [{ translateX: slideAnim }] }]}>
      {/* Accent gauche */}
      <View style={[styles.taskAccent, { backgroundColor: accentColor }]} />

      {/* Icône */}
      <View style={[styles.taskIconWrap, { backgroundColor: accentColor + "18" }]}>
        <Ionicons name={icon} size={16} color={accentColor} />
      </View>

      {/* Contenu */}
      <View style={styles.taskBody}>
        <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
        {task.description ? (
          <Text style={styles.taskDesc} numberOfLines={1}>{task.description}</Text>
        ) : null}
        <View style={styles.taskMeta}>
          {task.duration ? (
            <View style={styles.chip}>
              <Ionicons name="time-outline" size={10} color={theme.colors.textSecondary} />
              <Text style={styles.chipText}>{formatDuration(task.duration)}</Text>
            </View>
          ) : null}
          <View style={[styles.chip, { backgroundColor: wColor + "18", borderColor: wColor + "40" }]}>
            <View style={[styles.weightDot, { backgroundColor: wColor }]} />
            <Text style={[styles.chipText, { color: wColor }]}>{WEIGHT_LABELS[(task.weight ?? 1) - 1]}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Day section ──────────────────────────────────────────────────────────────

function DaySection({
  day,
  tasks,
  index,
  color,
  isDaily,
}: {
  day: string;
  tasks: TemplateTask[];
  index: number;
  color: string;
  isDaily?: boolean;
}) {
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;
  const [collapsed, setCollapsed] = useState(false);

  const totalMin = tasks.reduce((s, t) => s + (t.duration ?? 0), 0);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 1, duration: 280, delay: index * 50, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 280, delay: index * 50, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.daySection, { opacity: opacityAnim, transform: [{ translateY: slideAnim }] }]}>
      <TouchableOpacity
        style={styles.dayHeader}
        onPress={() => setCollapsed(c => !c)}
        activeOpacity={0.7}
      >
        {/* Pastille jour */}
        <View style={[styles.dayBadge, { backgroundColor: color + (isDaily ? "22" : "18"), borderColor: color + "40" }]}>
          {isDaily
            ? <Ionicons name="repeat-outline" size={13} color={color} />
            : <Text style={[styles.dayBadgeText, { color }]}>{day.substring(0, 3).toUpperCase()}</Text>
          }
        </View>

        <View style={styles.dayHeaderCenter}>
          <Text style={styles.dayName}>{day}</Text>
          {totalMin > 0 && (
            <Text style={[styles.dayTime, { color }]}>
              {formatDuration(totalMin)}
            </Text>
          )}
        </View>

        <View style={[styles.dayCountBadge, { backgroundColor: color + "20", borderColor: color + "35" }]}>
          <Text style={[styles.dayCountText, { color }]}>{tasks.length}</Text>
        </View>

        <Ionicons
          name={collapsed ? "chevron-down" : "chevron-up"}
          size={14}
          color={theme.colors.textSecondary}
          style={{ marginLeft: 6 }}
        />
      </TouchableOpacity>

      {!collapsed && tasks.map((task, i) => (
        <TaskRow key={task.id} task={task} index={i} accentColor={color} />
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

  const { week, year } = getISOWeek(new Date());

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

  const handleApply = () => {
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

  const dailyTasks = templates.filter(t => t.frequency === "DAILY");
  const tasksByDay: Record<number, TemplateTask[]> = {};
  templates
    .filter(t => t.frequency !== "DAILY")
    .forEach(t => {
      if (!tasksByDay[t.dayOfWeek]) tasksByDay[t.dayOfWeek] = [];
      tasksByDay[t.dayOfWeek].push(t);
    });

  const totalTasks = dailyTasks.length * 7 + Object.values(tasksByDay).flat().length;
  const totalMinAll = templates.reduce((s, t) => s + (t.duration ?? 0), 0);
  const avgWeight = templates.length > 0
    ? (templates.reduce((s, t) => s + (t.weight ?? 1), 0) / templates.length).toFixed(1)
    : "0";

  if (loading) {
    return (
      <View style={styles.center}>
        <Ionicons name="calendar-outline" size={36} color={theme.colors.textSecondary} />
        <Text style={styles.loadingText}>Chargement…</Text>
      </View>
    );
  }

  if (templates.length === 0) {
    return (
      <View style={styles.center}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="clipboard-outline" size={36} color={theme.colors.purple} />
        </View>
        <Text style={styles.emptyTitle}>Aucun modèle</Text>
        <Text style={styles.emptySubtitle}>
          Ajoutez des tâches en fréquence WEEKLY ou DAILY depuis l'écran des tâches pour construire votre modèle.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
        <View>
          <Text style={styles.title}>Modèle de semaine</Text>
          <Text style={styles.subtitle}>{currentGroup?.name} · Semaine {week}/{year}</Text>
        </View>
      </Animated.View>

      {/* ── Stats ── */}
      <Animated.View style={[styles.statsRow, { opacity: headerAnim }]}>
        <View style={[styles.statCard, { borderColor: theme.colors.purple + "40" }]}>
          <Text style={[styles.statValue, { color: theme.colors.purple }]}>{templates.length}</Text>
          <Text style={styles.statLabel}>modèles</Text>
        </View>
        <View style={[styles.statCard, { borderColor: theme.colors.warning + "40" }]}>
          <Text style={[styles.statValue, { color: theme.colors.warning }]}>{totalTasks}</Text>
          <Text style={styles.statLabel}>tâches/sem.</Text>
        </View>
        <View style={[styles.statCard, { borderColor: theme.colors.mint + "40" }]}>
          <Text style={[styles.statValue, { color: theme.colors.mint }]}>{formatDuration(totalMinAll)}</Text>
          <Text style={styles.statLabel}>temps/sem.</Text>
        </View>
        <View style={[styles.statCard, { borderColor: "#F59E0B40" }]}>
          <Text style={[styles.statValue, { color: "#F59E0B" }]}>{avgWeight}</Text>
          <Text style={styles.statLabel}>charge moy.</Text>
        </View>
      </Animated.View>

      {/* ── Liste ── */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Quotidien */}
        {dailyTasks.length > 0 && (
          <DaySection
            day="Quotidien"
            tasks={dailyTasks}
            index={0}
            color={theme.colors.purple}
            isDaily
          />
        )}

        {/* Par jour */}
        {[0, 1, 2, 3, 4, 5, 6].map((d, i) =>
          tasksByDay[d]?.length > 0 ? (
            <DaySection
              key={d}
              day={DAYS[d]}
              tasks={tasksByDay[d]}
              index={dailyTasks.length > 0 ? i + 1 : i}
              color={DAY_COLORS[d]}
            />
          ) : null
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Footer CTA ── */}
      <View style={styles.footer}>
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <Pressable
            style={[styles.applyBtn, applying && styles.applyBtnDisabled]}
            onPress={handleApply}
            disabled={applying}
            onPressIn={() => Animated.spring(btnScale, { toValue: 0.97, useNativeDriver: true, speed: 60 }).start()}
            onPressOut={() => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 40 }).start()}
          >
            <View style={styles.applyBtnInner}>
              <Ionicons
                name={applying ? "hourglass-outline" : "flash-outline"}
                size={20}
                color="#FFF"
              />
              <View>
                <Text style={styles.applyBtnText}>
                  {applying ? "Application en cours…" : `Appliquer à la semaine ${week}`}
                </Text>
                {!applying && (
                  <Text style={styles.applyBtnSub}>
                    {totalTasks} tâches · {formatDuration(totalMinAll)}
                  </Text>
                )}
              </View>
            </View>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  center: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 32,
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.regular,
    marginTop: 8,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
  emptySubtitle: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },

  // Header
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.size.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginTop: 3,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.md,
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: "center",
    gap: 3,
  },
  statValue: {
    fontSize: theme.typography.size.lg,
    fontFamily: theme.typography.fontFamily.bold,
  },
  statLabel: {
    fontSize: 9,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  // Scroll
  scroll: { paddingHorizontal: theme.spacing.md },

  // Day section
  daySection: {
    marginBottom: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    paddingRight: 14,
  },
  dayBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayBadgeText: {
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.bold,
    letterSpacing: 0.5,
  },
  dayHeaderCenter: {
    flex: 1,
    gap: 1,
  },
  dayName: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
  },
  dayTime: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.medium,
  },
  dayCountBadge: {
    borderRadius: theme.radius.round,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  dayCountText: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.bold,
  },

  // Task row
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10,
    marginBottom: 6,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
  },
  taskAccent: { width: 3, alignSelf: "stretch" },
  taskIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    marginVertical: 8,
  },
  taskBody: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  taskTitle: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  taskDesc: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginBottom: 5,
  },
  taskMeta: { flexDirection: "row", gap: 5, flexWrap: "wrap" },
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
  chipText: {
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
  },
  weightDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 28,
    paddingTop: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  applyBtn: {
    backgroundColor: theme.colors.purple,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: theme.radius.lg,
    shadowColor: theme.colors.purple,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  applyBtnDisabled: { backgroundColor: theme.colors.disabled, shadowOpacity: 0, elevation: 0 },
  applyBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  applyBtnText: {
    color: "#FFF",
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.bold,
  },
  applyBtnSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.regular,
    marginTop: 1,
  },
});
