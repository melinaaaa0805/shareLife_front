import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import api from '../api/api';
import { Task } from '../types/types';
import TaskCard from '../components/TaskCard';

type RouteProps = RouteProp<{ params: { groupId: string } }, 'params'>;

const UnassignedTasksScreen = () => {
  const route = useRoute<RouteProps>();
  const { groupId } = route.params;

  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await api.get(`/groups/${groupId}/tasks`);
      setTasks(res.data.filter((t: Task) => !t.assignedUser));
    } catch (err) {
      console.error(err);
    }
  };

  if (!tasks.length) return <Text>Aucune tâche non assignée</Text>;

  return (
    <FlatList
      data={tasks}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <TaskCard task={item} />}
      contentContainerStyle={styles.list}
    />
  );
};

export default UnassignedTasksScreen;

const styles = StyleSheet.create({
  list: { padding: 20 },
});
