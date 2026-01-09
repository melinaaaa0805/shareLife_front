import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../assets/style/theme";

const MONTHS_FR = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

type DayCardProps = {
  date: string;
  tasks: any[];
};

export default function DayCard({ date, tasks }: DayCardProps) {
  const d = new Date(date);
  const formattedDate = `${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;

  // Animation fade-in
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
      <Text style={styles.dateText}>{formattedDate}</Text>
      <View style={styles.taskList}>
        {tasks.length ? (
          tasks.map((t) => (
            <View key={t.id} style={styles.taskItem}>
              <Ionicons
                name={
                  t.status === "DONE" ? "checkmark-circle" : "ellipse-outline"
                }
                size={16}
                color={
                  t.status === "DONE"
                    ? theme.colors.success
                    : theme.colors.textSecondary
                }
                style={{ marginRight: 6 }}
              />
              <Text style={styles.taskText}>{t.title}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noTask}>Aucune tâche</Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 180,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    ...theme.shadows.soft,
  },
  dateText: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  taskList: {
    minHeight: 50,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  taskText: {
    fontSize: 13,
    color: theme.colors.textPrimary,
  },
  noTask: {
    fontSize: 12,
    fontStyle: "italic",
    color: theme.colors.textSecondary,
  },
});
