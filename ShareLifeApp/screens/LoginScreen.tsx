import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { theme } from '../assets/style/theme';
import LottieView from 'lottie-react-native';

export default function LoginScreen() {
  const navigation = useNavigation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.animationWrapper}>
        <LottieView
          source={require('../assets/lottie/login.json')} 
          autoPlay
          loop
          style={styles.lottie}
        />
      </View>

      <Text style={styles.title}>Bienvenue</Text>
      <Text style={styles.subtitle}>Connectez-vous pour continuer</Text>

      {/* Inputs */}
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={theme.colors.textSecondary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor={theme.colors.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      {/* Boutons */}
      <TouchableOpacity
        style={styles.loginButton}
        activeOpacity={0.8}
        onPress={() => login(email, password)}
      >
        <Text style={styles.loginButtonText}>Se connecter</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.registerButton}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('Register' as never)}
      >
        <Text style={styles.registerButtonText}>Créer un compte</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  animationWrapper: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  lottie: {
    width: 200,
    height: 200,
  },
  title: {
    fontSize: theme.typography.size.xxl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.purple,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  inputWrapper: {
    marginBottom: theme.spacing.lg,
  },
  input: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.soft,
  },
  loginButton: {
    backgroundColor: theme.colors.purple,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    ...theme.shadows.soft,
  },
  loginButtonText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.size.lg,
    fontFamily: theme.typography.fontFamily.semiBold,
  },
  registerButton: {
    borderWidth: 1,
    borderColor: theme.colors.purple,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
  },
  registerButtonText: {
    color: theme.colors.purple,
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.medium,
  },
});
