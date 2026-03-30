import React, { useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../assets/style/theme";
import { TaskItem } from "../../types/types";

interface Props {
  item: TaskItem;
  userId?: string;
  isFunnyMode: boolean;
  isWeeklyAdmin: boolean;
  onAssign: (id: string) => void;
  onAssignTo: (taskId: string) => void;
  onDone: (id: string) => void;
  onDelete: (id: string) => void;
  index: number;
}

export default function DayTaskCard({
  item,
  userId,
  isFunnyMode,
  isWeeklyAdmin,
  onAssign,
  onAssignTo,
  onDone,
  onDelete,
  index,
}: Props) {
  const isAssigned = !!item.taskAssignment;
  const isMine = item.taskAssignment?.user?.id === userId;
  const isDone = item.taskAssignment?.status === "DONE";
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
        <View style={styles.cardTopRow}>
          <Text style={[styles.taskTitle, isDone && styles.taskTitleDone]} numberOfLines={2}>
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
              <Ionicons name="trash-outline" size={15} color={theme.colors.danger} />
            </TouchableOpacity>
          </View>
        </View>

        {item.description ? (
          <Text style={styles.taskDesc} numberOfLines={2}>{item.description}</Text>
        ) : null}

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
              <Text style={styles.metaChipText}>
                {item.weight} pt{item.weight > 1 ? "s" : ""}
              </Text>
            </View>
          )}
          {isAssigned && assigneeName && !isMine && (
            <View style={[styles.metaChip, styles.assignedChip]}>
              <Ionicons name="person-outline" size={11} color={theme.colors.purple} />
              <Text style={[styles.metaChipText, { color: theme.colors.purple }]}>
                {assigneeName}
              </Text>
            </View>
          )}
          {isMine && !isDone && (
            <View style={[styles.metaChip, styles.mineChip]}>
              <Ionicons name="star" size={11} color={theme.colors.yellow} />
              <Text style={[styles.metaChipText, { color: theme.colors.yellow }]}>Ma tâche</Text>
            </View>
          )}
        </View>

        {isFunnyMode && !isWeeklyAdmin && !isAssigned && (
          <View style={styles.lockHint}>
            <Ionicons name="lock-closed-outline" size={12} color={theme.colors.textSecondary} />
            <Text style={styles.lockHintText}>Seul l'admin de la semaine peut attribuer</Text>
          </View>
        )}

        <View style={styles.actions}>
          {!isAssigned && !isFunnyMode && (
            <TouchableOpacity style={styles.assignBtn} onPress={() => onAssign(item.id)} activeOpacity={0.8}>
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
              <Text style={[styles.assignBtnText, { color: "#1A1A1A" }]}>Assigner à…</Text>
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

const styles = StyleSheet.create({
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
  cardBody: { flex: 1, padding: 14 },
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
  actions: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  assignBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: theme.colors.purple,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: theme.radius.round,
  },
  assignBtnFunny: { backgroundColor: theme.colors.yellow },
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
  doneConfirm: { flexDirection: "row", alignItems: "center", gap: 5 },
  doneConfirmText: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.success,
  },
});
