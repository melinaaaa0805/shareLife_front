import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Pressable,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/types';
import api from '../api/api';
import { theme } from '../assets/style/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'CreateGroup'>;

const MAX_NAME = 40;

const TIPS = [
  'Exemple : "Appart 4B", "Famille Martin", "Coloc rue de la Paix"',
  'Donne un nom reconnaissable par tous les membres.',
  'Tu pourras modifier le nom plus tard dans les paramètres.',
];

export default function CreateGroupScreen() {
  const navigation = useNavigation<Nav>();

  const [name, setName] = useState('');
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Animations
  const cardAnim = useRef(new Animated.Value(40)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const iconAnim = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(iconAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 7, delay: 100 }),
      Animated.timing(cardOpacity, { toValue: 1, duration: 350, useNativeDriver: true, delay: 200 }),
      Animated.spring(cardAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 8, delay: 200 }),
    ]).start();
  }, []);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -5, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const showSuccess = () => {
    setSuccess(true);
    Animated.spring(successScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 6 }).start();
    setTimeout(() => navigation.goBack(), 1200);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Donne un nom à ton groupe.');
      shake();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.post('/groups', { name: name.trim() });
      showSuccess();
    } catch {
      setError('Impossible de créer le groupe. Réessaie.');
      shake();
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = name.trim().length > 0 && !loading;
  const charCount = name.length;
  const nearLimit = charCount >= MAX_NAME - 5;

  // Success overlay
  if (success) {
    return (
      <View style={styles.successContainer}>
        <Animated.View style={{ transform: [{ scale: successScale }], alignItems: 'center' }}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={48} color="#FFF" />
          </View>
          <Text style={styles.successTitle}>Groupe créé !</Text>
          <Text style={styles.successSub}>{name.trim()}</Text>
        </Animated.View>
      </View>
    );
  }

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
        {/* Hero icon */}
        <Animated.View
          style={[
            styles.heroWrapper,
            { transform: [{ scale: iconAnim }], opacity: iconAnim },
          ]}
        >
          <View style={styles.heroCircle}>
            <Ionicons name="people" size={44} color={theme.colors.purple} />
          </View>
          <View style={styles.heroBadge}>
            <Ionicons name="add" size={14} color="#FFF" />
          </View>
        </Animated.View>

        <Text style={styles.title}>Nouveau groupe</Text>
        <Text style={styles.subtitle}>
          Rassemblez vos proches et partagez la charge du quotidien.
        </Text>

        {/* Card */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardOpacity,
              transform: [{ translateY: cardAnim }, { translateX: shakeAnim }],
            },
          ]}
        >
          {/* Accent top bar */}
          <View style={styles.cardAccent} />

          <Text style={styles.fieldLabel}>Nom du groupe</Text>

          <View style={[styles.inputWrapper, focused && styles.inputWrapperFocused]}>
            <Ionicons
              name="people-outline"
              size={18}
              color={focused ? theme.colors.purple : theme.colors.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={t => {
                if (t.length <= MAX_NAME) { setName(t); setError(null); }
              }}
              placeholder="Ex : Appart 4B"
              placeholderTextColor={theme.colors.textSecondary}
              autoCapitalize="words"
              autoCorrect={false}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              returnKeyType="done"
              onSubmitEditing={handleCreate}
            />
            <Text style={[styles.charCount, nearLimit && styles.charCountWarn]}>
              {charCount}/{MAX_NAME}
            </Text>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* Tip */}
          <View style={styles.tipRow}>
            <Ionicons name="information-circle-outline" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.tipText}>{TIPS[0]}</Text>
          </View>
        </Animated.View>

        {/* Features list */}
        <Animated.View style={{ opacity: cardOpacity }}>
          {[
            { icon: 'person-add-outline', label: 'Invitez vos colocataires par email' },
            { icon: 'checkbox-outline', label: 'Gérez les tâches en commun' },
            { icon: 'trophy-outline', label: 'Suivez les contributions de chacun' },
          ].map(({ icon, label }) => (
            <View key={icon} style={styles.featureRow}>
              <View style={styles.featureIconBox}>
                <Ionicons name={icon as any} size={16} color={theme.colors.purple} />
              </View>
              <Text style={styles.featureLabel}>{label}</Text>
            </View>
          ))}
        </Animated.View>
      </ScrollView>

      {/* Fixed pill button */}
      <Animated.View style={[styles.footer, { transform: [{ scale: btnScale }] }]}>
        <Pressable
          style={[styles.createBtn, !canSubmit && styles.createBtnDisabled]}
          onPress={handleCreate}
          onPressIn={() =>
            Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start()
          }
          onPressOut={() =>
            Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 30 }).start()
          }
          disabled={!canSubmit}
        >
          <Ionicons name="people" size={18} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.createBtnText}>
            {loading ? 'Création…' : 'Créer le groupe'}
          </Text>
        </Pressable>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: 120,
  },

  // Hero
  heroWrapper: {
    alignSelf: 'center',
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.sm,
  },
  heroCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.purple + '18',
    borderWidth: 2,
    borderColor: theme.colors.purple + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background,
  },

  title: {
    fontSize: theme.typography.size.xxl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 20,
  },

  // Card
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: theme.colors.purple,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
  },
  fieldLabel: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
  },
  inputWrapperFocused: {
    borderColor: theme.colors.purple,
    shadowColor: theme.colors.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.md,
    paddingVertical: 13,
  },
  charCount: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  charCountWarn: { color: theme.colors.warning },
  errorText: {
    color: theme.colors.danger,
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.medium,
    marginTop: theme.spacing.sm,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: theme.spacing.md,
    gap: 6,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },

  // Feature list
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.md,
  },
  featureIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.purple + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
    flex: 1,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingTop: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  createBtn: {
    flexDirection: 'row',
    backgroundColor: theme.colors.purple,
    paddingVertical: 16,
    borderRadius: theme.radius.round,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.purple,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  createBtnDisabled: { backgroundColor: theme.colors.disabled, shadowOpacity: 0, elevation: 0 },
  createBtnText: {
    color: '#FFF',
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.bold,
  },

  // Success
  successContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    shadowColor: theme.colors.purple,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  successTitle: {
    fontSize: theme.typography.size.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  successSub: {
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
});
