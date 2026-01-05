// src/screens/AddTaskScreen.tsx
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
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { theme } from '../assets/style/theme';

type AddTaskRouteProp = RouteProp<{ params: { day: string } }, 'params'>;

export default function AddTaskScreen() {
  const route = useRoute<AddTaskRouteProp>();
  const navigation = useNavigation();
  const { day } = route.params;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [recurrence, setRecurrence] = useState<'none' | 'daily'>('none');
  const [loading, setLoading] = useState(false);

  const saveTask = async () => {
    if (!title.trim() || !duration.trim()) {
      Alert.alert('Erreur', 'Merci de remplir le titre et la durée.');
      return;
    }

    const task = {
      title: title.trim(),
      description: description.trim(),
      duration: Number(duration),
      recurrence,
      date: day,
    };

    setLoading(true);
    try {
      const res = await api.post('/tasks', task);
      console.log(res.data);
      Alert.alert('Succès', 'Tâche créée avec succès !');
      navigation.goBack();
    } catch (e: any) {
      console.error(e);
      Alert.alert('Erreur', 'Impossible de créer la tâche.');
    } finally {
      setLoading(false);
    }
  };

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
              placeholderTextColor={theme.colors.textSecondary}
              value={duration}
              onChangeText={setDuration}
              style={styles.input}
              keyboardType="numeric"
            />

            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={recurrence}
                onValueChange={(value: any) => setRecurrence(value as 'none' | 'daily')}
                style={styles.picker}
                dropdownIconColor={theme.colors.textPrimary}
              >
                <Picker.Item label="Aucun" value="none" />
                <Picker.Item label="Tous les jours" value="daily" />
              </Picker>
            </View>

            <TouchableOpacity style={styles.button} onPress={saveTask} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? 'En cours...' : 'Ajouter'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.lottieContainer}>
          <LottieView
            source={require('../assets/lottie/add-task.json')} // animation sympa pour tâches
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
  },
  picker: {
    color: theme.colors.textPrimary,
  },
  button: {
    backgroundColor: theme.colors.purple,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    shadowColor: theme.shadows.soft.shadowColor,
    shadowOffset: theme.shadows.soft.shadowOffset,
    shadowOpacity: theme.shadows.soft.shadowOpacity,
    shadowRadius: theme.shadows.soft.shadowRadius,
    elevation: theme.shadows.soft.elevation,
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
