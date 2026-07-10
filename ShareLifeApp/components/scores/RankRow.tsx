import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../assets/style/theme";
import { LeaderboardEntry, Reward } from "../../types/types";

const PALETTE = ["#9B7BEA", "#EAB1CF", "#FFE27A", "#A6D8C0", "#7BC8EA", "#EA9B7B"];
const MAX_SCORE_DISPLAY = 30;

interface Props {
  entry: LeaderboardEntry;
  maxScore: number;
  currentUserId: string;
  winnerReward: Reward | null;
  loserReward: Reward | null;
  isLast: boolean;
}

export default function RankRow({ entry, maxScore, currentUserId, winnerReward, loserReward, isLast }: Props) {
  const barAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const isMe = entry.userId === currentUserId;
  const color = PALETTE[entry.rank % PALETTE.length];
  const pct = maxScore > 0 ? entry.score / maxScore : 0;
  const delay = 100 + entry.rank * 60;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, delay, useNativeDriver: true }),
      Animated.timing(barAnim, { toValue: pct, duration: 700, delay, useNativeDriver: false }),
    ]).start();
  }, [pct]);

  const rankLabel = entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`;

  return (
    <Animated.View style={[styles.row, isMe && styles.rowMe, { opacity: opacityAnim }]}>
      {/* Rank */}
      <Text style={styles.rank}>{rankLabel}</Text>

      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: color + "25", borderColor: color + "60" }]}>
        <Text style={[styles.avatarInitial, { color }]}>
          {(entry.firstName?.[0] ?? "?").toUpperCase()}
        </Text>
      </View>

      {/* Info + bar */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, isMe && styles.nameMe]}>
            {isMe ? "Toi" : entry.firstName}
          </Text>
          {/* Reward indicators */}
          {entry.rank === 1 && winnerReward && (
            <View style={styles.rewardChip}>
              <Ionicons name="trophy" size={10} color={theme.colors.yellow} />
              <Text style={[styles.rewardChipText, { color: theme.colors.yellow }]} numberOfLines={1}>
                {winnerReward.title}
              </Text>
            </View>
          )}
          {isLast && loserReward && (
            <View style={[styles.rewardChip, styles.rewardChipLoser]}>
              <Ionicons name="skull-outline" size={10} color={theme.colors.danger} />
              <Text style={[styles.rewardChipText, { color: theme.colors.danger }]} numberOfLines={1}>
                {loserReward.title}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.barBg}>
          <Animated.View
            style={[
              styles.barFill,
              {
                width: barAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
                backgroundColor: color,
              },
            ]}
          />
        </View>
      </View>

      {/* Score */}
      <Text style={[styles.score, { color }]}>{entry.score} pts</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: theme.radius.sm,
  },
  rowMe: {
    backgroundColor: theme.colors.purple + "12",
    borderWidth: 1,
    borderColor: theme.colors.purple + "30",
  },
  rank: {
    width: 28,
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
  },
  info: { flex: 1, gap: 4 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  name: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textPrimary,
  },
  nameMe: {
    color: theme.colors.purple,
    fontFamily: theme.typography.fontFamily.semiBold,
  },
  rewardChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: theme.colors.yellow + "15",
    borderRadius: theme.radius.round,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: theme.colors.yellow + "40",
    maxWidth: 120,
  },
  rewardChipLoser: {
    backgroundColor: theme.colors.danger + "15",
    borderColor: theme.colors.danger + "40",
  },
  rewardChipText: {
    fontSize: 9,
    fontFamily: theme.typography.fontFamily.medium,
    flexShrink: 1,
  },
  barBg: {
    height: 4,
    backgroundColor: theme.colors.card,
    borderRadius: 2,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 2 },
  score: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.bold,
    minWidth: 50,
    textAlign: "right",
  },
});
