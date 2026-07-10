import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import api from "../api/api";
import { theme } from "../assets/style/theme";
import {
  LeaderboardResult,
  Reward,
  ScorePeriod,
} from "../types/types";
import { useAuth } from "../context/AuthContext";
import { useGroup } from "../context/GroupContext";
import { useWeek } from "../context/WeekContext";
import PodiumCard from "../components/scores/PodiumCard";
import RankRow from "../components/scores/RankRow";
import AddRewardModal from "../components/scores/AddRewardModal";

const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

export default function ScoresScreen() {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { user } = useAuth();
  const { currentGroup } = useGroup();
  const { week, year } = useWeek();

  const [period, setPeriod] = useState<ScorePeriod>("weekly");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [leaderboard, setLeaderboard] = useState<LeaderboardResult | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddReward, setShowAddReward] = useState(false);
  const [rewardsExpanded, setRewardsExpanded] = useState(false);

  const contentAnim = useRef(new Animated.Value(12)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isFocused && currentGroup) fetchAll();
  }, [isFocused, currentGroup, period, week, year, month]);

  const fetchAll = async () => {
    if (!currentGroup) return;
    setLoading(true);
    try {
      const params =
        period === "weekly"
          ? `period=weekly&week=${week}&year=${year}`
          : `period=monthly&month=${month}&year=${year}`;

      const [lbRes, rwRes] = await Promise.all([
        api.get(`/scores/group/${currentGroup.id}/leaderboard?${params}`),
        api.get(`/scores/group/${currentGroup.id}/rewards`),
      ]);
      setLeaderboard(lbRes.data);
      setRewards(rwRes.data ?? []);

      contentAnim.setValue(12);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.spring(contentAnim, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
      ]).start();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleToggleReward = async (reward: Reward) => {
    try {
      await api.patch(`/scores/rewards/${reward.id}`, { isActive: !reward.isActive });
      fetchAll();
    } catch {
      Alert.alert("Erreur", "Impossible de modifier la récompense.");
    }
  };

  const handleDeleteReward = (id: string) => {
    Alert.alert("Supprimer", "Supprimer cette récompense définitivement ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/scores/rewards/${id}`);
            fetchAll();
          } catch {
            Alert.alert("Erreur", "Impossible de supprimer.");
          }
        },
      },
    ]);
  };

  const navigateMonth = (dir: -1 | 1) => {
    setMonth((prev) => {
      let next = prev + dir;
      if (next < 1) next = 12;
      if (next > 12) next = 1;
      return next;
    });
  };

  if (!currentGroup) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="trophy-outline" size={48} color={theme.colors.textSecondary} />
        <Text style={styles.emptyText}>Aucun groupe sélectionné</Text>
      </View>
    );
  }

  const currentUserId = user?.id ?? "";
  const entries = leaderboard?.entries ?? [];
  const maxScore = entries[0]?.score ?? 1;
  const winnerReward = leaderboard?.winnerReward as Reward | null ?? null;
  const loserReward = leaderboard?.loserReward as Reward | null ?? null;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>Scores</Text>
        <Text style={styles.headerSub}>{currentGroup.name}</Text>
      </View>
      <View style={styles.periodRow}>
        <Pressable
          style={[styles.periodBtn, period === "weekly" && styles.periodBtnActive]}
          onPress={() => setPeriod("weekly")}
        >
          <Ionicons
            name="calendar-outline"
            size={14}
            color={period === "weekly" ? theme.colors.purple : theme.colors.textSecondary}
          />
          <Text style={[styles.periodLabel, period === "weekly" && styles.periodLabelActive]}>
            Semaine {week}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.periodBtn, period === "monthly" && styles.periodBtnActive]}
          onPress={() => setPeriod("monthly")}
        >
          <Ionicons
            name="stats-chart-outline"
            size={14}
            color={period === "monthly" ? theme.colors.purple : theme.colors.textSecondary}
          />
          <Text style={[styles.periodLabel, period === "monthly" && styles.periodLabelActive]}>
            Mensuel
          </Text>
        </Pressable>
      </View>
      {period === "monthly" && (
        <View style={styles.monthNav}>
          <Pressable style={styles.monthArrow} onPress={() => navigateMonth(-1)}>
            <Ionicons name="chevron-back" size={18} color={theme.colors.purple} />
          </Pressable>
          <Text style={styles.monthLabel}>{MONTHS_FR[month - 1]} {year}</Text>
          <Pressable style={styles.monthArrow} onPress={() => navigateMonth(1)}>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.purple} />
          </Pressable>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} tintColor={theme.colors.purple} />
        }
      >
        {loading ? (
          <Text style={styles.emptyText}>Chargement…</Text>
        ) : (
          <Animated.View style={{ opacity: opacityAnim, transform: [{ translateY: contentAnim }], gap: theme.spacing.md }}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIconBox}>
                  <Ionicons name="trophy-outline" size={14} color={theme.colors.yellow} />
                </View>
                <Text style={styles.cardTitle}>Classement</Text>
              </View>
              <PodiumCard
                entries={entries}
                currentUserId={currentUserId}
                winnerRewardTitle={winnerReward?.title}
                loserRewardTitle={loserReward?.title}
              />
            </View>
            {entries.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardIconBox}>
                    <Ionicons name="list-outline" size={14} color={theme.colors.purple} />
                  </View>
                  <Text style={styles.cardTitle}>Détail</Text>
                </View>
                {entries.map((entry, i) => (
                  <RankRow
                    key={entry.userId}
                    entry={entry}
                    maxScore={maxScore}
                    currentUserId={currentUserId}
                    winnerReward={winnerReward}
                    loserReward={loserReward}
                    isLast={i === entries.length - 1}
                  />
                ))}
              </View>
            )}
            <View style={styles.card}>
              <Pressable
                style={styles.cardHeader}
                onPress={() => setRewardsExpanded((p) => !p)}
              >
                <View style={styles.cardIconBox}>
                  <Ionicons name="gift-outline" size={14} color={theme.colors.pink} />
                </View>
                <Text style={styles.cardTitle}>Récompenses</Text>
                <View style={styles.cardHeaderRight}>
                  {rewards.length > 0 && (
                    <View style={styles.rewardCountBadge}>
                      <Text style={styles.rewardCountText}>{rewards.length}</Text>
                    </View>
                  )}
                  <Ionicons
                    name={rewardsExpanded ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={theme.colors.textSecondary}
                  />
                </View>
              </Pressable>

              {rewardsExpanded && (
                <>
                  {rewards.length === 0 ? (
                    <View style={styles.rewardsEmpty}>
                      <Text style={styles.rewardsEmptyText}>
                        Aucune récompense — appuyez sur + pour en créer une
                      </Text>
                    </View>
                  ) : (
                    rewards.map((r) => (
                      <View key={r.id} style={[styles.rewardRow, !r.isActive && styles.rewardRowInactive]}>
                        <View style={[
                          styles.rewardIconBox,
                          { backgroundColor: (r.assignedTo === "WINNER" ? theme.colors.yellow : theme.colors.danger) + "20" },
                        ]}>
                          <Ionicons
                            name={r.assignedTo === "WINNER" ? "trophy" : "skull-outline"}
                            size={16}
                            color={r.assignedTo === "WINNER" ? theme.colors.yellow : theme.colors.danger}
                          />
                        </View>
                        <View style={styles.rewardInfo}>
                          <Text style={[styles.rewardTitle, !r.isActive && styles.rewardTitleInactive]}>
                            {r.title}
                          </Text>
                          {r.description && (
                            <Text style={styles.rewardDesc}>{r.description}</Text>
                          )}
                          <Text style={[
                            styles.rewardAssignee,
                            { color: r.assignedTo === "WINNER" ? theme.colors.yellow : theme.colors.danger },
                          ]}>
                            {r.assignedTo === "WINNER" ? "→ Gagnant" : "→ Dernier"}
                          </Text>
                        </View>
                        <View style={styles.rewardActions}>
                          <Pressable onPress={() => handleToggleReward(r)} hitSlop={8}>
                            <Ionicons
                              name={r.isActive ? "eye-outline" : "eye-off-outline"}
                              size={18}
                              color={r.isActive ? theme.colors.success : theme.colors.textSecondary}
                            />
                          </Pressable>
                          <Pressable onPress={() => handleDeleteReward(r.id)} hitSlop={8}>
                            <Ionicons name="trash-outline" size={18} color={theme.colors.danger} />
                          </Pressable>
                        </View>
                      </View>
                    ))
                  )}

                  <Pressable style={styles.addRewardBtn} onPress={() => setShowAddReward(true)}>
                    <Ionicons name="add-circle-outline" size={16} color={theme.colors.purple} />
                    <Text style={styles.addRewardText}>Ajouter une récompense</Text>
                  </Pressable>
                </>
              )}
            </View>
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.infoText}>
                Score = somme de{" "}
                <Text style={styles.infoCode}>poids × (1 + min(durée, 120 min) / 60)</Text>
                {" "}par tâche complétée.
              </Text>
            </View>

          </Animated.View>
        )}
      </ScrollView>

      <AddRewardModal
        visible={showAddReward}
        onClose={() => setShowAddReward(false)}
        onCreated={fetchAll}
        groupId={currentGroup.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },

  emptyContainer: { flex: 1, backgroundColor: theme.colors.background, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: theme.typography.size.sm, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textSecondary, textAlign: "center" },

  // Header
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: 10,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    alignItems: "center",
  },
  headerTitle: { fontSize: theme.typography.size.md, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.textPrimary },
  headerSub: { fontSize: theme.typography.size.xs, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textSecondary },

  // Period toggle
  periodRow: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: theme.spacing.sm,
  },
  periodBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  periodBtnActive: { borderBottomColor: theme.colors.purple },
  periodLabel: { fontSize: theme.typography.size.sm, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.textSecondary },
  periodLabelActive: { color: theme.colors.purple, fontFamily: theme.typography.fontFamily.semiBold },

  // Month nav
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  monthArrow: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: theme.colors.background,
    borderWidth: 1, borderColor: theme.colors.border,
    alignItems: "center", justifyContent: "center",
  },
  monthLabel: { fontSize: theme.typography.size.sm, fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.textPrimary },

  // Scroll
  scroll: { padding: theme.spacing.md, gap: theme.spacing.md, paddingBottom: 40 },

  // Card
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardHeaderRight: { marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 8 },
  cardIconBox: { width: 24, height: 24, borderRadius: 12, backgroundColor: theme.colors.card, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: theme.typography.size.sm, fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.textPrimary },

  // Rewards
  rewardCountBadge: { backgroundColor: theme.colors.pink + "30", borderRadius: theme.radius.round, paddingHorizontal: 7, paddingVertical: 2 },
  rewardCountText: { fontSize: 10, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.pink },
  rewardsEmpty: { paddingVertical: 12 },
  rewardsEmptyText: { fontSize: theme.typography.size.xs, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textSecondary, textAlign: "center" },
  rewardRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: theme.colors.border },
  rewardRowInactive: { opacity: 0.4 },
  rewardIconBox: { width: 36, height: 36, borderRadius: theme.radius.sm, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  rewardInfo: { flex: 1, gap: 2 },
  rewardTitle: { fontSize: theme.typography.size.sm, fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.textPrimary },
  rewardTitleInactive: { color: theme.colors.textSecondary },
  rewardDesc: { fontSize: theme.typography.size.xs, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textSecondary },
  rewardAssignee: { fontSize: theme.typography.size.xs, fontFamily: theme.typography.fontFamily.medium },
  rewardActions: { flexDirection: "row", gap: 12, paddingTop: 2 },
  addRewardBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: theme.colors.border },
  addRewardText: { fontSize: theme.typography.size.sm, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.purple },

  // Info box
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoText: { flex: 1, fontSize: theme.typography.size.xs, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textSecondary, lineHeight: 18 },
  infoCode: { fontFamily: theme.typography.fontFamily.medium, color: theme.colors.textPrimary },
});
