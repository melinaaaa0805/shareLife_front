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
const res = await api.get('/tasks/unassigned');
console.log(res.data);
if(res.data > 0){
      setTasks(res.data);
} 
    } catch (err) {
      console.error(err);
    }
  };

  if (!tasks.length) return <Text>Aucune tâche non assignée</Text>;

  return (
      <View style={{ padding: 10, marginBottom: 10, backgroundColor: '#fff' }}>
    <FlatList
      data={tasks}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <TaskCard task={item} />}
      contentContainerStyle={styles.list}
    />
    </View>
  );
};

export default UnassignedTasksScreen;

const styles = StyleSheet.create({
  list: { padding: 20 },
});
