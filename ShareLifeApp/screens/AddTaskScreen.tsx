import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import LottieView from "lottie-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { theme } from "../assets/style/theme";
import api from "../api/api";
import { useGroup } from "../context/GroupContext";
import { StyleSheet } from "react-native";

import TextInputField from "../components/TextInputField";
import SelectField from "../components/SelectField";
import WeightSelector from "../components/WeightSelector";

export default function AddTaskScreen() {
  const route = useRoute<any>();
  const taskToEdit = route.params?.task;
  const navigation = useNavigation();
  const { currentGroup } = useGroup();
  const idGroup = currentGroup?.id;

  const [title, setTitle] = useState(taskToEdit?.title || "");
  const [description, setDescription] = useState(taskToEdit?.description || "");
  const [weight, setWeight] = useState(taskToEdit?.weight || 1);
  const [frequency, setFrequency] = useState(taskToEdit?.frequency || "ONCE");
  const [duration, setDuration] = useState(
    taskToEdit?.duration?.toString() || ""
  );
  const [dayOfWeek, setDayOfWeek] = useState(taskToEdit?.dayOfWeek || 0);
  const [loading, setLoading] = useState(false);

  const days = [
    { label: "Lundi", value: 0 },
    { label: "Mardi", value: 1 },
    { label: "Mercredi", value: 2 },
    { label: "Jeudi", value: 3 },
    { label: "Vendredi", value: 4 },
    { label: "Samedi", value: 5 },
    { label: "Dimanche", value: 6 },
  ];

  const frequencies = [
    { label: "Une fois", value: "ONCE" },
    { label: "Tous les jours", value: "DAILY" },
    { label: "Quotidien sauf le week-end", value: "WEEKLY" },
  ];

  const saveTask = async () => {
    if (!title.trim())
      return Alert.alert("Erreur", "Merci de remplir le titre.");
    const today = new Date();
    const weekNumber = getISOWeek(today);
    const year = today.getFullYear();
    const taskDate = computeTaskDate(year, weekNumber, dayOfWeek);

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      weight,
      frequency,
      weekNumber,
      year,
      day: taskDate,
      dayOfWeek,
      duration: duration.trim() ? Number(duration) : null,
      groupId: idGroup,
      createdById: null,
    };

    setLoading(true);
    try {
      await api.post(`/tasks/group/${idGroup}`, payload);
      Alert.alert("Succès", "Tâche créée avec succès !");
      navigation.goBack();
    } catch (e: any) {
      console.error(e);
      Alert.alert(
        "Erreur",
        e.response?.data?.message || "Impossible de créer la tâche."
      );
    } finally {
      setLoading(false);
    }
  };

  function getISOWeek(date: Date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const week1 = new Date(d.getFullYear(), 0, 4);
    return (
      1 +
      Math.round(
        ((d.getTime() - week1.getTime()) / 86400000 -
          3 +
          ((week1.getDay() + 6) % 7)) /
          7
      )
    );
  }

  function computeTaskDate(
    year: number,
    weekNumber: number,
    dayOfWeek: number
  ): string {
    const jan4 = new Date(year, 0, 4);
    const dayDiff = (jan4.getDay() + 6) % 7;
    const week1Monday = new Date(jan4);
    week1Monday.setDate(jan4.getDate() - dayDiff);
    const taskDate = new Date(week1Monday);
    taskDate.setDate(week1Monday.getDate() + (weekNumber - 1) * 7 + dayOfWeek);
    return taskDate.toISOString().split("T")[0];
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "space-between" }}
      >
        <View>
          <View style={styles.header}>
            <Text style={styles.title}>Nouvelle tâche</Text>
            <Text style={styles.subtitle}>
              Planifie tes tâches et partage la charge mentale avec les membres
              du groupe.
            </Text>
          </View>

          <View style={styles.form}>
            <TextInputField
              label="Titre"
              value={title}
              onChangeText={setTitle}
              placeholder="Titre de la tâche"
            />
            <TextInputField
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Description"
              multiline
            />
            <TextInputField
              label="Durée (minutes)"
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
              placeholder="Durée en minutes"
            />

            <SelectField
              label="Jour de la semaine"
              value={dayOfWeek}
              onValueChange={(v) => setDayOfWeek(Number(v))}
              items={days}
            />
            <SelectField
              label="Fréquence"
              value={frequency}
              onValueChange={setFrequency}
              items={frequencies}
            />

            <WeightSelector weight={weight} setWeight={setWeight} />

            <TouchableOpacity
              style={styles.button}
              onPress={saveTask}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading
                  ? "En cours..."
                  : taskToEdit
                    ? "Modifier la tâche"
                    : "Ajouter"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.lottieContainer}>
          <LottieView
            source={require("../assets/lottie/add-task.json")}
            autoPlay
            loop
            style={styles.lottie}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  header: { marginBottom: theme.spacing.lg },
  title: {
    fontSize: theme.typography.size.xl,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.bold,
  },
  subtitle: {
    marginTop: theme.spacing.sm,
    fontSize: theme.typography.size.md,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.regular,
  },
  form: {},
  button: {
    backgroundColor: theme.colors.purple,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: "center",
    marginTop: theme.spacing.md,
  },
  buttonText: {
    color: theme.colors.background,
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.size.md,
  },
  lottieContainer: { alignItems: "center", marginTop: theme.spacing.xl },
  lottie: { width: 180, height: 180 },
});
