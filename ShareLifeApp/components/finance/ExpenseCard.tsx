import React, { useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../assets/style/theme";
import { Expense, ExpenseCategory } from "../../types/types";

const CATEGORY_CONFIG: Record<
  ExpenseCategory,
  { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }
> = {
  FOOD:      { icon: "fast-food-outline",     color: theme.colors.yellow,  label: "Alimentation" },
  TRANSPORT: { icon: "car-outline",           color: "#7BC4EA",            label: "Transport" },
  HOUSING:   { icon: "home-outline",          color: theme.colors.mint,    label: "Logement" },
  UTILITIES: { icon: "flash-outline",         color: theme.colors.warning, label: "Charges" },
  LEISURE:   { icon: "game-controller-outline", color: theme.colors.pink,  label: "Loisirs" },
  HEALTH:    { icon: "medkit-outline",        color: theme.colors.success, label: "Santé" },
  OTHER:     { icon: "ellipsis-horizontal-outline", color: theme.colors.textSecondary, label: "Autre" },
};

interface Props {
  expense: Expense;
  currentUserId: string;
  onDelete: (id: string) => void;
  index: number;
}

export default function ExpenseCard({ expense, currentUserId, onDelete, index }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, delay: index * 40, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 8, delay: index * 40 }),
    ]).start();
  }, []);

  const cat = CATEGORY_CONFIG[expense.category] ?? CATEGORY_CONFIG.OTHER;
  const myShare = expense.participants.find((p) => p.userId === currentUserId)?.share ?? 0;
  const iPaid = expense.paidBy?.id === currentUserId;
  const canDelete = iPaid || expense.paidBy === null;

  return (
    <Animated.View style={[styles.card, { opacity: opacityAnim, transform: [{ translateY: slideAnim }, { scale }] }]}>
      <Pressable
        style={styles.inner}
        onPressIn={() => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 60 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }).start()}
      >
        {/* Icon */}
        <View style={[styles.iconBox, { backgroundColor: cat.color + "20" }]}>
          <Ionicons name={cat.icon} size={20} color={cat.color} />
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{expense.title}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>{cat.label}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.meta}>{expense.date}</Text>
            {expense.paidBy && (
              <>
                <Text style={styles.metaDot}>·</Text>
                <Text style={[styles.meta, iPaid && styles.metaMe]}>
                  {iPaid ? "Toi" : expense.paidBy.firstName}
                </Text>
              </>
            )}
          </View>
          {/* Participants chips */}
          <View style={styles.participants}>
            {expense.participants.map((p) => (
              <View
                key={p.userId}
                style={[styles.chip, p.userId === currentUserId && styles.chipMe]}
              >
                <Text style={[styles.chipText, p.userId === currentUserId && styles.chipTextMe]}>
                  {p.userId === currentUserId ? "Toi" : p.firstName} — {p.share.toFixed(2)} €
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Amount + delete */}
        <View style={styles.right}>
          <Text style={styles.amount}>{expense.amount.toFixed(2)} €</Text>
          {myShare > 0 && !iPaid && (
            <Text style={styles.myShare}>-{myShare.toFixed(2)} €</Text>
          )}
          {iPaid && myShare < expense.amount && (
            <Text style={styles.credited}>+{(expense.amount - myShare).toFixed(2)} €</Text>
          )}
          {canDelete && (
            <Pressable onPress={() => onDelete(expense.id)} hitSlop={8} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={16} color={theme.colors.danger} />
            </Pressable>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
  },
  inner: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.sm,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  info: { flex: 1, gap: 4 },
  title: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
  },
  metaRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 4 },
  meta: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  metaDot: { fontSize: theme.typography.size.xs, color: theme.colors.border },
  metaMe: { color: theme.colors.purple, fontFamily: theme.typography.fontFamily.medium },
  participants: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 2 },
  chip: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.round,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipMe: { backgroundColor: theme.colors.purple + "20", borderColor: theme.colors.purple + "50" },
  chipText: { fontSize: 10, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textSecondary },
  chipTextMe: { color: theme.colors.purple },
  right: { alignItems: "flex-end", gap: 4, flexShrink: 0 },
  amount: {
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
  },
  myShare: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.danger,
  },
  credited: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.success,
  },
  deleteBtn: { marginTop: 2 },
});
