import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Animated,
  Pressable,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../assets/style/theme";
import api from "../api/api";
import { useGroup } from "../context/GroupContext";
import { useWeek } from "../context/WeekContext";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = [
  { label: "Lun", value: 0 },
  { label: "Mar", value: 1 },
  { label: "Mer", value: 2 },
  { label: "Jeu", value: 3 },
  { label: "Ven", value: 4 },
  { label: "Sam", value: 5 },
  { label: "Dim", value: 6 },
];

const FREQUENCIES = [
  { label: "Une fois", value: "ONCE", icon: "radio-button-on-outline" as const },
  { label: "Quotidien", value: "DAILY", icon: "sunny-outline" as const },
  { label: "Hors WE", value: "WEEKLY", icon: "calendar-outline" as const },
];

const TASK_TYPES = [
  {
    value: "FAMILY",
    label: "Toute la famille",
    emoji: "👨‍👩‍👧‍👦",
    desc: "Accessible à tous les membres",
    color: theme.colors.mint,
  },
  {
    value: "ADULT",
    label: "Adulte",
    emoji: "🧑",
    desc: "Réservée aux adultes du groupe",
    color: theme.colors.purple,
  },
  {
    value: "ADULT_CHILD",
    label: "Adulte & Enfant",
    emoji: "🤝",
    desc: "Peut être assignée à 2 personnes",
    color: theme.colors.yellow,
  },
] as const;

const WEIGHT_LEVELS = [
  { label: "Tranquille", color: "#4CAF50", emoji: "😌" },
  { label: "Ça va", color: "#8BC34A", emoji: "🙂" },
  { label: "Moyen", color: "#FFC107", emoji: "😐" },
  { label: "Courage…", color: "#FF9800", emoji: "😓" },
  { label: "RELLOU", color: "#F44336", emoji: "😵‍💫" },
];

// ─── Utils ────────────────────────────────────────────────────────────────────


function computeTaskDate(year: number, weekNumber: number, dayOfWeek: number): string {
  const jan4 = new Date(year, 0, 4);
  const dayDiff = (jan4.getDay() + 6) % 7;
  const week1Monday = new Date(year, 0, 4 - dayDiff);
  const taskDate = new Date(week1Monday);
  taskDate.setDate(week1Monday.getDate() + (weekNumber - 1) * 7 + dayOfWeek);
  // Format local sans passer par UTC
  const y = taskDate.getFullYear();
  const m = String(taskDate.getMonth() + 1).padStart(2, "0");
  const dStr = String(taskDate.getDate()).padStart(2, "0");
  return `${y}-${m}-${dStr}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ icon, title }: { icon: keyof typeof Ionicons.glyphMap; title: string }) {
  return (
    <View style={sectionStyles.row}>
      <View style={sectionStyles.iconBox}>
        <Ionicons name={icon} size={14} color={theme.colors.purple} />
      </View>
      <Text style={sectionStyles.title}>{title}</Text>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    marginTop: 4,
  },
  iconBox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: theme.colors.purple + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
});

function InputField({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "default" | "numeric";
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={inputStyles.wrapper}>
      <Text style={inputStyles.label}>{label}</Text>
      <View style={[inputStyles.row, focused && inputStyles.rowFocused, multiline && { alignItems: "flex-start" }]}>
        <Ionicons
          name={icon}
          size={16}
          color={focused ? theme.colors.purple : theme.colors.textSecondary}
          style={multiline ? { marginTop: 14 } : undefined}
        />
        <TextInput
          style={[inputStyles.input, multiline && inputStyles.inputMulti]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          multiline={multiline}
          keyboardType={keyboardType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          textAlignVertical={multiline ? "top" : "center"}
        />
      </View>
    </View>
  );
}

const inputStyles = StyleSheet.create({
  wrapper: { marginBottom: theme.spacing.md },
  label: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
  },
  rowFocused: {
    borderColor: theme.colors.purple,
    shadowColor: theme.colors.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  input: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.md,
    paddingVertical: 13,
  },
  inputMulti: {
    height: 80,
    paddingTop: 13,
  },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function AddTaskScreen() {
  const route = useRoute<any>();
  const taskToEdit = route.params?.task;
  const navigation = useNavigation();
  const { currentGroup } = useGroup();
  const idGroup = currentGroup?.id;
  const { week: selectedWeek, year: selectedYear } = useWeek();

  const [title, setTitle] = useState(taskToEdit?.title ?? "");
  const [description, setDescription] = useState(taskToEdit?.description ?? "");
  const [weight, setWeight] = useState(taskToEdit?.weight ?? 1);
  const [frequency, setFrequency] = useState<string>(taskToEdit?.frequency ?? "ONCE");
  const [duration, setDuration] = useState(taskToEdit?.duration?.toString() ?? "");
  const [dayOfWeek, setDayOfWeek] = useState<number>(taskToEdit?.dayOfWeek ?? 0);
  const [taskType, setTaskType] = useState<"FAMILY" | "ADULT" | "ADULT_CHILD">(
    taskToEdit?.taskType ?? "FAMILY"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const card1Anim = useRef(new Animated.Value(24)).current;
  const card2Anim = useRef(new Animated.Value(24)).current;
  const card3Anim = useRef(new Animated.Value(24)).current;
  const card4Anim = useRef(new Animated.Value(24)).current;
  const card5Anim = useRef(new Animated.Value(24)).current;
  const opacities = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];
  const btnScale = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const cards = [card1Anim, card2Anim, card3Anim, card4Anim, card5Anim];
    Animated.stagger(80, [
      Animated.timing(headerAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ...cards.map((c, i) =>
        Animated.parallel([
          Animated.spring(c, { toValue: 0, useNativeDriver: true, tension: 80, friction: 9 }),
          Animated.timing(opacities[i], { toValue: 1, duration: 300, useNativeDriver: true }),
        ])
      ),
    ]).start();
  }, []);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -5, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const saveTask = async () => {
    if (!title.trim()) {
      setError("Le titre est requis.");
      shake();
      return;
    }
    const weekNumber = selectedWeek;
    const year = selectedYear;
    const taskDate = computeTaskDate(year, weekNumber, dayOfWeek);

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      weight,
      frequency,
      weekNumber,
      year,
      date: taskDate,
      dayOfWeek,
      duration: duration.trim() ? Number(duration) : undefined,
      groupId: idGroup,
      taskType,
    };

    setLoading(true);
    setError(null);
    console.log('[AddTask] payload:', JSON.stringify(payload));
    try {
      await api.post(`/tasks/group/${idGroup}`, payload);
      navigation.goBack();
    } catch (e: any) {
      console.log('[AddTask] error status:', e.response?.status);
      console.log('[AddTask] error data:', JSON.stringify(e.response?.data));
      console.log('[AddTask] error message:', e.message);
      const msg = e.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : (msg ?? "Impossible de créer la tâche."));
      shake();
    } finally {
      setLoading(false);
    }
  };

  const animCard = (translateY: Animated.Value, opacity: Animated.Value, content: React.ReactNode) => (
    <Animated.View style={{ transform: [{ translateY }], opacity }}>{content}</Animated.View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
        <Text style={styles.screenTitle}>
          {taskToEdit ? "Modifier la tâche" : "Nouvelle tâche"}
        </Text>
        <Text style={styles.screenSub}>
          {currentGroup?.name
            ? `Groupe · ${currentGroup.name}`
            : "Planifie et partage la charge du quotidien"}
        </Text>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>

          {/* ── Section 1 : Infos ── */}
          {animCard(card1Anim, opacities[0],
            <View style={styles.card}>
              <SectionHeader icon="create-outline" title="Informations" />
              <InputField
                label="Titre"
                icon="text-outline"
                value={title}
                onChangeText={t => { setTitle(t); setError(null); }}
                placeholder="Ex : Faire la vaisselle"
              />
              <InputField
                label="Description (optionnel)"
                icon="document-text-outline"
                value={description}
                onChangeText={setDescription}
                placeholder="Détails supplémentaires…"
                multiline
              />
              {error && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle-outline" size={14} color={theme.colors.danger} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
            </View>
          )}

          {/* ── Section 2 : Planification ── */}
          {animCard(card2Anim, opacities[1],
            <View style={styles.card}>
              <SectionHeader icon="calendar-outline" title="Planification" />

              {/* Jour */}
              <Text style={styles.fieldLabel}>Jour de la semaine</Text>
              <View style={styles.dayRow}>
                {DAYS.map(d => (
                  <TouchableOpacity
                    key={d.value}
                    style={[styles.dayPill, dayOfWeek === d.value && styles.dayPillActive]}
                    onPress={() => setDayOfWeek(d.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dayPillText, dayOfWeek === d.value && styles.dayPillTextActive]}>
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Fréquence */}
              <Text style={[styles.fieldLabel, { marginTop: theme.spacing.md }]}>Fréquence</Text>
              <View style={styles.freqRow}>
                {FREQUENCIES.map(f => (
                  <TouchableOpacity
                    key={f.value}
                    style={[styles.freqCard, frequency === f.value && styles.freqCardActive]}
                    onPress={() => setFrequency(f.value)}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={f.icon}
                      size={18}
                      color={frequency === f.value ? theme.colors.purple : theme.colors.textSecondary}
                    />
                    <Text style={[styles.freqLabel, frequency === f.value && styles.freqLabelActive]}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ── Section 3 : Durée ── */}
          {animCard(card3Anim, opacities[2],
            <View style={styles.card}>
              <SectionHeader icon="time-outline" title="Durée estimée" />
              <View style={styles.durationRow}>
                {[5, 10, 15, 30, 45, 60].map(min => (
                  <TouchableOpacity
                    key={min}
                    style={[
                      styles.durationChip,
                      duration === String(min) && styles.durationChipActive,
                    ]}
                    onPress={() => setDuration(duration === String(min) ? "" : String(min))}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.durationChipText, duration === String(min) && styles.durationChipTextActive]}>
                      {min} min
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <InputField
                label="Ou saisir manuellement"
                icon="pencil-outline"
                value={duration}
                onChangeText={t => setDuration(t.replace(/\D/g, ""))}
                placeholder="Ex : 25"
                keyboardType="numeric"
              />
            </View>
          )}

          {/* ── Section 4 : Type de tâche ── */}
          {animCard(card4Anim, opacities[3],
            <View style={styles.card}>
              <SectionHeader icon="people-outline" title="Type de tâche" />
              {TASK_TYPES.map((t) => {
                const active = taskType === t.value;
                return (
                  <TouchableOpacity
                    key={t.value}
                    style={[
                      styles.taskTypeRow,
                      active && { borderColor: t.color, backgroundColor: t.color + "18" },
                    ]}
                    onPress={() => setTaskType(t.value)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.taskTypeEmoji}>{t.emoji}</Text>
                    <View style={styles.taskTypeInfo}>
                      <Text style={[styles.taskTypeLabel, active && { color: t.color }]}>
                        {t.label}
                      </Text>
                      <Text style={styles.taskTypeDesc}>{t.desc}</Text>
                    </View>
                    {active && (
                      <Ionicons name="checkmark-circle" size={20} color={t.color} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* ── Section 5 : Poids ── */}
          {animCard(card5Anim, opacities[4],
            <View style={styles.card}>
              <SectionHeader icon="barbell-outline" title="Charge mentale" />
              <View style={styles.weightRow}>
                {WEIGHT_LEVELS.map((l, i) => {
                  const active = weight === i + 1;
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.weightBtn,
                        { backgroundColor: i < weight ? l.color : theme.colors.border },
                        active && styles.weightBtnActive,
                      ]}
                      onPress={() => setWeight(i + 1)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.weightEmoji}>{l.emoji}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={styles.weightLabelRow}>
                <View style={[styles.weightDot, { backgroundColor: WEIGHT_LEVELS[weight - 1].color }]} />
                <Text style={[styles.weightLabel, { color: WEIGHT_LEVELS[weight - 1].color }]}>
                  {WEIGHT_LEVELS[weight - 1].label}
                </Text>
                <Text style={styles.weightScore}>{weight}/5</Text>
              </View>
            </View>
          )}

        </Animated.View>
      </ScrollView>

      {/* Footer button */}
      <Animated.View style={[styles.footer, { transform: [{ scale: btnScale }] }]}>
        <Pressable
          style={[styles.saveBtn, !title.trim() && styles.saveBtnDisabled]}
          onPress={saveTask}
          disabled={loading || !title.trim()}
          onPressIn={() =>
            Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start()
          }
          onPressOut={() =>
            Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 30 }).start()
          }
        >
          <Ionicons
            name={taskToEdit ? "checkmark-circle-outline" : "add-circle-outline"}
            size={20}
            color="#FFF"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.saveBtnText}>
            {loading ? "Enregistrement…" : taskToEdit ? "Modifier la tâche" : "Créer la tâche"}
          </Text>
        </Pressable>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },

  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  screenTitle: {
    fontSize: theme.typography.size.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
  },
  screenSub: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginTop: 3,
  },

  scroll: {
    padding: theme.spacing.md,
    paddingBottom: 120,
    gap: theme.spacing.sm,
  },

  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },

  fieldLabel: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 8,
  },

  // Days
  dayRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  dayPill: {
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: theme.radius.round,
    backgroundColor: theme.colors.background,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  dayPillActive: {
    backgroundColor: theme.colors.purple,
    borderColor: theme.colors.purple,
  },
  dayPillText: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textSecondary,
  },
  dayPillTextActive: { color: "#FFF" },

  // Frequency
  freqRow: {
    flexDirection: "row",
    gap: 8,
  },
  freqCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    gap: 5,
  },
  freqCardActive: {
    borderColor: theme.colors.purple,
    backgroundColor: theme.colors.purple + "12",
  },
  freqLabel: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  freqLabelActive: { color: theme.colors.purple },

  // Duration chips
  durationRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  durationChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: theme.radius.round,
    backgroundColor: theme.colors.background,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  durationChipActive: {
    backgroundColor: theme.colors.purple,
    borderColor: theme.colors.purple,
  },
  durationChipText: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textSecondary,
  },
  durationChipTextActive: { color: "#FFF" },

  // Weight
  weightRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 10,
  },
  weightBtn: {
    flex: 1,
    height: 44,
    borderRadius: theme.radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  weightBtnActive: {
    transform: [{ scaleY: 1.12 }],
    borderRadius: theme.radius.md,
  },
  weightEmoji: { fontSize: 20 },
  weightLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  weightDot: { width: 8, height: 8, borderRadius: 4 },
  weightLabel: {
    flex: 1,
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
  },
  weightScore: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },

  // Task type
  taskTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    marginBottom: 8,
  },
  taskTypeEmoji: { fontSize: 24, width: 32, textAlign: "center" },
  taskTypeInfo: { flex: 1 },
  taskTypeLabel: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  taskTypeDesc: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },

  // Error
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  errorText: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.danger,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    paddingTop: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  saveBtn: {
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
  saveBtnDisabled: {
    backgroundColor: theme.colors.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveBtnText: {
    color: "#FFF",
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.bold,
  },
});
