import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import api from "../api/api";
import { theme } from "../assets/style/theme";
import { RootStackParamList } from "../types/types";
import { useGroup } from "../context/GroupContext";
type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ImportTask"
>;
type ImportTaskRouteProp = RouteProp<RootStackParamList, "ImportTask">;

type Task = {
  id: string;
  title: string;
  description?: string | null;
  duration: number | null;
  frequency: "ONCE" | "DAILY" | "WEEKLY";
  dayOfWeek: number;
};

export default function ImportTaskScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ImportTaskRouteProp>();
  const { day } = route.params;

  const group = useGroup();
  const currentGroup = group.currentGroup;
  const groupId = currentGroup?.id;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    if (!groupId) return;
    setLoading(true);
    try {
      const res = await api.get(`/tasks/${groupId}/template`); // récupère toutes les tâches du groupe
      setTasks(res.data);
    } catch (e) {
      console.error("Erreur chargement tâches", e);
      Alert.alert("Erreur", "Impossible de charger les tâches existantes.");
    } finally {
      setLoading(false);
    }
  };

  const handleImportTask = async (task: Task) => {
    if (!groupId) return;
    try {
      // Création d'une nouvelle tâche basée sur celle sélectionnée
      const payload = {
        title: task.title,
        description: task.description,
        weight: 1, // par défaut, ou tu peux demander à l'utilisateur de choisir
        frequency: task.frequency,
        dayOfWeek: new Date(day).getDay(), // jour choisi
        duration: task.duration,
        groupId,
        date: day,
      };

      await api.post(`/tasks/group/${groupId}`, payload);
      Alert.alert("Succès", "Tâche importée avec succès !");
      navigation.goBack();
    } catch (e) {
      console.error(e);
      Alert.alert("Erreur", "Impossible d’importer la tâche.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Importer une tâche</Text>
      <Text style={styles.subtitle}>
        Sélectionne une tâche existante à ajouter pour le {day}.
      </Text>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.taskItem}
            onPress={() => handleImportTask(item)}
          >
            <Text style={styles.taskTitle}>{item.title}</Text>
            {item.description ? (
              <Text style={styles.taskDescription}>{item.description}</Text>
            ) : null}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.noTask}>Aucune tâche disponible à importer.</Text>
        }
      />
    </View>
  );
}

// ---- Styles ----
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.colors.background },
  title: {
    fontSize: 20,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginBottom: 16,
  },
  taskItem: {
    padding: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    marginBottom: 10,
    ...theme.shadows.soft,
  },
  taskTitle: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
  },
  taskDescription: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  noTask: {
    textAlign: "center",
    marginTop: 20,
    color: theme.colors.textSecondary,
    fontStyle: "italic",
  },
});
