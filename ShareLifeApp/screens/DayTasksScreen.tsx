import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";
import { useRoute, useIsFocused } from "@react-navigation/native";
import api from "../api/api";
import { theme } from "../assets/style/theme";

export default function DayTasksScreen() {
  const route = useRoute<any>();
  const isFocused = useIsFocused();
  const { date } = route.params; // ex: "2026-01-06"

  const [dayTasks, setDayTasks] = useState<any[]>([]);

  useEffect(() => {
    if (isFocused) fetchDayTasks();
  }, [isFocused]);

  const fetchDayTasks = async () => {
    try {
      const res = await api.get(`tasks?date=${date}`);
      setDayTasks(res.data);
    } catch (e) {
      console.error("Erreur fetch tâches du jour", e);
    }
  };

  const assignTask = async (taskId: string) => {
    try {
      await api.post(`task-assignment/${taskId}`);
      fetchDayTasks(); // refresh après assignation
    } catch (e) {
      console.error("Erreur assign tâche", e);
    }
  };

  const toggleDone = async (taskId: string, done: boolean) => {
    try {
      await api.patch(`tasks/${taskId}`, { done: !done });
      fetchDayTasks(); // refresh après update
    } catch (e) {
      console.error("Erreur update tâche", e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Tâches du {date}</Text>

      <FlatList
        data={dayTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.taskCard}>
            <Text style={styles.title}>{item.title}</Text>
            {item.description && (
              <Text style={styles.desc}>{item.description}</Text>
            )}

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.assignBtn}
                onPress={() => assignTask(item.id)}
              >
                <Text style={styles.btnText}>S'assigner</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.doneBtn, item.done && styles.doneActive]}
                onPress={() => toggleDone(item.id, item.done)}
              >
                <Text style={styles.btnText}>
                  {item.done ? "✓ Fait" : "○ À faire"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucune tâche ce jour</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: theme.colors.background,
  },
  header: {
    fontSize: 18,
    fontFamily: theme.typography.fontFamily.bold,
    marginBottom: 12,
    color: theme.colors.textPrimary,
  },
  taskCard: {
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    ...theme.shadows.soft,
  },
  title: {
    fontSize: 15,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
  },
  desc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  assignBtn: {
    backgroundColor: theme.colors.purple,
    padding: 6,
    borderRadius: 6,
  },
  doneBtn: {
    backgroundColor: theme.colors.textPrimary,
    padding: 6,
    borderRadius: 6,
  },
  doneActive: {
    opacity: 0.6,
  },
  btnText: {
    color: "#FFF",
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.bold,
  },
  empty: {
    fontSize: 13,
    fontStyle: "italic",
    color: theme.colors.textSecondary,
  },
});
