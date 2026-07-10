import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import api from "../../api/api";
import { theme } from "../../assets/style/theme";
import { Insight, RootStackParamList } from "../../types/types";

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const SEVERITY_STYLE: Record<
  string,
  { border: string; bg: string; icon: keyof typeof Ionicons.glyphMap; iconColor: string }
> = {
  warning: {
    border: theme.colors.warning,
    bg: theme.colors.warning + "12",
    icon: "warning-outline",
    iconColor: theme.colors.warning,
  },
  info: {
    border: theme.colors.purple,
    bg: theme.colors.purple + "0D",
    icon: "bulb-outline",
    iconColor: theme.colors.purple,
  },
  success: {
    border: theme.colors.success,
    bg: theme.colors.success + "12",
    icon: "checkmark-circle-outline",
    iconColor: theme.colors.success,
  },
};

function InsightCard({
  insight,
  index,
  groupId,
}: {
  insight: Insight;
  index: number;
  groupId: string;
}) {
  const navigation = useNavigation<NavProp>();
  const slideAnim = useRef(new Animated.Value(12)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const sev = SEVERITY_STYLE[insight.severity] ?? SEVERITY_STYLE.info;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 10,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleAction = () => {
    if (!insight.action) return;
    switch (insight.action.type) {
      case "NAVIGATE_SMART_ASSIGN":
        navigation.navigate("SmartAssign", { groupId });
        break;
      case "NAVIGATE_WEEK_TEMPLATE":
        navigation.navigate("WeekTemplate");
        break;
      case "NAVIGATE_DAY": {
        const date = (insight.action.payload?.date as string) ?? new Date().toISOString().split("T")[0];
        navigation.navigate("DayTasks", { date, dayIndex: 0 });
        break;
      }
    }
  };

  return (
    <Animated.View
      style={[
        styles.card,
        {
          borderLeftColor: sev.border,
          backgroundColor: sev.bg,
          opacity: opacityAnim,
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      <View style={styles.cardTop}>
        {/* Emoji icon */}
        <Text style={styles.emoji}>{insight.icon}</Text>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{insight.title}</Text>
          <Text style={styles.cardBody}>{insight.body}</Text>
        </View>
      </View>

      {insight.action && (
        <Pressable style={[styles.actionBtn, { borderColor: sev.border }]} onPress={handleAction}>
          <Text style={[styles.actionText, { color: sev.iconColor }]}>
            {insight.action.label}
          </Text>
          <Ionicons name="arrow-forward" size={12} color={sev.iconColor} />
        </Pressable>
      )}
    </Animated.View>
  );
}

interface Props {
  groupId: string;
  week: number;
  year: number;
}

export default function InsightsSection({ groupId, week, year }: Props) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get(`/insights/group/${groupId}?week=${week}&year=${year}`)
      .then((res) => {
        if (!cancelled) setInsights(res.data ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [groupId, week, year]);

  if (loading || insights.length === 0) return null;

  const warnings = insights.filter((i) => i.severity === "warning").length;

  return (
    <View style={styles.section}>
      {/* Section header */}
      <Pressable style={styles.sectionHeader} onPress={() => setCollapsed((p) => !p)}>
        <View style={styles.sectionLeft}>
          <View style={styles.sectionIconBox}>
            <Ionicons name="sparkles-outline" size={14} color={theme.colors.purple} />
          </View>
          <Text style={styles.sectionTitle}>Suggestions</Text>
          {warnings > 0 && (
            <View style={styles.warningBadge}>
              <Text style={styles.warningBadgeText}>{warnings}</Text>
            </View>
          )}
        </View>
        <Ionicons
          name={collapsed ? "chevron-down" : "chevron-up"}
          size={16}
          color={theme.colors.textSecondary}
        />
      </Pressable>

      {!collapsed &&
        insights.map((insight, i) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            index={i}
            groupId={groupId}
          />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing.md,
  },
  sectionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.purple + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
  },
  warningBadge: {
    backgroundColor: theme.colors.warning + "30",
    borderRadius: theme.radius.round,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  warningBadgeText: {
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.warning,
  },

  // Card
  card: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    borderLeftWidth: 3,
    padding: 12,
    gap: 10,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  emoji: {
    fontSize: 20,
    lineHeight: 24,
  },
  cardContent: { flex: 1, gap: 3 },
  cardTitle: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
  },
  cardBody: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: theme.radius.round,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  actionText: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.semiBold,
  },
});
