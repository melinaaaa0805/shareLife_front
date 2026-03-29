import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  Animated,
  Platform,
  UIManager,
  Pressable,
} from "react-native";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import api from "../api/api";
import { theme } from "../assets/style/theme";
import { useGroup } from "../context/GroupContext";
import { useWeek } from "../context/WeekContext";
import { RootStackParamList } from "../types/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type Task = {
  id: string;
  title: string;
  description?: string | null;
  duration: number | null;
  frequency: "ONCE" | "DAILY" | "WEEKLY";
  weekNumber: number;
  year: number;
  dayOfWeek: number;
  date: string | null;
  completedAt?: string | null;
};

const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const DAYS_FR_FULL = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function CalendarScreen() {
  const today = new Date();
  const todayStr = toLocalDateStr(today);
  const navigation = useNavigation<NavigationProp>();
  const isFocused = useIsFocused();
  const { currentGroup } = useGroup();
  const groupId = currentGroup?.id;
  const { week, year, goToPrevWeek, goToNextWeek, goToToday, isCurrentWeek } = useWeek();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const listAnim = useRef(new Animated.Value(20)).current;
  const listOpacity = useRef(new Animated.Value(0)).current;
  const modalAnim = useRef(new Animated.Value(300)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(listOpacity, { toValue: 1, duration: 400, useNativeDriver: true, delay: 100 }),
      Animated.spring(listAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 8, delay: 100 }),
    ]).start();
  }, []);

  useEffect(() => {
    if (groupId) loadTasks();
  }, [week, year, isFocused, groupId]);

  const loadTasks = async () => {
    try {
      const res = await api.get(`/tasks/week/${groupId}/${year}/${week}`);
      setTasks(res.data);
    } catch (e) {
      console.error("Erreur chargement tâches", e);
    }
  };

  const weekDates = getWeekDatesFromISO(year, week);

  const openModal = () => {
    setModalVisible(true);
    Animated.spring(modalAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 9 }).start();
  };
  const closeModal = () => {
    Animated.timing(modalAnim, { toValue: 300, duration: 200, useNativeDriver: true }).start(() =>
      setModalVisible(false)
    );
  };

  const handleCreateTask = () => { closeModal(); setTimeout(() => navigation.navigate("AddTask", { task: undefined }), 220); };
  const handleImportTask = () => { closeModal(); setTimeout(() => navigation.navigate("ImportTask", { day: todayStr }), 220); };

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.completedAt).length;
  const progressPct = totalTasks > 0 ? doneTasks / totalTasks : 0;

  const renderDayCard = ({ item, index }: { item: string; index: number }) => {
    const dayTasks = tasks.filter(t => t.date === item);
    const isToday = item === todayStr;
    const doneCount = dayTasks.filter(t => t.completedAt).length;
    const pendingCount = dayTasks.length - doneCount;

    return (
      <TouchableOpacity
        style={[styles.dayCard, isToday && styles.dayCardToday]}
        onPress={() => navigation.navigate("DayTasks", { date: item, dayIndex: index })}
        activeOpacity={0.75}
      >
        {isToday && <View style={styles.dayCardAccent} />}

        <View style={styles.dayCardHeader}>
          <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
            {DAYS_FR[index]}
          </Text>
          {isToday && (
            <View style={styles.todayBadge}>
              <Text style={styles.todayBadgeText}>Auj.</Text>
            </View>
          )}
        </View>

        <Text style={[styles.dateText, isToday && styles.dateTextToday]}>
          {formatShortDate(item)}
        </Text>

        <View style={styles.tasksSummary}>
          {dayTasks.length === 0 ? (
            <Text style={styles.noTask}>Libre</Text>
          ) : (
            <>
              {pendingCount > 0 && (
                <View style={styles.taskChip}>
                  <View style={[styles.taskDot, { backgroundColor: theme.colors.warning }]} />
                  <Text style={styles.taskChipText}>{pendingCount}</Text>
                </View>
              )}
              {doneCount > 0 && (
                <View style={styles.taskChip}>
                  <View style={[styles.taskDot, { backgroundColor: theme.colors.success }]} />
                  <Text style={styles.taskChipText}>{doneCount}</Text>
                </View>
              )}
            </>
          )}
        </View>

        {dayTasks.length > 0 && (
          <View style={styles.taskList}>
            {dayTasks.slice(0, 3).map(task => (
              <View key={task.id} style={styles.taskRow}>
                <Ionicons
                  name={task.completedAt ? "checkmark-circle" : "ellipse-outline"}
                  size={13}
                  color={task.completedAt ? theme.colors.success : theme.colors.textSecondary}
                />
                <Text
                  style={[styles.taskTitle, task.completedAt && styles.taskTitleDone]}
                  numberOfLines={1}
                >
                  {task.title}
                </Text>
              </View>
            ))}
            {dayTasks.length > 3 && (
              <Text style={styles.moreText}>+{dayTasks.length - 3} autres</Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Week header */}
      <Animated.View style={[styles.weekHeader, { opacity: headerAnim }]}>
        <TouchableOpacity style={styles.arrowBtn} onPress={goToPrevWeek}>
          <Ionicons name="chevron-back" size={20} color={theme.colors.purple} />
        </TouchableOpacity>

        <TouchableOpacity onPress={goToToday} activeOpacity={0.7} style={styles.weekTitleWrapper}>
          <Text style={styles.weekTitle}>Semaine {week}</Text>
          <Text style={styles.weekRange}>{getWeekRangeLabel(year, week)}</Text>
          {!isCurrentWeek && (
            <View style={styles.backTodayPill}>
              <Text style={styles.backTodayText}>Revenir à aujourd'hui</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.arrowBtn} onPress={goToNextWeek}>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.purple} />
        </TouchableOpacity>
      </Animated.View>

      {/* Progress bar */}
      {totalTasks > 0 && (
        <Animated.View style={[styles.progressBar, { opacity: headerAnim }]}>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${progressPct * 100}%` as any }]} />
          </View>
          <Text style={styles.progressLabel}>
            {doneTasks}/{totalTasks} tâche{totalTasks > 1 ? 's' : ''} faite{doneTasks > 1 ? 's' : ''}
          </Text>
        </Animated.View>
      )}

      {/* Grid */}
      <Animated.View
        style={{ flex: 1, opacity: listOpacity, transform: [{ translateY: listAnim }] }}
      >
        <FlatList
          data={weekDates}
          renderItem={renderDayCard}
          keyExtractor={item => item}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </Animated.View>

      {/* FAB */}
      <Animated.View style={[styles.fabWrapper, { transform: [{ scale: btnScale }] }]}>
        <Pressable
          style={styles.fab}
          onPress={openModal}
          onPressIn={() =>
            Animated.spring(btnScale, { toValue: 0.9, useNativeDriver: true, speed: 50 }).start()
          }
          onPressOut={() =>
            Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 30 }).start()
          }
        >
          <Ionicons name="add" size={28} color="#FFF" />
        </Pressable>
      </Animated.View>

      {/* Bottom sheet modal */}
      <Modal visible={modalVisible} transparent animationType="none" onRequestClose={closeModal}>
        <Pressable style={styles.modalOverlay} onPress={closeModal}>
          <Animated.View
            style={[styles.modalSheet, { transform: [{ translateY: modalAnim }] }]}
          >
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Ajouter une tâche</Text>

            <TouchableOpacity style={styles.modalOption} onPress={handleCreateTask}>
              <View style={styles.modalOptionIcon}>
                <Ionicons name="create-outline" size={20} color={theme.colors.purple} />
              </View>
              <View style={styles.modalOptionText}>
                <Text style={styles.modalOptionTitle}>Nouvelle tâche</Text>
                <Text style={styles.modalOptionSub}>Créer une tâche de zéro</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOption} onPress={handleImportTask}>
              <View style={styles.modalOptionIcon}>
                <Ionicons name="copy-outline" size={20} color={theme.colors.mint} />
              </View>
              <View style={styles.modalOptionText}>
                <Text style={styles.modalOptionTitle}>Importer une tâche</Text>
                <Text style={styles.modalOptionSub}>Réutiliser une tâche existante</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}

// ---- Utils ----

/** Formate une Date locale en YYYY-MM-DD sans passer par UTC */
function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Parse un YYYY-MM-DD en Date locale (évite le décalage UTC de new Date("YYYY-MM-DD")) */
function parseDateStr(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function getWeekDatesFromISO(year: number, week: number): string[] {
  const d = new Date(year, 0, 4);
  d.setDate(d.getDate() + (week - 1) * 7 - ((d.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(d);
    date.setDate(d.getDate() + i);
    return toLocalDateStr(date);
  });
}


function formatShortDate(dateString: string) {
  return parseDateStr(dateString).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function getWeekRangeLabel(year: number, week: number) {
  const dates = getWeekDatesFromISO(year, week);
  const start = parseDateStr(dates[0]);
  const end = parseDateStr(dates[6]);
  const startStr = start.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  const endStr = end.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  return `${startStr} – ${endStr}`;
}

// ---- Styles ----
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  // Header
  weekHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  arrowBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  weekTitleWrapper: { alignItems: "center", flex: 1, marginHorizontal: theme.spacing.sm },
  weekTitle: {
    fontSize: theme.typography.size.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
  },
  weekRange: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  backTodayPill: {
    marginTop: 4,
    backgroundColor: theme.colors.purple + '22',
    borderRadius: theme.radius.round,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  backTodayText: {
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.purple,
  },

  // Progress
  progressBar: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  progressBg: {
    flex: 1,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.purple,
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
    minWidth: 100,
    textAlign: "right",
  },

  // Grid
  columnWrapper: {
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
  },
  listContent: { paddingBottom: 100, paddingTop: 4 },

  // Day cards
  dayCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 12,
    marginBottom: 10,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
  },
  dayCardToday: {
    borderColor: theme.colors.purple + '80',
    backgroundColor: theme.colors.purple + '0D',
  },
  dayCardAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: theme.colors.purple,
  },
  dayCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  dayLabel: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
  },
  dayLabelToday: { color: theme.colors.purple },
  todayBadge: {
    backgroundColor: theme.colors.purple,
    borderRadius: theme.radius.round,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  todayBadgeText: {
    fontSize: 9,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#FFF",
  },
  dateText: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  dateTextToday: { color: theme.colors.purple },

  tasksSummary: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 6,
  },
  taskChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.round,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  taskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  taskChipText: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
  },
  noTask: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    fontStyle: "italic",
  },

  taskList: { gap: 4 },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  taskTitle: {
    flex: 1,
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textPrimary,
  },
  taskTitleDone: {
    color: theme.colors.textSecondary,
    textDecorationLine: "line-through",
  },
  moreText: {
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.purple,
    marginTop: 2,
  },

  // FAB
  fabWrapper: {
    position: "absolute",
    bottom: 24,
    right: 24,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.purple,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.colors.purple,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },

  // Modal bottom sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    paddingTop: theme.spacing.md,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    alignSelf: "center",
    marginBottom: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: theme.typography.size.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  modalOptionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOptionText: { flex: 1 },
  modalOptionTitle: {
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
  },
  modalOptionSub: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  cancelText: {
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textSecondary,
  },
});
