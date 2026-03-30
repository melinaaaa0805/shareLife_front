import React from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { theme } from "../../assets/style/theme";

interface Props {
  totalTasks: number;
  doneTasks: number;
  myTasks: number;
  anim: Animated.Value;
}

export default function DayStatsBar({ totalTasks, doneTasks, myTasks, anim }: Props) {
  if (totalTasks === 0) return null;

  return (
    <Animated.View style={[styles.statsBar, { opacity: anim }]}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{totalTasks}</Text>
        <Text style={styles.statLabel}>tâche{totalTasks > 1 ? "s" : ""}</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={[styles.statValue, { color: theme.colors.success }]}>{doneTasks}</Text>
        <Text style={styles.statLabel}>faite{doneTasks > 1 ? "s" : ""}</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={[styles.statValue, { color: theme.colors.purple }]}>{myTasks}</Text>
        <Text style={styles.statLabel}>à moi</Text>
      </View>
      <View style={styles.progressWrapper}>
        <View style={styles.progressBg}>
          <View
            style={[
              styles.progressFill,
              { width: `${totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0}%` as any },
            ]}
          />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
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
  statDivider: { width: 1, height: 28, backgroundColor: theme.colors.border },
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
});
