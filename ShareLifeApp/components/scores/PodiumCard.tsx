import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../assets/style/theme";
import { LeaderboardEntry } from "../../types/types";

const RANK_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];
const RANK_HEIGHTS = [100, 80, 64];
const RANK_ICONS: ("trophy" | "medal" | "ribbon")[] = ["trophy", "medal", "ribbon"];
const PALETTE = ["#9B7BEA", "#EAB1CF", "#FFE27A", "#A6D8C0", "#7BC8EA", "#EA9B7B"];

interface Props {
  entries: LeaderboardEntry[];
  currentUserId: string;
  winnerRewardTitle?: string | null;
  loserRewardTitle?: string | null;
}

function PodiumColumn({
  entry,
  position,
  currentUserId,
}: {
  entry: LeaderboardEntry;
  position: 0 | 1 | 2;
  currentUserId: string;
}) {
  const heightAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const isMe = entry.userId === currentUserId;
  const color = PALETTE[entry.rank % PALETTE.length];
  const rankColor = RANK_COLORS[position];
  const barHeight = RANK_HEIGHTS[position];

  useEffect(() => {
    const delay = [200, 0, 400][position];
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.spring(heightAnim, { toValue: barHeight, tension: 60, friction: 10, delay, useNativeDriver: false }),
    ]).start();
  }, []);

  return (
    <View style={[styles.column, position === 0 && styles.columnFirst]}>
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: color + "25", borderColor: color }]}>
        <Text style={[styles.avatarInitial, { color }]}>
          {(entry.firstName?.[0] ?? "?").toUpperCase()}
        </Text>
        {isMe && <View style={styles.meIndicator} />}
      </View>

      <Text style={styles.entryName} numberOfLines={1}>
        {isMe ? "Toi" : entry.firstName}
      </Text>
      <Text style={[styles.entryScore, { color: rankColor }]}>{entry.score} pts</Text>

      {/* Podium bar */}
      <Animated.View
        style={[
          styles.bar,
          {
            height: heightAnim,
            backgroundColor: rankColor + "30",
            borderTopColor: rankColor,
          },
        ]}
      >
        <Ionicons name={RANK_ICONS[position]} size={16} color={rankColor} />
      </Animated.View>
    </View>
  );
}

export default function PodiumCard({ entries, currentUserId, winnerRewardTitle, loserRewardTitle }: Props) {
  if (entries.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="trophy-outline" size={40} color={theme.colors.border} />
        <Text style={styles.emptyText}>Aucune tâche complétée sur cette période</Text>
      </View>
    );
  }

  // Podium order: 2nd left, 1st center, 3rd right
  const top3 = entries.slice(0, 3);
  const podiumOrder: (LeaderboardEntry | null)[] = [
    top3[1] ?? null,
    top3[0] ?? null,
    top3[2] ?? null,
  ];

  return (
    <View style={styles.container}>
      {/* Reward badges */}
      {(winnerRewardTitle || loserRewardTitle) && (
        <View style={styles.rewardRow}>
          {winnerRewardTitle && (
            <View style={[styles.rewardBadge, styles.rewardBadgeWinner]}>
              <Ionicons name="trophy" size={12} color={theme.colors.yellow} />
              <Text style={[styles.rewardBadgeText, { color: theme.colors.yellow }]} numberOfLines={1}>
                {winnerRewardTitle}
              </Text>
            </View>
          )}
          {loserRewardTitle && (
            <View style={[styles.rewardBadge, styles.rewardBadgeLoser]}>
              <Ionicons name="skull-outline" size={12} color={theme.colors.danger} />
              <Text style={[styles.rewardBadgeText, { color: theme.colors.danger }]} numberOfLines={1}>
                {loserRewardTitle}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Podium */}
      <View style={styles.podium}>
        {podiumOrder.map((entry, i) =>
          entry ? (
            <PodiumColumn
              key={entry.userId}
              entry={entry}
              position={i as 0 | 1 | 2}
              currentUserId={currentUserId}
            />
          ) : (
            <View key={i} style={styles.column} />
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: theme.spacing.sm },
  empty: { alignItems: "center", gap: 12, paddingVertical: 40 },
  emptyText: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },

  // Reward badges
  rewardRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  rewardBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.round,
    borderWidth: 1,
    flex: 1,
  },
  rewardBadgeWinner: {
    backgroundColor: theme.colors.yellow + "15",
    borderColor: theme.colors.yellow + "50",
  },
  rewardBadgeLoser: {
    backgroundColor: theme.colors.danger + "15",
    borderColor: theme.colors.danger + "50",
  },
  rewardBadgeText: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.medium,
    flex: 1,
  },

  // Podium
  podium: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  column: { flex: 1, alignItems: "center", gap: 4 },
  columnFirst: {},
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.bold,
  },
  meIndicator: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.purple,
    borderWidth: 1.5,
    borderColor: theme.colors.background,
  },
  entryName: {
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textPrimary,
    textAlign: "center",
  },
  entryScore: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.bold,
    textAlign: "center",
  },
  bar: {
    width: "100%",
    borderTopWidth: 2,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 6,
  },
});
