import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Pressable,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/types';
import { theme } from '../assets/style/theme';
import LottieView from 'lottie-react-native';
import { useAuth } from '../context/AuthContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Register'>;

// ─── Force du mot de passe ────────────────────────────────────────────────────
type PasswordStrength = { score: number; label: string; color: string };

function getPasswordStrength(password: string): PasswordStrength {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: 'Faible', color: theme.colors.danger };
  if (score <= 4) return { score, label: 'Moyen', color: theme.colors.warning };
  return { score, label: 'Fort', color: theme.colors.success };
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// ─── Politique de confidentialité (modal) ─────────────────────────────────────
function PrivacyModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={privacyStyles.overlay}>
        <View style={privacyStyles.container}>
          <Text style={privacyStyles.title}>Politique de confidentialité</Text>
          <ScrollView style={privacyStyles.scroll} showsVerticalScrollIndicator={false}>
            <Text style={privacyStyles.section}>Responsable du traitement</Text>
            <Text style={privacyStyles.text}>
              ShareLife collecte et traite tes données personnelles (prénom, adresse email) dans le but de te fournir le service de gestion des tâches partagées.
            </Text>
            <Text style={privacyStyles.section}>Données collectées</Text>
            <Text style={privacyStyles.text}>
              • Prénom{'\n'}• Adresse email{'\n'}• Mot de passe (chiffré){'\n'}• Données d'utilisation (groupes, tâches)
            </Text>
            <Text style={privacyStyles.section}>Base légale (RGPD art. 6)</Text>
            <Text style={privacyStyles.text}>
              Le traitement est fondé sur ton consentement explicite recueilli lors de l'inscription.
            </Text>
            <Text style={privacyStyles.section}>Durée de conservation</Text>
            <Text style={privacyStyles.text}>
              Tes données sont conservées jusqu'à la suppression de ton compte, ou 3 ans après ta dernière activité.
            </Text>
            <Text style={privacyStyles.section}>Tes droits (RGPD)</Text>
            <Text style={privacyStyles.text}>
              Tu disposes d'un droit d'accès, de rectification, d'effacement, de portabilité et d'opposition. Pour l'exercer : contact@sharelife.app
            </Text>
            <Text style={privacyStyles.section}>Sécurité</Text>
            <Text style={privacyStyles.text}>
              Tes mots de passe sont stockés sous forme hachée (bcrypt). Les communications sont chiffrées (HTTPS).
            </Text>
          </ScrollView>
          <TouchableOpacity style={privacyStyles.closeBtn} onPress={onClose}>
            <Text style={privacyStyles.closeBtnText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Écran d'inscription ──────────────────────────────────────────────────────
export default function RegisterScreen() {
  const navigation = useNavigation<Nav>();
  const { register } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [consentRgpd, setConsentRgpd] = useState(false);
  const [consentAge, setConsentAge] = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const btnScale = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -5, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const strength = password ? getPasswordStrength(password) : null;

  const validate = () => {
    if (!firstName.trim() || firstName.trim().length < 2) return 'Le prénom doit contenir au moins 2 caractères.';
    if (!isValidEmail(email)) return 'Adresse email invalide.';
    if (password.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.';
    if (!/[A-Z]/.test(password)) return 'Le mot de passe doit contenir au moins une majuscule.';
    if (!/[a-z]/.test(password)) return 'Le mot de passe doit contenir au moins une minuscule.';
    if (!/\d/.test(password)) return 'Le mot de passe doit contenir au moins un chiffre.';
    if (password !== confirmPassword) return 'Les mots de passe ne correspondent pas.';
    if (!consentAge) return 'Tu dois confirmer avoir au moins 16 ans.';
    if (!consentRgpd) return 'Tu dois accepter la politique de confidentialité.';
    return null;
  };

  const handleRegister = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      shake();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await register(email.trim().toLowerCase(), password, firstName.trim());
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : (msg ?? 'Erreur lors de la création du compte.'));
      shake();
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = firstName && email && password && confirmPassword && consentRgpd && consentAge && !loading;

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
        <View style={styles.lottieWrapper}>
          <LottieView
            source={require('../assets/lottie/register.json')}
            autoPlay loop
            style={styles.lottie}
          />
        </View>

        <Text style={styles.title}>Créer un compte</Text>
        <Text style={styles.subtitle}>Rejoins ShareLife en quelques secondes</Text>

        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
          {/* Prénom */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Prénom</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={t => { setFirstName(t); setError(null); }}
              placeholder="Alice"
              placeholderTextColor={theme.colors.textSecondary}
              autoCapitalize="words"
              textContentType="givenName"
              autoComplete="given-name"
            />
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={t => { setEmail(t); setError(null); }}
              placeholder="alice@email.com"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              autoComplete="email"
            />
          </View>

          {/* Mot de passe */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Mot de passe</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={t => { setPassword(t); setError(null); }}
                placeholder="••••••••"
                placeholderTextColor={theme.colors.textSecondary}
                secureTextEntry={!showPassword}
                textContentType="newPassword"
                autoComplete="new-password"
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            {/* Indicateur de force */}
            {password.length > 0 && strength && (
              <View style={styles.strengthRow}>
                <View style={styles.strengthBars}>
                  {[1, 2, 3].map(i => (
                    <View
                      key={i}
                      style={[
                        styles.strengthBar,
                        { backgroundColor: strength.score >= i * 2 ? strength.color : theme.colors.border },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthLabel, { color: strength.color }]}>
                  {strength.label}
                </Text>
              </View>
            )}
            <Text style={styles.hint}>
              8 caractères min. · 1 majuscule · 1 minuscule · 1 chiffre
            </Text>
          </View>

          {/* Confirmation */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Confirmer le mot de passe</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={styles.passwordInput}
                value={confirmPassword}
                onChangeText={t => { setConfirmPassword(t); setError(null); }}
                placeholder="••••••••"
                placeholderTextColor={theme.colors.textSecondary}
                secureTextEntry={!showConfirm}
                textContentType="newPassword"
                autoComplete="new-password"
              />
              <TouchableOpacity onPress={() => setShowConfirm(v => !v)} style={styles.eyeBtn}>
                <Text style={styles.eyeIcon}>{showConfirm ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* Consentements RGPD */}
          <View style={styles.consentsSection}>
            <TouchableOpacity
              style={styles.checkRow}
              onPress={() => setConsentAge(v => !v)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, consentAge && styles.checkboxChecked]}>
                {consentAge && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkLabel}>
                Je confirme avoir au moins <Text style={styles.bold}>16 ans</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkRow}
              onPress={() => setConsentRgpd(v => !v)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, consentRgpd && styles.checkboxChecked]}>
                {consentRgpd && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkLabel}>
                J'accepte la{' '}
                <Text
                  style={styles.link}
                  onPress={() => setPrivacyVisible(true)}
                >
                  politique de confidentialité
                </Text>
                {' '}et le traitement de mes données (RGPD)
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* CTA */}
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <Pressable
            style={[styles.registerButton, !canSubmit && styles.buttonDisabled]}
            onPress={handleRegister}
            onPressIn={() =>
              Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start()
            }
            onPressOut={() =>
              Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 30 }).start()
            }
            disabled={!canSubmit}
          >
            <Text style={styles.registerButtonText}>
              {loading ? 'Création…' : 'Créer mon compte'}
            </Text>
          </Pressable>
        </Animated.View>

        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.navigate('Login' as never)}
        >
          <Text style={styles.loginLinkText}>Déjà un compte ? Se connecter</Text>
        </TouchableOpacity>
      </ScrollView>

      <PrivacyModal visible={privacyVisible} onClose={() => setPrivacyVisible(false)} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.xl },
  lottieWrapper: { alignItems: 'center', marginBottom: theme.spacing.md },
  lottie: { width: 130, height: 130 },
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
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  strengthBars: { flexDirection: 'row', gap: 4, flex: 1 },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.semiBold,
  },
  hint: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.regular,
    marginTop: 6,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.medium,
    marginBottom: theme.spacing.sm,
  },
  // Consentements
  consentsSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    gap: 14,
  },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.purple,
    borderColor: theme.colors.purple,
  },
  checkmark: { color: '#FFF', fontSize: 13, fontFamily: theme.typography.fontFamily.bold },
  checkLabel: {
    flex: 1,
    fontSize: theme.typography.size.sm,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.regular,
    lineHeight: 20,
  },
  bold: { fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.textPrimary },
  link: { color: theme.colors.purple, fontFamily: theme.typography.fontFamily.medium },
  // Boutons
  registerButton: {
    backgroundColor: theme.colors.purple,
    paddingVertical: 16,
    borderRadius: theme.radius.round,
    alignItems: 'center',
    shadowColor: theme.colors.purple,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: theme.spacing.md,
  },
  buttonDisabled: { backgroundColor: theme.colors.disabled, shadowOpacity: 0, elevation: 0 },
  registerButtonText: {
    color: '#FFF',
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.bold,
  },
  loginLink: { alignItems: 'center', paddingVertical: theme.spacing.sm },
  loginLinkText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.medium,
  },
});

const privacyStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    maxHeight: '85%',
  },
  title: {
    fontSize: theme.typography.size.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  scroll: { marginBottom: theme.spacing.md },
  section: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.purple,
    marginTop: theme.spacing.md,
    marginBottom: 4,
  },
  text: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  closeBtn: {
    backgroundColor: theme.colors.purple,
    paddingVertical: 14,
    borderRadius: theme.radius.round,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#FFF',
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.size.md,
  },
});
