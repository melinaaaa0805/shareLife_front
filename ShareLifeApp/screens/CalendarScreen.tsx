import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import api from "../api/api";
import { theme } from "../assets/style/theme";
import { useGroup } from "../context/GroupContext";
import { RootStackParamList } from "../types/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type Task = {
  id: string;
  title: string;
  description?: string | null;
  duration: number | null;
  frequency: "ONCE" | "DAILY" | "WEEKLY";
  weekNumber: number;
  year: number;
  dayOfWeek: number;
  date: string | null;
  completedAt?: string | null;
};

const DAYS_FR = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function CalendarScreen() {
  const today = new Date();
  const navigation = useNavigation<NavigationProp>();
  const isFocused = useIsFocused();

  const { currentGroup } = useGroup();
  const groupId = currentGroup?.id; // ✅ récupère l'UUID réel

  const [week, setWeek] = useState(getISOWeek(today));
  const [year, setYear] = useState(today.getFullYear());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (groupId) loadTasks();
  }, [week, year, isFocused, groupId]);

  const loadTasks = async () => {
    try {
      const res = await api.get(`/tasks/week/${groupId}/${year}/${week}`);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setTasks(res.data);
    } catch (e) {
      console.error("Erreur chargement tâches", e);
    }
  };

  const changeWeek = (direction: 1 | -1) => {
    let newWeek = week + direction;
    let newYear = year;

    if (newWeek < 1) {
      newWeek = 52;
      newYear = year - 1;
    } else if (newWeek > 52) {
      newWeek = 1;
      newYear = year + 1;
    }

    setWeek(newWeek);
    setYear(newYear);
  };

  const weekDates = getWeekDatesFromISO(year, week);

  const handleDayPress = (date: string, dayIndex: number) => {
    navigation.navigate("DayTasks", { date, dayIndex });
  };

  const handleAddTask = () => setModalVisible(true);
  const handleCreateTask = () => {
    setModalVisible(false);
    navigation.navigate("AddTask", { task: undefined });
  };
  const handleImportTask = () => {
    setModalVisible(false);
    navigation.navigate("ImportTask", {
      day: today.toISOString().split("T")[0],
    });
  };

  const renderDayCard = ({ item, index }: { item: string; index: number }) => {
    const dayTasks = tasks.filter((t) => t.date === item);

    return (
      <TouchableOpacity
        style={styles.dayCard}
        onPress={() => handleDayPress(item, index)}
      >
        <Text style={styles.dayHeader}>{DAYS_FR[index]}</Text>
        <Text style={styles.dateText}>{formatDate(item)}</Text>

        {dayTasks.length ? (
          dayTasks.map((task) => (
            <View key={task.id} style={styles.taskItem}>
              <Ionicons
                name={task.completedAt ? "checkmark-circle" : "ellipse-outline"}
                size={16}
                color={task.completedAt ? "#4CAF50" : "#FF9800"}
              />
              <Text style={styles.taskText}>{task.title}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noTask}>Aucune tâche</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Semaine */}
      <View style={styles.weekHeader}>
        <TouchableOpacity onPress={() => changeWeek(-1)}>
          <Text style={styles.arrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.weekTitle}>
          Semaine {week} — {year}
        </Text>
        <TouchableOpacity onPress={() => changeWeek(1)}>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={weekDates}
        renderItem={renderDayCard}
        keyExtractor={(item) => item}
        numColumns={2} // pour plusieurs colonnes
        columnWrapperStyle={{
          justifyContent: "space-between",
          marginBottom: 12,
        }}
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      <TouchableOpacity style={styles.addTaskButton} onPress={handleAddTask}>
        <Text style={styles.addTaskText}>+ Ajouter une tâche</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              onPress={handleCreateTask}
              style={styles.modalButton}
            >
              <Text style={styles.modalText}>Créer une tâche</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleImportTask}
              style={styles.modalButton}
            >
              <Text style={styles.modalText}>Importer une tâche</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.modalCancel}
            >
              <Text style={[styles.modalText, { color: theme.colors.purple }]}>
                Annuler
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ---- Utils ----
function getWeekDatesFromISO(year: number, week: number) {
  const d = new Date(year, 0, 4);
  d.setDate(d.getDate() + (week - 1) * 7 - ((d.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(d);
    date.setDate(d.getDate() + i);
    return date.toISOString().split("T")[0];
  });
}

function getISOWeek(date: Date) {
  const tmp = new Date(date);
  tmp.setHours(0, 0, 0, 0);
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
  const week1 = new Date(tmp.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((tmp.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    )
  );
}

function formatDate(dateString: string) {
  const d = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  };
  return d.toLocaleDateString("fr-FR", options); // ex: "06 janv. 2026"
}

// ---- Styles ----
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: 16 },
  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  arrow: {
    fontSize: 26,
    fontWeight: "bold",
    color: theme.colors.purple,
    paddingHorizontal: 10,
  },
  weekTitle: {
    fontSize: 18,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
  },

  dayCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    ...theme.shadows.soft,
  },
  dayHeader: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
  },
  dateText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  taskItem: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  taskText: { fontSize: 13, color: theme.colors.textPrimary, marginLeft: 6 },
  noTask: {
    fontSize: 12,
    fontStyle: "italic",
    color: theme.colors.textSecondary,
  },

  addTaskButton: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    backgroundColor: theme.colors.purple,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    zIndex: 10,
  },
  addTaskText: {
    color: theme.colors.background,
    fontFamily: theme.typography.fontFamily.semiBold,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    width: 250,
    padding: 16,
    alignItems: "center",
  },
  modalButton: { paddingVertical: 12, width: "100%", alignItems: "center" },
  modalCancel: {
    paddingVertical: 12,
    width: "100%",
    alignItems: "center",
    marginTop: 8,
    borderTopWidth: 1,
    borderColor: theme.colors.textSecondary,
  },
  modalText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.semiBold,
  },
});
