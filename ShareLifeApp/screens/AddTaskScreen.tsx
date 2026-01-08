import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import api from '../api/api';
import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { theme } from '../assets/style/theme';
import { useGroup } from '../context/GroupContext';

export default function AddTaskScreen() {
  const navigation = useNavigation();
  const group = useGroup();
  const currentGroup = group.currentGroup;
  const idGroup = currentGroup?.id;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [weight, setWeight] = useState(1);
  const [frequency, setFrequency] = useState<'ONCE' | 'DAILY' | 'WEEKLY'>('ONCE');
  const [duration, setDuration] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<number>(0); // 0 = lundi, 6 = dimanche
  const [loading, setLoading] = useState(false);

  const saveTask = async () => {
    if (!title.trim()) {
      Alert.alert('Erreur', 'Merci de remplir le titre.');
      return;
    }

    const today = new Date();
    const weekNumber = getISOWeek(today);
    const year = today.getFullYear();

    const taskPayload = {
      title: title.trim(),
      description: description.trim() || undefined,
      weight,
      frequency,
      weekNumber,
      year,
      dayOfWeek,
      duration: duration.trim() ? Number(duration) : null,
      groupId: idGroup,
      createdById: null, // backend pourra utiliser req.user.id si auth guard
    };

    setLoading(true);
    try {
      await api.post(`/tasks/group/${idGroup}`, taskPayload);
      Alert.alert('Succès', 'Tâche créée avec succès !');
      navigation.goBack();
    } catch (e: any) {
      console.error(e);
      Alert.alert('Erreur', e.response?.data?.message || 'Impossible de créer la tâche.');
    } finally {
      setLoading(false);
    }
  };

  function getISOWeek(date: Date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  }

  const days = [
    { label: 'Lundi', value: 0 },
    { label: 'Mardi', value: 1 },
    { label: 'Mercredi', value: 2 },
    { label: 'Jeudi', value: 3 },
    { label: 'Vendredi', value: 4 },
    { label: 'Samedi', value: 5 },
    { label: 'Dimanche', value: 6 },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between' }}>
        <View>
          <View style={styles.header}>
            <Text style={styles.title}>Nouvelle tâche</Text>
            <Text style={styles.subtitle}>
              Planifie tes tâches et partage la charge mentale avec les membres du groupe.
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              placeholder="Titre"
              placeholderTextColor={theme.colors.textSecondary}
              value={title}
              onChangeText={setTitle}
              style={styles.input}
            />

            <TextInput
              placeholder="Description"
              placeholderTextColor={theme.colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              style={[styles.input, { height: 80 }]}
              multiline
            />

            <TextInput
              placeholder="Durée (minutes)"
              keyboardType="numeric"
              placeholderTextColor={theme.colors.textSecondary}
              value={duration}
              onChangeText={setDuration}
              style={styles.input}
            />

            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Jour de la semaine</Text>
              <Picker
                selectedValue={dayOfWeek}
                onValueChange={(val) => setDayOfWeek(Number(val))}
                style={styles.picker}
                dropdownIconColor={theme.colors.textPrimary}
              >
                {days.map((d) => (
                  <Picker.Item key={d.value} label={d.label} value={d.value} />
                ))}
              </Picker>
            </View>

            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Fréquence</Text>
              <Picker
                selectedValue={frequency}
                onValueChange={(val) => setFrequency(val)}
                style={styles.picker}
                dropdownIconColor={theme.colors.textPrimary}
              >
                <Picker.Item label="Une fois" value="ONCE" />
                <Picker.Item label="Tous les jours" value="DAILY" />
                <Picker.Item label="Chaque semaine" value="WEEKLY" />
              </Picker>
            </View>

            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Importance</Text>
              <Picker
                selectedValue={weight}
                onValueChange={(val) => setWeight(Number(val))}
                style={styles.picker}
                dropdownIconColor={theme.colors.textPrimary}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <Picker.Item key={n} label={`${n}`} value={n} />
                ))}
              </Picker>
            </View>

            <TouchableOpacity style={styles.button} onPress={saveTask} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? 'En cours...' : 'Ajouter'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.lottieContainer}>
          <LottieView
            source={require('../assets/lottie/add-task.json')}
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
  header: {
    marginBottom: theme.spacing.lg,
  },
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
  input: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.textPrimary,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    fontSize: theme.typography.size.md,
    marginBottom: theme.spacing.md,
  },
  pickerContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  label: {
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  picker: {
    color: theme.colors.textPrimary,
  },
  button: {
    backgroundColor: theme.colors.purple,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  buttonText: {
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.size.md,
  },
  lottieContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  lottie: {
    width: 180,
    height: 180,
  },
});
