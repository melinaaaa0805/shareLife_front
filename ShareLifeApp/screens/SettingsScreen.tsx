import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function SettingsScreen() {
  const { user, logout, updateUser } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [email, setEmail] = useState(user?.email || '');

  const handleSave = async () => {
    try {
      if (!firstName.trim() || !email.trim()) {
        Alert.alert('Erreur', 'Tous les champs doivent être remplis.');
        return;
      }
//      Alert.alert('Succès', 'Profil mis à jour !');
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Prénom</Text>
      <TextInput
        style={styles.input}
        value={firstName}
        onChangeText={setFirstName}
      />
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Button title="Enregistrer" onPress={handleSave} />
      <View style={{ height: 16 }} />
      <Button title="Se déconnecter" color="#f44336" onPress={logout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  label: { fontSize: 16, fontWeight: 'bold', marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
  },
});
