import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import LottieView from "lottie-react-native";
import api from "../api/api";
import { theme } from "../assets/style/theme";

type RouteProps = RouteProp<{ params: { groupId: string } }, "params">;

const AddMemberScreen = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation();
  const { groupId } = route.params;

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [focused, setFocused] = useState(false);

  // Animations
  const cardSlide = useRef(new Animated.Value(60)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const borderGlow = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const lottieRef = useRef<LottieView>(null);

  useEffect(() => {
    Animated.stagger(80, [
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(cardSlide, {
          toValue: 0,
          tension: 60,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.timing(borderGlow, {
      toValue: focused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [focused]);

  const borderColor = borderGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.border, theme.colors.purple],
  });

  const shadowOpacity = borderGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.4],
  });

  const handlePressIn = () => {
    Animated.spring(btnScale, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(btnScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
    }).start();
  };

  const handleAddMember = async () => {
    if (!groupId || !email.trim()) return;

    setLoading(true);
    try {
      await api.post(`/group-invitations/${groupId}`, { email: email.trim() });
      setSuccess(true);
      setTimeout(() => navigation.goBack(), 1800);
    } catch (err: any) {
      const status = err.response?.status;
      const message =
        status === 404
          ? "Aucun compte trouvé avec cet email."
          : err.response?.data?.message ?? "Impossible d'envoyer l'invitation.";
      Animated.sequence([
        Animated.timing(cardSlide, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(cardSlide, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(cardSlide, { toValue: -6, duration: 60, useNativeDriver: true }),
        Animated.timing(cardSlide, { toValue: 6, duration: 60, useNativeDriver: true }),
        Animated.timing(cardSlide, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canSubmit = email.trim().length > 0 && !loading;

  if (success) {
    return (
      <View style={styles.successContainer}>
        <LottieView
          ref={lottieRef}
          source={require("../assets/lottie/success.json")}
          autoPlay
          loop={false}
          style={styles.successLottie}
        />
        <Text style={styles.successText}>Invitation envoyée ! 🎉</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={80}
    >
      {/* Header avec illustration */}
      <Animated.View style={[styles.heroSection, { opacity: titleOpacity }]}>
        <LottieView
          source={require("../assets/lottie/add-member.json")}
          autoPlay
          loop
          style={styles.lottie}
        />
        <Text style={styles.title}>Inviter un membre</Text>
        <Text style={styles.subtitle}>
          Partagez la charge mentale avec vos proches
        </Text>
      </Animated.View>

      {/* Card flottante */}
      <Animated.View
        style={[
          styles.card,
          {
            transform: [{ translateY: cardSlide }],
            opacity: cardOpacity,
          },
        ]}
      >
        <Text style={styles.inputLabel}>Adresse email</Text>

        <Animated.View
          style={[
            styles.inputWrapper,
            {
              borderColor,
              shadowColor: theme.colors.purple,
              shadowOpacity,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 0 },
              elevation: 0,
            },
          ]}
        >
          <Text style={styles.inputIcon}>✉️</Text>
          <TextInput
            placeholder="prenom@email.com"
            placeholderTextColor={theme.colors.textSecondary}
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setErrorMsg(null);
            }}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </Animated.View>

        {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

        <Text style={styles.hint}>
          La personne doit déjà avoir un compte ShareLife
        </Text>
      </Animated.View>

      {/* Bouton CTA fixé en bas */}
      <View style={styles.footer}>
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <Pressable
            style={[styles.button, !canSubmit && styles.buttonDisabled]}
            onPress={handleAddMember}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={!canSubmit}
          >
            <Text style={styles.buttonText}>
              {loading ? "Envoi en cours…" : "Envoyer l'invitation"}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default AddMemberScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  heroSection: {
    alignItems: "center",
    paddingTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  lottie: {
    width: 160,
    height: 160,
  },
  title: {
    fontSize: theme.typography.size.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginTop: 6,
    textAlign: "center",
  },
  card: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inputLabel: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    paddingHorizontal: theme.spacing.md,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.regular,
    paddingVertical: 14,
  },
  errorText: {
    marginTop: theme.spacing.sm,
    fontSize: theme.typography.size.xs,
    color: theme.colors.danger,
    fontFamily: theme.typography.fontFamily.medium,
  },
  hint: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.size.xs,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.regular,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    paddingTop: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  button: {
    backgroundColor: theme.colors.purple,
    paddingVertical: 16,
    borderRadius: theme.radius.round,
    alignItems: "center",
    shadowColor: theme.colors.purple,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: "#FFF",
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.size.md,
    letterSpacing: 0.3,
  },
  successContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  successLottie: {
    width: 200,
    height: 200,
  },
  successText: {
    fontSize: theme.typography.size.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.md,
  },
});
