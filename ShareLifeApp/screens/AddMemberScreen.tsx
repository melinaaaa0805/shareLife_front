import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import api from '../api/api';

type RouteProps = RouteProp<{ params: { groupId: string } }, 'params'>;

const AddMemberScreen = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation();
  const { groupId } = route.params;
  const [email, setEmail] = useState('');

  const handleAddMember = async () => {
      if (!groupId || !email.trim()) return;
    try {
    await api.post(`/group-member/${groupId}`, { email: email });
      Alert.alert('Succès', 'Membre ajouté !');
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur', 'Impossible d’ajouter le membre');
    }
  };
  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Email du membre"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <Button title="Ajouter" onPress={handleAddMember} />
    </View>
  );
};

export default AddMemberScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', marginBottom: 20, padding: 10, borderRadius: 5 },
});
