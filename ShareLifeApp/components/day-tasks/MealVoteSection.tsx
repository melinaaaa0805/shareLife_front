import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../assets/style/theme";
import { WeeklyMeal, MealVote } from "../../types/meals";

interface Props {
  weekMeals: WeeklyMeal[];
  dayVotes: MealVote[];
  votedMealId: string | null;
  isOpen: boolean;
  onToggleOpen: () => void;
  onVote: (mealId: string) => void;
  onAddToShopping: (meal: WeeklyMeal) => void;
}

export default function MealVoteSection({
  weekMeals,
  dayVotes,
  votedMealId,
  isOpen,
  onToggleOpen,
  onVote,
  onAddToShopping,
}: Props) {
  return (
    <View style={styles.mealSection}>
      <TouchableOpacity style={styles.mealSectionHeader} onPress={onToggleOpen}>
        <View style={styles.mealSectionTitleRow}>
          <Ionicons name="restaurant-outline" size={16} color={theme.colors.mint} />
          <Text style={styles.mealSectionTitle}>Qu'est-ce qu'on mange ce soir ?</Text>
          {dayVotes.length > 0 && (
            <View style={styles.mealVotesBadge}>
              <Text style={styles.mealVotesBadgeText}>
                {dayVotes.length} vote{dayVotes.length > 1 ? "s" : ""}
              </Text>
            </View>
          )}
        </View>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={16}
          color={theme.colors.textSecondary}
        />
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.mealSectionBody}>
          {weekMeals.length === 0 ? (
            <Text style={styles.noMealsText}>
              Aucun repas proposé cette semaine. Ajoutez-en depuis l'onglet Repas.
            </Text>
          ) : (
            weekMeals.map((meal) => {
              const mealDayVotes = dayVotes.filter((v) => v.meal?.id === meal.id);
              const isVoted = votedMealId === meal.id;
              return (
                <View
                  key={meal.id}
                  style={[styles.mealVoteCard, isVoted && styles.mealVoteCardActive]}
                >
                  <View style={styles.mealVoteCardLeft}>
                    {meal.imageUrl ? (
                      <Image source={{ uri: meal.imageUrl }} style={styles.mealVoteImage} />
                    ) : (
                      <View style={styles.mealVoteImagePlaceholder}>
                        <Ionicons name="restaurant-outline" size={16} color={theme.colors.mint} />
                      </View>
                    )}
                    <View style={styles.mealVoteInfo}>
                      <Text style={styles.mealVoteName} numberOfLines={1}>{meal.name}</Text>
                      {mealDayVotes.length > 0 && (
                        <Text style={styles.mealVoteVoters} numberOfLines={1}>
                          {mealDayVotes.map((v) => v.user?.firstName).join(", ")}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.mealVoteCardRight}>
                    {mealDayVotes.length > 0 && (
                      <View style={styles.mealVoteCount}>
                        <Text style={styles.mealVoteCountText}>{mealDayVotes.length}</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={[styles.voteBtn, isVoted && styles.voteBtnActive]}
                      onPress={() => onVote(meal.id)}
                    >
                      <Ionicons
                        name={isVoted ? "heart" : "heart-outline"}
                        size={14}
                        color={isVoted ? "#FFF" : theme.colors.textSecondary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cartBtn} onPress={() => onAddToShopping(meal)}>
                      <Ionicons name="cart-outline" size={14} color={theme.colors.mint} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  mealSectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
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
  mealVoteCardLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
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
  mealVoteCardRight: { flexDirection: "row", alignItems: "center", gap: 6 },
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
  voteBtnActive: { backgroundColor: theme.colors.mint, borderColor: theme.colors.mint },
  cartBtn: {
    padding: 7,
    borderRadius: theme.radius.round,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
});
