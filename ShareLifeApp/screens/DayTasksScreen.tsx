import { Ionicons } from "@expo/vector-icons";
import {
  useIsFocused,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;
import api from "../api/api";
import { theme } from "../assets/style/theme";
import { useAuth } from "../context/AuthContext";
import { useGroup } from "../context/GroupContext";

const DAYS_FR_FULL = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];
const MONTHS_FR = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

// ─── Helpers semaine ISO ──────────────────────────────────────────────────────
function getISOWeek(d: Date): { week: number; year: number } {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  const week =
    Math.round(
      ((date.getTime() - week1.getTime()) / 86400000 +
        ((week1.getDay() + 6) % 7)) /
        7,
    ) + 1;
  return { week, year: date.getFullYear() };
}

// ─── Types repas ──────────────────────────────────────────────────────────────
type MealIngredient = { name: string; quantity: string; unit?: string };
type WeeklyMeal = {
  id: string;
  name: string;
  imageUrl?: string | null;
  ingredients: MealIngredient[];
  proposedBy?: { id: string; firstName: string } | null;
  votes?: {
    id: string;
    user: { id: string; firstName: string };
    dayOfWeek: number;
    meal: { id: string };
  }[];
};
type MealVote = {
  id: string;
  user: { id: string; firstName: string };
  dayOfWeek: number;
  meal: { id: string; name: string };
};

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

type Member = { id: string; firstName: string; email: string };

function TaskCard({
  item,
  userId,
  isFunnyMode,
  isWeeklyAdmin,
  onAssign,
  onAssignTo,
  onDone,
  onDelete,
  index,
}: {
  item: TaskItem;
  userId?: string;
  isFunnyMode: boolean;
  isWeeklyAdmin: boolean;
  onAssign: (id: string) => void;
  onAssignTo: (taskId: string) => void;
  onDone: (id: string) => void;
  onDelete: (id: string) => void;
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
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 8,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleDone = () => {
    Animated.sequence([
      Animated.spring(doneScale, {
        toValue: 0.92,
        useNativeDriver: true,
        speed: 60,
      }),
      Animated.spring(doneScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 40,
      }),
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
          <Text
            style={[styles.taskTitle, isDone && styles.taskTitleDone]}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          <View style={styles.cardTopRight}>
            {isDone && (
              <View style={styles.doneBadge}>
                <Ionicons name="checkmark" size={12} color="#FFF" />
              </View>
            )}
            <TouchableOpacity
              style={styles.deleteTaskBtn}
              onPress={() => onDelete(item.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="trash-outline"
                size={15}
                color={theme.colors.danger}
              />
            </TouchableOpacity>
          </View>
        </View>

        {item.description ? (
          <Text style={styles.taskDesc} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        {/* Meta chips */}
        <View style={styles.metaRow}>
          {item.duration != null && item.duration > 0 && (
            <View style={styles.metaChip}>
              <Ionicons
                name="time-outline"
                size={11}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.metaChipText}>{item.duration} min</Text>
            </View>
          )}
          {item.weight != null && item.weight > 0 && (
            <View style={styles.metaChip}>
              <Ionicons
                name="barbell-outline"
                size={11}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.metaChipText}>
                {item.weight} pt{item.weight > 1 ? "s" : ""}
              </Text>
            </View>
          )}
          {isAssigned && assigneeName && !isMine && (
            <View style={[styles.metaChip, styles.assignedChip]}>
              <Ionicons
                name="person-outline"
                size={11}
                color={theme.colors.purple}
              />
              <Text
                style={[styles.metaChipText, { color: theme.colors.purple }]}
              >
                {assigneeName}
              </Text>
            </View>
          )}
          {isMine && !isDone && (
            <View style={[styles.metaChip, styles.mineChip]}>
              <Ionicons name="star" size={11} color={theme.colors.yellow} />
              <Text
                style={[styles.metaChipText, { color: theme.colors.yellow }]}
              >
                Ma tâche
              </Text>
            </View>
          )}
        </View>

        {/* Funny mode lock hint */}
        {isFunnyMode && !isWeeklyAdmin && !isAssigned && (
          <View style={styles.lockHint}>
            <Ionicons
              name="lock-closed-outline"
              size={12}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.lockHintText}>
              Seul l'admin de la semaine peut attribuer
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {!isAssigned && !isFunnyMode && (
            <TouchableOpacity
              style={styles.assignBtn}
              onPress={() => onAssign(item.id)}
              activeOpacity={0.8}
            >
              <Ionicons name="person-add-outline" size={13} color="#FFF" />
              <Text style={styles.assignBtnText}>S'assigner</Text>
            </TouchableOpacity>
          )}
          {!isAssigned && isFunnyMode && isWeeklyAdmin && (
            <TouchableOpacity
              style={[styles.assignBtn, styles.assignBtnFunny]}
              onPress={() => onAssignTo(item.id)}
              activeOpacity={0.8}
            >
              <Ionicons name="crown-outline" size={13} color="#1A1A1A" />
              <Text style={[styles.assignBtnText, { color: "#1A1A1A" }]}>
                Assigner à…
              </Text>
            </TouchableOpacity>
          )}

          {isMine && !isDone && (
            <Animated.View style={{ transform: [{ scale: doneScale }] }}>
              <Pressable style={styles.doneBtn} onPress={handleDone}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={13}
                  color="#FFF"
                />
                <Text style={styles.doneBtnText}>Marquer comme fait</Text>
              </Pressable>
            </Animated.View>
          )}

          {isDone && isMine && (
            <View style={styles.doneConfirm}>
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={theme.colors.success}
              />
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
  const { date: initialDate } = route.params as { date: string; dayIndex: number };
  const [activeDate, setActiveDate] = useState(initialDate);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const insets = useSafeAreaInsets();
  const { currentGroup } = useGroup();
  const { user } = useAuth();
  const userId = user?.id;

  const [dayTasks, setDayTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [assignModalTaskId, setAssignModalTaskId] = useState<string | null>(
    null,
  );

  // ── Repas ────────────────────────────────────────────────────────────────
  const { week: weekNumber, year } = getISOWeek(parseDateStr(activeDate));
  // dayIndex 0=lundi … 6=dimanche à partir de parseDateStr
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
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(statsAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
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
        api.get(
          `meal-votes/${currentGroup.id}/${year}/${weekNumber}/${dayOfWeek}`,
        ),
        api.get(
          `meal-votes/my/${currentGroup.id}/${year}/${weekNumber}/${dayOfWeek}`,
        ),
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
    // Si déjà voté pour ce repas → supprimer le vote (toggle)
    if (votedMealId === mealId) {
      const myVote = dayVotes.find(
        (v) => v.user?.id === userId && v.meal?.id === mealId,
      );
      if (myVote) {
        try {
          await api.delete(`meal-votes/${myVote.id}`);
          setVotedMealId(null);
          setDayVotes((prev) => prev.filter((v) => v.id !== myVote.id));
        } catch (e) {
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
    } catch (e) {
      Alert.alert("Erreur", "Impossible de voter.");
    }
  };

  const handleAddIngredientsToShopping = async (meal: WeeklyMeal) => {
    if (!currentGroup) return;
    try {
      await api.post(`meals/${meal.id}/add-to-shopping`, {
        groupId: currentGroup.id,
        weekNumber,
      });
      Alert.alert(
        "Ajouté !",
        `Les ingrédients de "${meal.name}" ont été ajoutés à la liste de courses.`,
      );
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
    // Mise à jour optimiste immédiate pour fluidité UX
    setDayTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              taskAssignment: {
                user: { id: userId!, firstName: user?.firstName },
                status: "PENDING",
              },
            }
          : t,
      ),
    );
    try {
      await api.post(`task-assignment/${taskId}`);
    } catch (e: any) {
      // Si déjà assignée on recharge les tâches pour avoir l'état réel
      console.error("Erreur assign tâche", e);
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
    } catch (e) {
      console.error("Erreur update tâche", e);
      fetchDayTasks();
    }
  };

  const deleteTask = (taskId: string) => {
    Alert.alert(
      "Supprimer la tâche",
      "Cette tâche sera définitivement supprimée.",
      [
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
      ],
    );
  };

  const assignTaskToMember = async (taskId: string, memberId: string) => {
    setAssignModalTaskId(null);
    const member = members.find((m) => m.id === memberId);
    setDayTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              taskAssignment: {
                user: { id: memberId, firstName: member?.firstName },
                status: "PENDING",
              },
            }
          : t,
      ),
    );
    try {
      await api.post(`task-assignment/${taskId}/assign-to/${memberId}`);
    } catch (e) {
      console.error("Erreur assignation", e);
      fetchDayTasks();
    }
  };

  const goToDay = (offset: number) => {
    const outX = offset > 0 ? -SCREEN_WIDTH : SCREEN_WIDTH;
    const inX = offset > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH;

    Animated.timing(slideAnim, {
      toValue: outX,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      const d = parseDateStr(activeDate);
      d.setDate(d.getDate() + offset);
      const y = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      setActiveDate(`${y}-${mo}-${day}`);
      slideAnim.setValue(inX);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start();
    });
  };

  const { dayName, dateLabel } = formatDayHeader(activeDate);
  const todayFlag = isToday(activeDate);
  const totalTasks = dayTasks.length;
  const doneTasks = dayTasks.filter(
    (t) => t.taskAssignment?.status === "DONE",
  ).length;
  const myTasks = dayTasks.filter(
    (t) => t.taskAssignment?.user?.id === userId,
  ).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerAnim, paddingTop: insets.top + 8 }]}>
        {/* Top row: back button + mode badge */}
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
          ) : <View />}
        </View>

        {/* Day navigation row */}
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
      {/* Stats bar */}
      {totalTasks > 0 && (
        <Animated.View style={[styles.statsBar, { opacity: statsAnim }]}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalTasks}</Text>
            <Text style={styles.statLabel}>
              tâche{totalTasks > 1 ? "s" : ""}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.success }]}>
              {doneTasks}
            </Text>
            <Text style={styles.statLabel}>
              faite{doneTasks > 1 ? "s" : ""}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.purple }]}>
              {myTasks}
            </Text>
            <Text style={styles.statLabel}>à moi</Text>
          </View>

          {/* Progress bar */}
          <View style={styles.progressWrapper}>
            <View style={styles.progressBg}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width:
                      `${totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0}%` as any,
                  },
                ]}
              />
            </View>
          </View>
        </Animated.View>
      )}

      {/* Task list + Meal section */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {dayTasks.map((item, index) => (
          <TaskCard
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
              <Ionicons
                name="sunny-outline"
                size={32}
                color={theme.colors.purple}
              />
            </View>
            <Text style={styles.emptyTitle}>Journée libre !</Text>
            <Text style={styles.emptySub}>
              Aucune tâche prévue pour cette journée.
            </Text>
          </View>
        )}

        {/* ── Section repas du jour ────────────────────────────────────────── */}
        <View style={styles.mealSection}>
          <TouchableOpacity
            style={styles.mealSectionHeader}
            onPress={() => setMealSectionOpen((v) => !v)}
          >
            <View style={styles.mealSectionTitleRow}>
              <Ionicons
                name="restaurant-outline"
                size={16}
                color={theme.colors.mint}
              />
              <Text style={styles.mealSectionTitle}>
                Qu'est-ce qu'on mange ce soir ?
              </Text>
              {dayVotes.length > 0 && (
                <View style={styles.mealVotesBadge}>
                  <Text style={styles.mealVotesBadgeText}>
                    {dayVotes.length} vote{dayVotes.length > 1 ? "s" : ""}
                  </Text>
                </View>
              )}
            </View>
            <Ionicons
              name={mealSectionOpen ? "chevron-up" : "chevron-down"}
              size={16}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>

          {mealSectionOpen && (
            <View style={styles.mealSectionBody}>
              {weekMeals.length === 0 ? (
                <Text style={styles.noMealsText}>
                  Aucun repas proposé cette semaine. Ajoutez-en depuis l'onglet
                  Repas.
                </Text>
              ) : (
                weekMeals.map((meal) => {
                  const mealDayVotes = dayVotes.filter(
                    (v) => v.meal?.id === meal.id,
                  );
                  const isVoted = votedMealId === meal.id;
                  return (
                    <View
                      key={meal.id}
                      style={[
                        styles.mealVoteCard,
                        isVoted && styles.mealVoteCardActive,
                      ]}
                    >
                      <View style={styles.mealVoteCardLeft}>
                        {meal.imageUrl ? (
                          <Image
                            source={{ uri: meal.imageUrl }}
                            style={styles.mealVoteImage}
                          />
                        ) : (
                          <View style={styles.mealVoteImagePlaceholder}>
                            <Ionicons
                              name="restaurant-outline"
                              size={16}
                              color={theme.colors.mint}
                            />
                          </View>
                        )}
                        <View style={styles.mealVoteInfo}>
                          <Text style={styles.mealVoteName} numberOfLines={1}>
                            {meal.name}
                          </Text>
                          {mealDayVotes.length > 0 && (
                            <Text
                              style={styles.mealVoteVoters}
                              numberOfLines={1}
                            >
                              {mealDayVotes
                                .map((v) => v.user?.firstName)
                                .join(", ")}
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.mealVoteCardRight}>
                        {mealDayVotes.length > 0 && (
                          <View style={styles.mealVoteCount}>
                            <Text style={styles.mealVoteCountText}>
                              {mealDayVotes.length}
                            </Text>
                          </View>
                        )}
                        <TouchableOpacity
                          style={[
                            styles.voteBtn,
                            isVoted && styles.voteBtnActive,
                          ]}
                          onPress={() => handleVoteMeal(meal.id)}
                        >
                          <Ionicons
                            name={isVoted ? "heart" : "heart-outline"}
                            size={14}
                            color={
                              isVoted ? "#FFF" : theme.colors.textSecondary
                            }
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.cartBtn}
                          onPress={() => handleAddIngredientsToShopping(meal)}
                        >
                          <Ionicons
                            name="cart-outline"
                            size={14}
                            color={theme.colors.mint}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}
        </View>
      </ScrollView>
      </Animated.View>

      {/* ── Modal assignation membre (mode Drôle) ────────────────────────── */}
      <Modal
        visible={assignModalTaskId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setAssignModalTaskId(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setAssignModalTaskId(null)}
        >
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assigner à…</Text>
              <TouchableOpacity onPress={() => setAssignModalTaskId(null)}>
                <Ionicons
                  name="close"
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {members.length === 0 ? (
              <Text style={styles.modalEmpty}>Aucun membre disponible.</Text>
            ) : (
              members.map((member) => (
                <TouchableOpacity
                  key={member.id}
                  style={styles.memberRow}
                  activeOpacity={0.7}
                  onPress={() =>
                    assignModalTaskId &&
                    assignTaskToMember(assignModalTaskId, member.id)
                  }
                >
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>
                      {member.firstName?.[0]?.toUpperCase() ?? "?"}
                    </Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.firstName}</Text>
                    <Text style={styles.memberEmail} numberOfLines={1}>
                      {member.email}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              ))
            )}
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

  // Header
  header: {
    flexDirection: "column",
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
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
  headerLeft: { flex: 1 },
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
  cardTopRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  deleteTaskBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.danger + "15",
    alignItems: "center",
    justifyContent: "center",
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
  assignBtnFunny: {
    backgroundColor: theme.colors.yellow,
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

  // Meal section
  mealSection: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
  },
  mealSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
  },
  mealSectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  mealSectionTitle: {
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
  },
  mealVotesBadge: {
    backgroundColor: theme.colors.mint + "25",
    borderRadius: theme.radius.round,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  mealVotesBadgeText: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.mint,
  },
  mealSectionBody: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    padding: 10,
    gap: 6,
  },
  noMealsText: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: "center",
    paddingVertical: 8,
  },
  mealVoteCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.sm,
    padding: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  mealVoteCardActive: {
    borderColor: theme.colors.mint + "60",
    backgroundColor: theme.colors.mint + "0A",
  },
  mealVoteCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  mealVoteImage: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.border,
  },
  mealVoteImagePlaceholder: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.mint + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  mealVoteInfo: { flex: 1 },
  mealVoteName: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
  },
  mealVoteVoters: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  mealVoteCardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  mealVoteCount: {
    backgroundColor: theme.colors.mint,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  mealVoteCountText: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#0E0E0E",
  },
  voteBtn: {
    padding: 7,
    borderRadius: theme.radius.round,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  voteBtnActive: {
    backgroundColor: theme.colors.mint,
    borderColor: theme.colors.mint,
  },
  cartBtn: {
    padding: 7,
    borderRadius: theme.radius.round,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  // Modal assigner à…
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    paddingTop: theme.spacing.md,
    gap: 4,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.sm,
  },
  modalTitle: {
    fontSize: theme.typography.size.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
  },
  modalEmpty: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.regular,
    textAlign: "center",
    paddingVertical: theme.spacing.md,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.purple + "22",
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatarText: {
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.purple,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
  },
  memberEmail: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
});
