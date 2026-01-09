import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import api from "../api/api";
import { Task } from "../types/types";
import TaskCard from "../components/TaskCard";
import { useGroup } from "../context/GroupContext";
import { useAuth } from "../context/AuthContext";

const TasksScreen = () => {
  const { currentGroup } = useGroup();
  const { user } = useAuth();
  const groupId = currentGroup?.id;
  const currentUserId = user?.id;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await api.get(`/task-assignment/users/${currentUserId}`);
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Text>Chargement...</Text>;
  if (!tasks.length) return <Text>Aucune tâche trouvée</Text>;

  return (
    <FlatList
      data={tasks}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <TaskCard task={item} />}
      contentContainerStyle={styles.list}
    />
  );
};

export default TasksScreen;

const styles = StyleSheet.create({
  list: { padding: 20 },
});
