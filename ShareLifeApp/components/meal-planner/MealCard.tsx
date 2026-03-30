import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../assets/style/theme";
import { WeeklyMeal, MealVote } from "../../types/meals";

const DAYS_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const DAYS_FULL = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

interface Props {
  meal: WeeklyMeal;
  votes: MealVote[];
  userId?: string;
  onDelete: (id: string) => void;
  onEdit: (meal: WeeklyMeal) => void;
  onAddToShopping: (meal: WeeklyMeal) => void;
  onVote: (mealId: string, day: number) => void;
  index: number;
}

export default function MealCard({
  meal,
  votes,
  userId,
  onDelete,
  onEdit,
  onAddToShopping,
  onVote,
  index,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const slideAnim = useRef(new Animated.Value(20)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 1, duration: 280, delay: index * 60, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 8, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  const votesByDay: Record<number, MealVote[]> = {};
  votes.forEach((v) => {
    if (v.meal?.id === meal.id) {
      if (!votesByDay[v.dayOfWeek]) votesByDay[v.dayOfWeek] = [];
      votesByDay[v.dayOfWeek].push(v);
    }
  });
  const totalVotes = Object.values(votesByDay).flat().length;
  const myVoteDay = Object.entries(votesByDay).find(([_, dayVotes]) =>
    dayVotes.some((v) => v.user?.id === userId),
  );

  return (
    <Animated.View style={[styles.mealCard, { opacity: opacityAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.mealCardHeader}>
        {meal.imageUrl ? (
          <Image source={{ uri: meal.imageUrl }} style={styles.mealImage} />
        ) : (
          <View style={styles.mealImagePlaceholder}>
            <Ionicons name="restaurant-outline" size={22} color={theme.colors.purple} />
          </View>
        )}

        <View style={styles.mealInfo}>
          <Text style={styles.mealName} numberOfLines={2}>{meal.name}</Text>
          {meal.proposedBy && (
            <Text style={styles.mealProposedBy}>par {meal.proposedBy.firstName}</Text>
          )}
          <View style={styles.mealMeta}>
            <View style={styles.metaChip}>
              <Ionicons name="list-outline" size={11} color={theme.colors.textSecondary} />
              <Text style={styles.metaChipText}>{meal.ingredients.length} ingréd.</Text>
            </View>
            {totalVotes > 0 && (
              <View style={[styles.metaChip, styles.voteChip]}>
                <Ionicons name="heart" size={11} color={theme.colors.pink} />
                <Text style={[styles.metaChipText, { color: theme.colors.pink }]}>
                  {totalVotes} vote{totalVotes > 1 ? "s" : ""}
                </Text>
              </View>
            )}
            {myVoteDay && (
              <View style={[styles.metaChip, styles.myVoteChip]}>
                <Ionicons name="calendar-outline" size={11} color={theme.colors.mint} />
                <Text style={[styles.metaChipText, { color: theme.colors.mint }]}>
                  {DAYS_SHORT[+myVoteDay[0]]}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.mealActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => onEdit(meal)}>
            <Ionicons name="pencil-outline" size={16} color={theme.colors.purple} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => onAddToShopping(meal)}>
            <Ionicons name="cart-outline" size={16} color={theme.colors.mint} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => onDelete(meal.id)}>
            <Ionicons name="trash-outline" size={16} color={theme.colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.expandBtn} onPress={() => setExpanded((v) => !v)}>
        <Text style={styles.expandBtnText}>{expanded ? "Masquer" : "Ingrédients & voter"}</Text>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={13} color={theme.colors.purple} />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedSection}>
          {meal.ingredients.length > 0 && (
            <View style={styles.ingredientsSection}>
              <Text style={styles.sectionLabel}>Ingrédients</Text>
              <View style={styles.ingredientsList}>
                {meal.ingredients.map((ing, i) => (
                  <View key={i} style={styles.ingredientRow}>
                    <View style={styles.ingredientDot} />
                    <Text style={styles.ingredientText}>
                      {ing.name}
                      {ing.quantity ? (
                        <Text style={styles.ingredientQty}>
                          {" – "}{ing.quantity}{ing.unit ? ` ${ing.unit}` : ""}
                        </Text>
                      ) : null}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.voteSection}>
            <Text style={styles.sectionLabel}>Voter pour un jour</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.dayVoteRow}>
                {DAYS_SHORT.map((day, i) => {
                  const dayVotes = votesByDay[i] || [];
                  const isMyVote = dayVotes.some((v) => v.user?.id === userId);
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[styles.dayVoteBtn, isMyVote && styles.dayVoteBtnActive]}
                      onPress={() => onVote(meal.id, i)}
                    >
                      <Text style={[styles.dayVoteBtnText, isMyVote && styles.dayVoteBtnTextActive]}>
                        {day}
                      </Text>
                      {dayVotes.length > 0 && (
                        <View style={styles.dayVoteCount}>
                          <Text style={styles.dayVoteCountText}>{dayVotes.length}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            {Object.entries(votesByDay).length > 0 && (
              <View style={styles.votersList}>
                {Object.entries(votesByDay).map(([day, dayVotes]) => (
                  <Text key={day} style={styles.votersText}>
                    {DAYS_FULL[+day]} : {dayVotes.map((v) => v.user?.firstName).join(", ")}
                  </Text>
                ))}
              </View>
            )}
          </View>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  mealCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
    overflow: "hidden",
  },
  mealCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    gap: 10,
  },
  mealImage: {
    width: 52,
    height: 52,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.border,
  },
  mealImagePlaceholder: {
    width: 52,
    height: 52,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.purple + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  mealInfo: { flex: 1, gap: 3 },
  mealName: {
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
    lineHeight: 20,
  },
  mealProposedBy: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  mealMeta: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 2 },
  mealActions: { gap: 4 },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.round,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  metaChipText: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
  },
  voteChip: {
    borderColor: theme.colors.pink + "40",
    backgroundColor: theme.colors.pink + "10",
  },
  myVoteChip: {
    borderColor: theme.colors.mint + "40",
    backgroundColor: theme.colors.mint + "10",
  },
  expandBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  expandBtnText: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.purple,
  },
  expandedSection: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    padding: 12,
    gap: 12,
  },
  ingredientsSection: { gap: 6 },
  sectionLabel: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  ingredientsList: { gap: 4 },
  ingredientRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  ingredientDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.colors.purple,
  },
  ingredientText: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  ingredientQty: {
    color: theme.colors.textSecondary,
  },
  voteSection: { gap: 8 },
  dayVoteRow: { flexDirection: "row", gap: 6, paddingBottom: 4 },
  dayVoteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.radius.round,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    minWidth: 44,
  },
  dayVoteBtnActive: {
    backgroundColor: theme.colors.purple,
    borderColor: theme.colors.purple,
  },
  dayVoteBtnText: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textSecondary,
  },
  dayVoteBtnTextActive: { color: "#FFF" },
  dayVoteCount: {
    backgroundColor: theme.colors.purple + "30",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    marginTop: 3,
  },
  dayVoteCountText: {
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.purple,
  },
  votersList: { gap: 2, marginTop: 4 },
  votersText: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
});
