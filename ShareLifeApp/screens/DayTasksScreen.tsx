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
import { useGroup } from "../context/GroupContext";
import { useAuth } from "../context/AuthContext";

export default function DayTasksScreen() {
  const route = useRoute<any>();
  const isFocused = useIsFocused();
  const { date } = route.params; // ex: "2026-01-06"
  const group = useGroup();
  const currentGroup = group.currentGroup;
  const [dayTasks, setDayTasks] = useState<any[]>([]);
  const user = useAuth();
  const userId = user.user?.id;

  useEffect(() => {
    if (isFocused) fetchDayTasks();
  }, [isFocused]);

  const fetchDayTasks = async () => {
    try {
      const res = await api.get(`tasks/${date}/${currentGroup?.id}`);
      setDayTasks(res.data);
    } catch (e) {
      console.error("Erreur fetch tâches du jour", e);
    }
  };

  const assignTask = async (taskId: string) => {
    try {
      await api.post(`task-assignment/${taskId}`);
      // Mise à jour locale UI
      setDayTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, user: { id: userId }, status: "PENDING" }
            : t
        )
      );
    } catch (e) {
      console.error("Erreur assign tâche", e);
    }
  };

  const toggleDone = async (taskId: string) => {
    try {
      await api.patch(`tasks/${taskId}`, { status: "DONE" });

      // Mise à jour locale UI
      setDayTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: "DONE" } : t))
      );
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
        renderItem={({ item }) => {
          const isAssigned = !!item.taskAssignment;
          const isMine = item.taskAssignment?.user?.id === userId;
          const status = item.taskAssignment?.status;
          return (
            <View style={styles.taskCard}>
              <Text style={styles.title}>{item.title}</Text>
              {item.description && (
                <Text style={styles.desc}>{item.description}</Text>
              )}

              {isMine && (
                <Text
                  style={{
                    fontSize: 12,
                    marginTop: 4,
                    fontFamily: theme.typography.fontFamily.bold,
                  }}
                >
                  🌟 Ma tâche
                </Text>
              )}

              <View style={styles.actions}>
                {/* Bouton S'assigner → affiché uniquement si NON assignée */}
                {!isAssigned && (
                  <TouchableOpacity
                    style={styles.assignBtn}
                    onPress={() => assignTask(item.id)}
                  >
                    <Text style={styles.btnText}>S'assigner</Text>
                  </TouchableOpacity>
                )}

                {/* Bouton Done → affiché uniquement si c'est MA tâche et pas encore DONE */}
                {isMine && status !== "DONE" && (
                  <TouchableOpacity
                    style={styles.doneBtn}
                    onPress={() => toggleDone(item.id)}
                  >
                    <Text style={styles.btnText}>✓ Done</Text>
                  </TouchableOpacity>
                )}

                {/* Badge quand DONE */}
                {status === "DONE" && isMine && (
                  <Text
                    style={{
                      fontSize: 11,
                      color: theme.colors.success,
                      fontFamily: theme.typography.fontFamily.bold,
                    }}
                  >
                    ✔️ Fait
                  </Text>
                )}
              </View>
            </View>
          );
        }}
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
