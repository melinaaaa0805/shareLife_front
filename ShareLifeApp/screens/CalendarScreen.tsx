import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import api from '../api/api';
import { theme } from '../assets/style/theme';
import { RootStackParamList } from '../types/types';
import { useGroup } from '../context/GroupContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type Task = {
  id: string;
  title: string;
  description?: string | null;
  duration: number | null;
  frequency: 'ONCE' | 'DAILY' | 'WEEKLY';
  weekNumber: number;
  year: number;
  dayOfWeek: number;
  date: string | null;
  group: any;
  createdBy: any;
};

const DAYS_FR = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export default function CalendarScreen() {
  const today = new Date();
  const isFocused = useIsFocused();
  const navigation = useNavigation<NavigationProp>();
  const group = useGroup();
  const currentGroup = group.currentGroup;
  const [week, setWeek] = useState(getISOWeek(today));
  const [year, setYear] = useState(today.getFullYear());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const groupId = currentGroup?.id;

  useEffect(() => {
    loadTasks();
  }, [week, year]);

  useEffect(() => {
    if (isFocused) loadTasks();
  }, [isFocused]);

  const loadTasks = async () => {
    try {
      const res = await api.get(`/tasks/week/${groupId}/${year}/${week}`);
      setTasks(res.data);
    } catch (e) {
      console.error("Erreur chargement tâches", e);
    }
  };

  const changeWeek = (direction: 1 | -1) => {
    const newWeek = week + direction;

    if (newWeek < 1) {
      setYear(year - 1);
      setWeek(52);
    } else if (newWeek > 52) {
      setYear(year + 1);
      setWeek(1);
    } else {
      setWeek(newWeek);
    }
  };

  const weekDates = getWeekDatesFromISO(year, week);

  const handleDayPress = (date: string, index: number) => {
    navigation.navigate('DayTasks', { date, dayIndex: index });
  };

  // ----- NOUVEAU -----
  const handleAddTask = () => {
    setModalVisible(true); // ouvre le menu
  };

  const handleCreateTask = () => {
    setModalVisible(false);
    navigation.navigate('AddTask'); // écran de création
  };

  const handleImportTask = () => {
    setModalVisible(false);
    const today = new Date().toISOString().split('T')[0]; // "2026-01-06"
  navigation.navigate('ImportTask', { day: today });
  };

  return (
    <View style={styles.container}>
      {/* semaine */}
      <View style={styles.weekHeader}>
        <TouchableOpacity onPress={() => changeWeek(-1)}>
          <Text style={styles.arrow}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.weekTitle}>Semaine {week} — {year}</Text>

        <TouchableOpacity onPress={() => changeWeek(1)}>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Ajouter tâche */}
      <TouchableOpacity style={styles.addTaskGlobal} onPress={handleAddTask}>
        <Text style={styles.addTaskText}>+ Ajouter une tâche</Text>
      </TouchableOpacity>

      {/* Modal menu Créer / Importer */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={handleCreateTask} style={styles.modalButton}>
              <Text style={styles.modalText}>Créer une tâche</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleImportTask} style={styles.modalButton}>
              <Text style={styles.modalText}>Importer une tâche</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCancel}>
              <Text style={[styles.modalText, { color: theme.colors.purple }]}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {weekDates.map((day, i) => {
          const dayTasks = tasks.filter(t => t.dayOfWeek === i);

          return (
            <TouchableOpacity
              key={day}
              onPress={() => handleDayPress(day, i)}
              style={styles.dayCard}
            >
              <Text style={styles.dayHeader}>{DAYS_FR[i]}</Text>
              <Text style={styles.dateText}>{day}</Text>

              {dayTasks.length ? (
                dayTasks.map(task => (
                  <View key={task.id} style={styles.taskItem}>
                    <Text style={styles.taskText}>• {task.title}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noTask}>Aucune tâche</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ---- Utils semaine ISO ----
// (inchangés)
function getWeekDatesFromISO(year: number, week: number) {
  const d = new Date(year, 0, 4);
  d.setDate(d.getDate() + (week - 1) * 7 - ((d.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(d);
    date.setDate(d.getDate() + i);
    return date.toISOString().split('T')[0];
  });
}

function getISOWeek(date: Date) {
  const tmp = new Date(date);
  tmp.setHours(0, 0, 0, 0);
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
  const week1 = new Date(tmp.getFullYear(), 0, 4);
  return 1 + Math.round(((tmp.getTime() - week1.getTime()) / 86400000
    - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

// ---- Styles UI ----
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: 16 },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  arrow: { fontSize: 26, fontWeight: 'bold', color: theme.colors.purple, paddingHorizontal: 10 },
  weekTitle: { fontSize: 18, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.textPrimary },
  addTaskGlobal: { backgroundColor: theme.colors.purple, padding: 10, borderRadius: 8, marginBottom: 16, alignSelf: 'center' },
  addTaskText: { color: theme.colors.background, fontFamily: theme.typography.fontFamily.semiBold },
  dayCard: { width: 150, backgroundColor: theme.colors.surface, borderRadius: 12, padding: 12, marginRight: 8, ...theme.shadows.soft },
  dayHeader: { fontSize: 16, fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.textPrimary },
  dateText: { fontSize: 12, color: theme.colors.textSecondary, marginBottom: 8 },
  taskItem: { marginBottom: 6 },
  taskText: { fontSize: 13, color: theme.colors.textPrimary },
  noTask: { fontSize: 12, fontStyle: 'italic', color: theme.colors.textSecondary, marginBottom: 8 },

  // --- Modal ---
  modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'center', alignItems:'center' },
  modalContent: { backgroundColor: theme.colors.surface, borderRadius:12, width:250, padding:16, alignItems:'center' },
  modalButton: { paddingVertical:12, width:'100%', alignItems:'center' },
  modalCancel: { paddingVertical:12, width:'100%', alignItems:'center', marginTop:8, borderTopWidth:1, borderColor:theme.colors.textSecondary },
  modalText: { fontSize:16, color:theme.colors.textPrimary, fontFamily: theme.typography.fontFamily.semiBold }
});
