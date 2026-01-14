import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/types";
import { theme } from "../assets/style/theme";
import LottieView from "../components/LottieAnimation";
import { useAuth } from "../context/AuthContext";
type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Register">;

export default function RegisterScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!firstName || !email || !password) {
      Alert.alert("Erreur", "Tous les champs sont requis");
      return;
    }
    try {
      register(firstName, email, password);
      Alert.alert("Votre compte a bien été créé !");
    } catch (error) {
      console.error(error);
      Alert.alert("Erreur", "Impossible de créer le compte");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.animationWrapper}>
        <LottieView
          source={require("../assets/lottie/register.json")}
          autoPlay
          loop
          style={styles.lottie}
        />
      </View>

      <Text style={styles.title}>Inscription</Text>
      <Text style={styles.subtitle}>Créez votre compte pour commencer</Text>

      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Prénom"
          placeholderTextColor={theme.colors.textSecondary}
          value={firstName}
          onChangeText={setFirstName}
        />
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

      <TouchableOpacity
        style={styles.registerButton}
        activeOpacity={0.8}
        onPress={handleRegister}
      >
        <Text style={styles.registerButtonText}>S'inscrire</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.loginButton}
        activeOpacity={0.8}
        onPress={() => navigation.navigate("Login")}
      >
        <Text style={styles.loginButtonText}>Se connecter</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    justifyContent: "center",
  },
  animationWrapper: {
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  lottie: {
    width: 180,
    height: 180,
  },
  title: {
    fontSize: theme.typography.size.xxl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.purple,
    textAlign: "center",
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
    textAlign: "center",
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
  registerButton: {
    backgroundColor: theme.colors.purple,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.lg,
    alignItems: "center",
    marginBottom: theme.spacing.sm,
    ...theme.shadows.soft,
  },
  registerButtonText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.size.lg,
    fontFamily: theme.typography.fontFamily.semiBold,
  },
  loginButton: {
    borderWidth: 1,
    borderColor: theme.colors.purple,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.lg,
    alignItems: "center",
  },
  loginButtonText: {
    color: theme.colors.purple,
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.medium,
  },
});
