import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Pressable,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../assets/style/theme';
import { RootStackParamList } from '../types/types';
import api from '../api/api';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isStrongPassword(pwd: string) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(pwd);
}

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<Nav>();

  // Step 1: email entry
  const [email, setEmail] = useState('');
  // Step 2: code + new password
  const [step, setStep] = useState<1 | 2>(1);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const btnScale = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const stepAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const transitionToStep2 = () => {
    Animated.timing(stepAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setStep(2);
  };

  // Step 1: send reset code
  const handleSendCode = async () => {
    if (!email.trim()) {
      setError('Veuillez saisir votre adresse email.');
      shake();
      return;
    }
    if (!isValidEmail(email)) {
      setError('Adresse email invalide.');
      shake();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setSuccessMsg('Un code à 6 chiffres a été envoyé à votre adresse email.');
      transitionToStep2();
    } catch {
      // Anti-enumeration: show same message even on error
      setSuccessMsg('Un code à 6 chiffres a été envoyé à votre adresse email.');
      transitionToStep2();
    } finally {
      setLoading(false);
    }
  };

  // Step 2: verify code + set new password
  const handleResetPassword = async () => {
    if (code.trim().length !== 6) {
      setError('Le code doit contenir 6 chiffres.');
      shake();
      return;
    }
    if (!newPassword) {
      setError('Veuillez saisir un nouveau mot de passe.');
      shake();
      return;
    }
    if (!isStrongPassword(newPassword)) {
      setError('Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.');
      shake();
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      shake();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/reset-password', {
        email: email.trim().toLowerCase(),
        code: code.trim(),
        newPassword,
      });
      navigation.navigate('Login');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Code invalide ou expiré.';
      setError(typeof msg === 'string' ? msg : 'Code invalide ou expiré.');
      shake();
    } finally {
      setLoading(false);
    }
  };

  const canSubmitStep1 = email.trim().length > 0 && !loading;
  const canSubmitStep2 =
    code.trim().length === 6 && newPassword.length > 0 && confirmPassword.length > 0 && !loading;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Progress indicator */}
        <View style={styles.progressRow}>
          <View style={[styles.progressDot, styles.progressDotActive]} />
          <View style={[styles.progressLine, step === 2 && styles.progressLineActive]} />
          <View style={[styles.progressDot, step === 2 && styles.progressDotActive]} />
        </View>

        <Text style={styles.title}>
          {step === 1 ? 'Mot de passe oublié' : 'Nouveau mot de passe'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 1
            ? 'Saisis ton email pour recevoir un code de réinitialisation.'
            : `Code envoyé à ${email}. Saisis-le ci-dessous.`}
        </Text>

        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
          {step === 1 ? (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={t => { setEmail(t); setError(null); }}
                placeholder="ton@email.com"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                autoComplete="email"
              />
            </View>
          ) : (
            <>
              {successMsg && (
                <View style={styles.successBanner}>
                  <Text style={styles.successText}>{successMsg}</Text>
                </View>
              )}

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Code à 6 chiffres</Text>
                <TextInput
                  style={[styles.input, styles.codeInput]}
                  value={code}
                  onChangeText={t => { setCode(t.replace(/\D/g, '').slice(0, 6)); setError(null); }}
                  placeholder="123456"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="number-pad"
                  maxLength={6}
                  textContentType="oneTimeCode"
                  autoComplete="one-time-code"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Nouveau mot de passe</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={styles.passwordInput}
                    value={newPassword}
                    onChangeText={t => { setNewPassword(t); setError(null); }}
                    placeholder="••••••••"
                    placeholderTextColor={theme.colors.textSecondary}
                    secureTextEntry={!showNewPwd}
                    textContentType="newPassword"
                    autoComplete="new-password"
                  />
                  <TouchableOpacity onPress={() => setShowNewPwd(v => !v)} style={styles.eyeBtn}>
                    <Text style={styles.eyeIcon}>{showNewPwd ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Confirmer le mot de passe</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={styles.passwordInput}
                    value={confirmPassword}
                    onChangeText={t => { setConfirmPassword(t); setError(null); }}
                    placeholder="••••••••"
                    placeholderTextColor={theme.colors.textSecondary}
                    secureTextEntry={!showConfirmPwd}
                    textContentType="newPassword"
                    autoComplete="new-password"
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPwd(v => !v)} style={styles.eyeBtn}>
                    <Text style={styles.eyeIcon}>{showConfirmPwd ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => { setStep(1); setError(null); setSuccessMsg(null); setCode(''); setNewPassword(''); setConfirmPassword(''); }}
                style={styles.backBtn}
              >
                <Text style={styles.backText}>← Changer d'adresse email</Text>
              </TouchableOpacity>
            </>
          )}

          {error && <Text style={styles.errorText}>{error}</Text>}
        </Animated.View>

        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <Pressable
            style={[
              styles.submitButton,
              !(step === 1 ? canSubmitStep1 : canSubmitStep2) && styles.submitButtonDisabled,
            ]}
            onPress={step === 1 ? handleSendCode : handleResetPassword}
            onPressIn={() =>
              Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start()
            }
            onPressOut={() =>
              Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 30 }).start()
            }
            disabled={!(step === 1 ? canSubmitStep1 : canSubmitStep2)}
          >
            <Text style={styles.submitButtonText}>
              {loading
                ? step === 1 ? 'Envoi…' : 'Réinitialisation…'
                : step === 1 ? 'Envoyer le code' : 'Réinitialiser le mot de passe'}
            </Text>
          </Pressable>
        </Animated.View>

        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginText}>Retour à la connexion</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.border,
  },
  progressDotActive: { backgroundColor: theme.colors.purple },
  progressLine: {
    flex: 1,
    maxWidth: 60,
    height: 2,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.sm,
  },
  progressLineActive: { backgroundColor: theme.colors.purple },
  title: {
    fontSize: theme.typography.size.xxl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.purple,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 20,
  },
  successBanner: {
    backgroundColor: theme.colors.mint + '22',
    borderWidth: 1,
    borderColor: theme.colors.mint,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  successText: {
    color: theme.colors.mint,
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.medium,
    textAlign: 'center',
  },
  fieldGroup: { marginBottom: theme.spacing.md },
  label: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.md,
    paddingVertical: 13,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  codeInput: {
    textAlign: 'center',
    fontSize: theme.typography.size.xl,
    fontFamily: theme.typography.fontFamily.bold,
    letterSpacing: 8,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  passwordInput: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.md,
    paddingVertical: 13,
    paddingHorizontal: theme.spacing.md,
  },
  eyeBtn: { paddingHorizontal: theme.spacing.md },
  eyeIcon: { fontSize: 16 },
  errorText: {
    color: theme.colors.danger,
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.medium,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  backBtn: { marginBottom: theme.spacing.md },
  backText: {
    color: theme.colors.purple,
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.medium,
  },
  submitButton: {
    backgroundColor: theme.colors.purple,
    paddingVertical: 16,
    borderRadius: theme.radius.round,
    alignItems: 'center',
    shadowColor: theme.colors.purple,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  submitButtonDisabled: { backgroundColor: theme.colors.disabled, shadowOpacity: 0, elevation: 0 },
  submitButtonText: {
    color: '#FFF',
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.bold,
  },
  loginBtn: { alignItems: 'center', paddingVertical: theme.spacing.sm },
  loginText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.medium,
  },
});
