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
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Pressable,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import api from "../api/api";
import { theme } from "../assets/style/theme";
import { GroupMember, MemberProfile, TaskType } from "../types/types";

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
  FAMILY:      { emoji: "👨‍👩‍👧‍👦", label: "Famille",         color: theme.colors.mint },
  ADULT:       { emoji: "🧑",        label: "Adulte",           color: theme.colors.purple },
  ADULT_CHILD: { emoji: "🤝",        label: "Adulte & Enfant",  color: theme.colors.yellow },
};

const TASK_TYPES: TaskType[] = ["FAMILY", "ADULT", "ADULT_CHILD"];

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

interface TaskForm {
  title: string;
  description: string;
  weight: string;
  duration: string;
  dayOfWeek: number;
  taskType: TaskType;
}

const EMPTY_FORM: TaskForm = {
  title: "",
  description: "",
  weight: "1",
  duration: "",
  dayOfWeek: 0,
  taskType: "FAMILY",
};

function TaskFormModal({
  visible,
  initial,
  onClose,
  onSave,
}: {
  visible: boolean;
  initial: TaskForm;
  onClose: () => void;
  onSave: (form: TaskForm) => void;
}) {
  const [form, setForm] = useState<TaskForm>(initial);

  useEffect(() => { setForm(initial); }, [visible]);

  const set = (key: keyof TaskForm, val: any) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const handleSave = () => {
    if (!form.title.trim()) {
      Alert.alert("Champ requis", "Le titre est obligatoire.");
      return;
    }
    onSave(form);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />

          <Text style={styles.modalTitle}>
            {initial.title ? "Modifier la tâche" : "Nouvelle tâche"}
          </Text>
          <Text style={styles.fieldLabel}>Titre *</Text>
          <TextInput
            style={styles.input}
            value={form.title}
            onChangeText={v => set("title", v)}
            placeholder="Ex : Faire la vaisselle"
            placeholderTextColor={theme.colors.textSecondary}
          />
          <Text style={styles.fieldLabel}>Description</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={form.description}
            onChangeText={v => set("description", v)}
            placeholder="Optionnel"
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            numberOfLines={3}
          />
          <View style={styles.rowFields}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Poids (1-5)</Text>
              <TextInput
                style={styles.input}
                value={form.weight}
                onChangeText={v => set("weight", v.replace(/[^0-9]/g, ""))}
                keyboardType="numeric"
                placeholder="1"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Durée (min)</Text>
              <TextInput
                style={styles.input}
                value={form.duration}
                onChangeText={v => set("duration", v.replace(/[^0-9]/g, ""))}
                keyboardType="numeric"
                placeholder="30"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>
          </View>
          <Text style={styles.fieldLabel}>Jour</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            <View style={styles.pillRow}>
              {DAYS_FR.map((d, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.pill, form.dayOfWeek === i && styles.pillActive]}
                  onPress={() => set("dayOfWeek", i)}
                >
                  <Text style={[styles.pillText, form.dayOfWeek === i && styles.pillTextActive]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <Text style={styles.fieldLabel}>Type</Text>
          <View style={styles.pillRow}>
            {TASK_TYPES.map(t => {
              const meta = TASK_TYPE_META[t];
              const active = form.taskType === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.typePill, active && { borderColor: meta.color, backgroundColor: meta.color + "18" }]}
                  onPress={() => set("taskType", t)}
                >
                  <Text style={styles.typePillEmoji}>{meta.emoji}</Text>
                  <Text style={[styles.typePillText, active && { color: meta.color }]}>
                    {meta.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

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

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<UnassignedTask | null>(null);
  const [savingTask, setSavingTask] = useState(false);

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
      setMembers((membersRes.data ?? []).map((m: any) => ({
        id: m.id,
        firstName: m.firstName,
        email: m.email,
        profile: m.profile ?? "ADULT",
      })));
      setUnassigned(unassignedRes.data ?? []);
    } catch {
      Alert.alert("Erreur", "Impossible de charger les données.");
    } finally {
      setLoading(false);
    }
  };


  const openAdd = () => {
    setEditingTask(null);
    setModalVisible(true);
  };

  const openEdit = (task: UnassignedTask) => {
    setEditingTask(task);
    setModalVisible(true);
  };

  const handleSave = async (form: TaskForm) => {
    setSavingTask(true);
    try {
      if (editingTask) {
        // PATCH existing
        const res = await api.patch(`/tasks/${editingTask.id}`, {
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          weight: form.weight ? parseInt(form.weight, 10) : 1,
          duration: form.duration ? parseInt(form.duration, 10) : undefined,
          dayOfWeek: form.dayOfWeek,
          taskType: form.taskType,
        });
        setUnassigned(prev => prev.map(t => t.id === editingTask.id ? {
          ...t,
          title: res.data.title,
          description: res.data.description,
          weight: res.data.weight,
          duration: res.data.duration,
          dayOfWeek: res.data.dayOfWeek,
          taskType: res.data.taskType,
        } : t));
      } else {
        // POST new
        const res = await api.post(`/tasks/group/${groupId}`, {
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          weight: form.weight ? parseInt(form.weight, 10) : 1,
          duration: form.duration ? parseInt(form.duration, 10) : undefined,
          dayOfWeek: form.dayOfWeek,
          taskType: form.taskType,
          frequency: "ONCE",
          weekNumber: currentWeek,
          year: currentYear,
          date: getDateForDayOfWeek(form.dayOfWeek, currentWeek, currentYear),
        });
        setUnassigned(prev => [...prev, {
          id: res.data.id,
          title: res.data.title,
          description: res.data.description,
          weight: res.data.weight,
          duration: res.data.duration,
          dayOfWeek: res.data.dayOfWeek,
          taskType: res.data.taskType,
        }]);
      }
      setModalVisible(false);
    } catch {
      Alert.alert("Erreur", "Impossible de sauvegarder la tâche.");
    } finally {
      setSavingTask(false);
    }
  };

  const handleDelete = (task: UnassignedTask) => {
    Alert.alert(
      "Supprimer la tâche",
      `Supprimer "${task.title}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/tasks/${task.id}`);
              setUnassigned(prev => prev.filter(t => t.id !== task.id));
            } catch {
              Alert.alert("Erreur", "Impossible de supprimer la tâche.");
            }
          },
        },
      ]
    );
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
      setAssignedCount(res.data?.assigned ?? 0);
      setDone(true);
      Animated.spring(successScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }).start();
    } catch {
      Alert.alert("Erreur", "La répartition a échoué. Réessayez.");
    } finally {
      setAssigning(false);
    }
  };


  const adultsCount   = members.filter(m => m.profile === "ADULT").length;
  const childrenCount = members.filter(m => m.profile === "CHILD").length;

  const initialForm: TaskForm = editingTask
    ? {
        title: editingTask.title,
        description: editingTask.description ?? "",
        weight: String(editingTask.weight ?? 1),
        duration: editingTask.duration != null ? String(editingTask.duration) : "",
        dayOfWeek: editingTask.dayOfWeek ?? 0,
        taskType: editingTask.taskType ?? "FAMILY",
      }
    : EMPTY_FORM;

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
        <Animated.View style={[styles.header, { opacity: headerAnim }]}>
          <Text style={styles.screenTitle}>Répartition intelligente</Text>
          <Text style={styles.screenSub}>Semaine {currentWeek} · {currentYear}</Text>
        </Animated.View>

        <Animated.View style={{ transform: [{ translateY: cardAnim }] }}>
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
            {members.map(m => (
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
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>
                <Ionicons name="list-outline" size={14} color={theme.colors.purple} />{" "}
                Tâches à assigner ({unassigned.length})
              </Text>
              <TouchableOpacity style={styles.addTaskBtn} onPress={openAdd}>
                <Ionicons name="add" size={16} color={theme.colors.purple} />
                <Text style={styles.addTaskBtnText}>Ajouter</Text>
              </TouchableOpacity>
            </View>

            {unassigned.length === 0 ? (
              <Text style={styles.emptyText}>Aucune tâche non assignée cette semaine.</Text>
            ) : (
              unassigned.map(task => {
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
                    <View style={styles.taskActions}>
                      <TouchableOpacity
                        style={styles.taskActionBtn}
                        onPress={() => openEdit(task)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="pencil-outline" size={15} color={theme.colors.purple} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.taskActionBtn}
                        onPress={() => handleDelete(task)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="trash-outline" size={15} color={theme.colors.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
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
          {done && (
            <Animated.View style={[styles.successCard, { transform: [{ scale: successScale }] }]}>
              <Ionicons name="checkmark-circle" size={48} color={theme.colors.mint} />
              <Text style={styles.successTitle}>Répartition effectuée !</Text>
              <Text style={styles.successSub}>
                {assignedCount} tâche{assignedCount > 1 ? "s" : ""} attribuée{assignedCount > 1 ? "s" : ""} équitablement.
              </Text>
              <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
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
            style={[styles.assignBtn, (assigning || unassigned.length === 0) && styles.assignBtnDisabled]}
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

      <TaskFormModal
        visible={modalVisible}
        initial={initialForm}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
      />
    </View>
  );
}

function getDateForDayOfWeek(dayOfWeek: number, week: number, year: number): string {
  const jan4 = new Date(year, 0, 4);
  const dayOfJan4 = (jan4.getDay() + 6) % 7;
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - dayOfJan4 + (week - 1) * 7);
  const target = new Date(monday);
  target.setDate(monday.getDate() + dayOfWeek);
  return target.toISOString().split("T")[0];
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
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addTaskBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.colors.purple + "15",
    borderRadius: theme.radius.round,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: theme.colors.purple + "40",
  },
  addTaskBtnText: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.purple,
  },

  emptyText: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: "center",
    paddingVertical: 12,
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
  profileStatDivider: { width: 1, height: 40, backgroundColor: theme.colors.border },

  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  memberAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: theme.colors.purple + "22",
    alignItems: "center", justifyContent: "center",
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

  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
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
  taskActions: { flexDirection: "row", gap: 6 },
  taskActionBtn: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: "center", justifyContent: "center",
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    bottom: 0, left: 0, right: 0,
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

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: theme.spacing.lg,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    gap: 0,
  },
  modalHandle: {
    width: 40, height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: theme.typography.size.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textPrimary,
    marginBottom: 14,
  },
  inputMultiline: {
    height: 72,
    textAlignVertical: "top",
  },
  rowFields: { flexDirection: "row", gap: 12 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: theme.radius.round,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  pillActive: {
    borderColor: theme.colors.purple,
    backgroundColor: theme.colors.purple + "18",
  },
  pillText: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
  },
  pillTextActive: { color: theme.colors.purple },
  typePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.radius.round,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  typePillEmoji: { fontSize: 14 },
  typePillText: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: theme.radius.round,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textSecondary,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: theme.radius.round,
    backgroundColor: theme.colors.purple,
    alignItems: "center",
  },
  saveBtnText: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: "#FFF",
  },
});
