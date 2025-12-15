import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Button, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

type Task = {
  id: string;
  title: string;
  description?: string;
  duration: number;
  recurrence: 'none' | 'daily';
  date: string; // ISO string
};

type Day = {
  date: string;
  tasks: Task[];
};

export default function CalendarScreen() {
  const [days, setDays] = useState<Day[]>([]);
  const [duree, setDuree] = useState(7); // nombre de jours visibles
  const [meal, setMeal] = useState('Qu\'est-ce qu\'on mange ce soir ?');
  const navigation = useNavigation();

  useEffect(() => {
    // Génération des prochains jours
    const today = new Date();
    const nextDays: Day[] = [];
    for (let i = 0; i < duree; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      nextDays.push({ date: date.toISOString().split('T')[0], tasks: [] });
    }
    setDays(nextDays);
  }, [duree]);

  const addTask = (day: string) => {
    navigation.navigate('AddTask', { day });
  };

  return (
    <View style={styles.container}>
      <View style={styles.mealContainer}>
        <Text style={styles.mealText}>{meal}</Text>
      </View>
      <FlatList
        data={days}
        keyExtractor={(item) => item.date}
        renderItem={({ item }) => (
          <View style={styles.dayContainer}>
            <Text style={styles.dayTitle}>{item.date}</Text>
            {item.tasks.map((task) => (
              <Text key={task.id} style={styles.taskText}>{task.title} ({task.duration} min)</Text>
            ))}
            <Button title="Ajouter tâche" onPress={() => addTask(item.date)} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  mealContainer: { padding: 12, backgroundColor: '#f9c74f', borderRadius: 8, marginBottom: 16 },
  mealText: { fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  dayContainer: { marginBottom: 16, padding: 12, backgroundColor: '#eee', borderRadius: 8 },
  dayTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  taskText: { fontSize: 14, marginLeft: 8 },
});
