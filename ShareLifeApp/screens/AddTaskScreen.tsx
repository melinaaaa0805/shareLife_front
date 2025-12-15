import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { CalendarScreen } from './CalendarScreen';

type AddTaskRouteProp = RouteProp<{ params: { day: string } }, 'params'>;

export default function AddTaskScreen() {
  const route = useRoute<AddTaskRouteProp>();
  const navigation = useNavigation();
  const { day } = route.params;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [recurrence, setRecurrence] = useState<'none' | 'daily'>('none');

  const saveTask = () => {
    const task = {
      title,
      description,
      duration: Number(duration),
      recurrence,
      date: day,
    };
    // Ici tu peux envoyer task au backend et/ou stocker localement
    console.log('Nouvelle tâche', task);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <TextInput placeholder="Titre" value={title} onChangeText={setTitle} style={styles.input} />
      <TextInput placeholder="Description" value={description} onChangeText={setDescription} style={styles.input} />
      <TextInput placeholder="Durée (minutes)" value={duration} onChangeText={setDuration} style={styles.input} keyboardType="numeric" />
      <Picker selectedValue={recurrence} onValueChange={(value:any) => setRecurrence(value as 'none' | 'daily')} style={styles.input}>
        <Picker.Item label="Aucun" value="none" />
        <Picker.Item label="Tous les jours" value="daily" />
      </Picker>
      <Button title="Ajouter" onPress={saveTask} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginBottom: 12 },
});
