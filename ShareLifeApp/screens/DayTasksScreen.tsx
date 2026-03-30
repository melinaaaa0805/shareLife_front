import { Ionicons } from "@expo/vector-icons";
import { useIsFocused, useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../api/api";
import { theme } from "../assets/style/theme";
import { useAuth } from "../context/AuthContext";
import { useGroup } from "../context/GroupContext";
import { getISOWeek, parseDateStr, formatDayHeader, isToday } from "../utils/date";
import { TaskItem, GroupMember } from "../types/types";
import { WeeklyMeal, MealVote } from "../types/meals";
import DayTaskCard from "../components/day-tasks/DayTaskCard";
import DayStatsBar from "../components/day-tasks/DayStatsBar";
import MealVoteSection from "../components/day-tasks/MealVoteSection";
import AssignMemberModal from "../components/day-tasks/AssignMemberModal";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function DayTasksScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { date: initialDate } = route.params as { date: string; dayIndex: number };
  const [activeDate, setActiveDate] = useState(initialDate);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const insets = useSafeAreaInsets();
  const { currentGroup } = useGroup();
  const { user } = useAuth();
  const userId = user?.id;

  const [dayTasks, setDayTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [assignModalTaskId, setAssignModalTaskId] = useState<string | null>(null);

  const { week: weekNumber, year } = getISOWeek(parseDateStr(activeDate));
  const dayOfWeek = (parseDateStr(activeDate).getDay() + 6) % 7;
  const [weekMeals, setWeekMeals] = useState<WeeklyMeal[]>([]);
  const [dayVotes, setDayVotes] = useState<MealVote[]>([]);
  const [votedMealId, setVotedMealId] = useState<string | null>(null);
  const [mealSectionOpen, setMealSectionOpen] = useState(true);

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
    if (!isFocused) return;
    fetchDayTasks();
    fetchMealsAndVotes();
    if (isFunnyMode && isWeeklyAdmin && currentGroup?.id) {
      api
        .get(`/group-member/${currentGroup.id}`)
        .then((r) => setMembers(r.data || []))
        .catch(() => {});
    }
  }, [isFocused, activeDate]);

  const fetchMealsAndVotes = async () => {
    if (!currentGroup) return;
    try {
      const [mealsRes, votesRes, myVoteRes] = await Promise.all([
        api.get(`meals/${currentGroup.id}/${year}/${weekNumber}`),
        api.get(`meal-votes/${currentGroup.id}/${year}/${weekNumber}/${dayOfWeek}`),
        api.get(`meal-votes/my/${currentGroup.id}/${year}/${weekNumber}/${dayOfWeek}`),
      ]);
      setWeekMeals(mealsRes.data);
      setDayVotes(votesRes.data);
      setVotedMealId(myVoteRes.data?.meal?.id ?? null);
    } catch (e) {
      console.error("Erreur fetch repas/votes", e);
    }
  };

  const handleVoteMeal = async (mealId: string) => {
    if (!currentGroup) return;
    if (votedMealId === mealId) {
      const myVote = dayVotes.find((v) => v.user?.id === userId && v.meal?.id === mealId);
      if (myVote) {
        try {
          await api.delete(`meal-votes/${myVote.id}`);
          setVotedMealId(null);
          setDayVotes((prev) => prev.filter((v) => v.id !== myVote.id));
        } catch {
          Alert.alert("Erreur", "Impossible de supprimer le vote.");
        }
      }
      return;
    }
    try {
      const res = await api.post("meal-votes", {
        mealId,
        dayOfWeek,
        groupId: currentGroup.id,
        weekNumber,
        year,
      });
      setVotedMealId(mealId);
      setDayVotes((prev) => {
        const filtered = prev.filter((v) => v.user?.id !== userId);
        return res.data ? [...filtered, res.data] : filtered;
      });
    } catch {
      Alert.alert("Erreur", "Impossible de voter.");
    }
  };

  const handleAddIngredientsToShopping = async (meal: WeeklyMeal) => {
    if (!currentGroup) return;
    try {
      await api.post(`meals/${meal.id}/add-to-shopping`, {
        groupId: currentGroup.id,
        weekNumber,
        year,
      });
      Alert.alert("Ajouté !", `Les ingrédients de "${meal.name}" ont été ajoutés à la liste de courses.`);
    } catch {
      Alert.alert("Erreur", "Impossible d'ajouter les ingrédients.");
    }
  };

  const fetchDayTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get(`tasks/${activeDate}/${currentGroup?.id}`);
      setDayTasks(res.data);
    } catch (e) {
      console.error("Erreur fetch tâches du jour", e);
    } finally {
      setLoading(false);
    }
  };

  const assignTask = async (taskId: string) => {
    setDayTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, taskAssignment: { user: { id: userId!, firstName: user?.firstName }, status: "PENDING" } }
          : t,
      ),
    );
    try {
      await api.post(`task-assignment/${taskId}`);
    } catch {
      fetchDayTasks();
    }
  };

  const toggleDone = async (taskId: string) => {
    setDayTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, taskAssignment: { ...t.taskAssignment, status: "DONE" } }
          : t,
      ),
    );
    try {
      await api.patch(`task-assignment/${taskId}/done`);
    } catch {
      fetchDayTasks();
    }
  };

  const deleteTask = (taskId: string) => {
    Alert.alert("Supprimer la tâche", "Cette tâche sera définitivement supprimée.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          setDayTasks((prev) => prev.filter((t) => t.id !== taskId));
          try {
            await api.delete(`/tasks/${taskId}`);
          } catch {
            fetchDayTasks();
          }
        },
      },
    ]);
  };

  const assignTaskToMember = async (taskId: string, memberId: string) => {
    setAssignModalTaskId(null);
    const member = members.find((m) => m.id === memberId);
    setDayTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, taskAssignment: { user: { id: memberId, firstName: member?.firstName }, status: "PENDING" } }
          : t,
      ),
    );
    try {
      await api.post(`task-assignment/${taskId}/assign-to/${memberId}`);
    } catch {
      fetchDayTasks();
    }
  };

  const goToDay = (offset: number) => {
    const outX = offset > 0 ? -SCREEN_WIDTH : SCREEN_WIDTH;
    const inX = offset > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH;
    Animated.timing(slideAnim, { toValue: outX, duration: 180, useNativeDriver: true }).start(() => {
      const d = parseDateStr(activeDate);
      d.setDate(d.getDate() + offset);
      const y = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      setActiveDate(`${y}-${mo}-${day}`);
      slideAnim.setValue(inX);
      Animated.timing(slideAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start();
    });
  };

  const { dayName, dateLabel } = formatDayHeader(activeDate);
  const todayFlag = isToday(activeDate);
  const totalTasks = dayTasks.length;
  const doneTasks = dayTasks.filter((t) => t.taskAssignment?.status === "DONE").length;
  const myTasks = dayTasks.filter((t) => t.taskAssignment?.user?.id === userId).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerAnim, paddingTop: insets.top + 8 }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          {isFunnyMode ? (
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
          ) : (
            <View />
          )}
        </View>

        <View style={styles.dayNavRow}>
          <TouchableOpacity
            style={styles.dayNavBtn}
            onPress={() => goToDay(-1)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={24} color={theme.colors.purple} />
          </TouchableOpacity>
          <View style={styles.dayNavCenter}>
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
          <TouchableOpacity
            style={styles.dayNavBtn}
            onPress={() => goToDay(1)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-forward" size={24} color={theme.colors.purple} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.View style={{ flex: 1, transform: [{ translateX: slideAnim }] }}>
        <DayStatsBar
          totalTasks={totalTasks}
          doneTasks={doneTasks}
          myTasks={myTasks}
          anim={statsAnim}
        />

        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {dayTasks.map((item, index) => (
            <DayTaskCard
              key={item.id}
              item={item}
              userId={userId}
              isFunnyMode={isFunnyMode}
              isWeeklyAdmin={isWeeklyAdmin}
              onAssign={assignTask}
              onAssignTo={(id) => setAssignModalTaskId(id)}
              onDone={toggleDone}
              onDelete={deleteTask}
              index={index}
            />
          ))}

          {!loading && dayTasks.length === 0 && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="sunny-outline" size={32} color={theme.colors.purple} />
              </View>
              <Text style={styles.emptyTitle}>Journée libre !</Text>
              <Text style={styles.emptySub}>Aucune tâche prévue pour cette journée.</Text>
            </View>
          )}

          <MealVoteSection
            weekMeals={weekMeals}
            dayVotes={dayVotes}
            votedMealId={votedMealId}
            isOpen={mealSectionOpen}
            onToggleOpen={() => setMealSectionOpen((v) => !v)}
            onVote={handleVoteMeal}
            onAddToShopping={handleAddIngredientsToShopping}
          />
        </ScrollView>
      </Animated.View>

      <AssignMemberModal
        visible={assignModalTaskId !== null}
        members={members}
        onClose={() => setAssignModalTaskId(null)}
        onSelectMember={(memberId) => assignModalTaskId && assignTaskToMember(assignModalTaskId, memberId)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: "column",
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 10,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
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
  dayNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dayNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.purple + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  dayNavCenter: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  dayNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
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
    textAlign: "center",
  },
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
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
