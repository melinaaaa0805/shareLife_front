// src/screens/CreateGroupScreen.tsx
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import api from '../api/api';
import LottieView from 'lottie-react-native';
import { theme } from '../assets/style/theme';

type CreateGroupScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateGroup'>;

export default function CreateGroupScreen() {
  const navigation = useNavigation<CreateGroupScreenNavigationProp>();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateGroup = async () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom du groupe est requis.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/groups', { name: name.trim() });
      Alert.alert('Succès', 'Groupe créé avec succès !');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Impossible de créer le groupe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Créer un groupe</Text>
        <Text style={styles.subtitle}>
          Partagez la charge mentale avec votre famille ou vos colocataires !
        </Text>
      </View>

      <View style={styles.form}>
        <TextInput
          placeholder="Nom du groupe"
          placeholderTextColor={theme.colors.textSecondary}
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

        <TouchableOpacity style={styles.button} onPress={handleCreateGroup} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Création...' : 'Créer'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.lottieContainer}>
        <LottieView
          source={require('../assets/lottie/create-group.json')} // animation sympa pour création
          autoPlay
          loop
          style={styles.lottie}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: theme.spacing.xl,
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
  form: {
    marginTop: theme.spacing.lg,
  },
  input: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.textPrimary,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    fontSize: theme.typography.size.md,
    marginBottom: theme.spacing.md,
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
    marginBottom: theme.spacing.xl,
  },
  lottie: {
    width: 180,
    height: 180,
  },
});
