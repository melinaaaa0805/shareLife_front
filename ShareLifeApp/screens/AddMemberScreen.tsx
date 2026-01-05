// src/screens/AddMemberScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import api from '../api/api';
import { theme } from '../assets/style/theme';

type RouteProps = RouteProp<{ params: { groupId: string } }, 'params'>;

const AddMemberScreen = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation();
  const { groupId } = route.params;
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddMember = async () => {
    if (!groupId || !email.trim()) return;

    setLoading(true);
    try {
      await api.post(`/group-member/${groupId}`, { email: email.trim() });
      Alert.alert('Succès', 'Membre ajouté !');
      navigation.goBack();
    } catch (err: any) {
      console.error(err);
      if (err.response) {
        if (err.response.status === 404) {
          Alert.alert('Erreur', "L’utilisateur que vous voulez ajouter n’existe pas.");
        } else {
          Alert.alert('Erreur', err.response.data?.message || 'Impossible d’ajouter le membre.');
        }
      } else {
        Alert.alert('Erreur', 'Impossible de contacter le serveur.');
      }
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
        <Text style={styles.title}>Ajouter un membre</Text>
        <Text style={styles.subtitle}>
          Partagez la charge mentale, invitez vos proches à rejoindre le groupe !
        </Text>
      </View>

      <View style={styles.form}>
        <TextInput
          placeholder="Email du membre"
          placeholderTextColor={theme.colors.textSecondary}
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TouchableOpacity style={styles.button} onPress={handleAddMember} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Ajout en cours...' : 'Ajouter'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.lottieContainer}>
        <LottieView
          source={require('../assets/lottie/add-member.json')} // prends une animation sympa
          autoPlay
          loop
          style={styles.lottie}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

export default AddMemberScreen;

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
    width: 200,
    height: 200,
  },
});
