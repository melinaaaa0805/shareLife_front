import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import api from "../api/api";
import { theme } from "../assets/style/theme";
import { useAuth } from "../context/AuthContext";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout, updateUser } = useAuth();

  // Profile fields
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Loading states
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Delete account modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleSaveProfile = async () => {
    if (!firstName.trim()) return Alert.alert("Erreur", "Le prénom est requis.");
    if (!email.trim()) return Alert.alert("Erreur", "L'email est requis.");
    setSavingProfile(true);
    try {
      await updateUser({ firstName: firstName.trim(), email: email.trim() });
      Alert.alert("Succès", "Profil mis à jour.");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Impossible de mettre à jour le profil.";
      Alert.alert("Erreur", Array.isArray(msg) ? msg.join("\n") : msg);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async () => {
    if (!currentPassword) return Alert.alert("Erreur", "Le mot de passe actuel est requis.");
    if (!newPassword) return Alert.alert("Erreur", "Le nouveau mot de passe est requis.");
    if (newPassword !== confirmPassword) return Alert.alert("Erreur", "Les mots de passe ne correspondent pas.");
    setSavingPassword(true);
    try {
      await updateUser({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert("Succès", "Mot de passe modifié.");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Impossible de modifier le mot de passe.";
      Alert.alert("Erreur", Array.isArray(msg) ? msg.join("\n") : msg);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleRequestDelete = () => {
    Alert.alert(
      "Supprimer le compte",
      "Cette action est irréversible. Toutes vos données, groupes et dépenses seront supprimés définitivement.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Continuer",
          style: "destructive",
          onPress: () => {
            setDeletePassword("");
            setShowDeleteModal(true);
          },
        },
      ]
    );
  };

  const handleConfirmDelete = async () => {
    if (!deletePassword) return Alert.alert("Erreur", "Le mot de passe est requis.");
    setDeleting(true);
    try {
      await api.delete("/users/me", { data: { password: deletePassword } });
      await logout();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Impossible de supprimer le compte.";
      Alert.alert("Erreur", Array.isArray(msg) ? msg.join("\n") : msg);
    } finally {
      setDeleting(false);
    }
  };

  const avatar = (user?.firstName?.[0] ?? "?").toUpperCase();
  const avatarColor = user?.avatarColor ?? theme.colors.purple;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>Paramètres</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.avatarRow}>
          <View style={[styles.avatar, { backgroundColor: avatarColor + "30", borderColor: avatarColor }]}>
            <Text style={[styles.avatarText, { color: avatarColor }]}>{avatar}</Text>
          </View>
          <View style={styles.avatarInfo}>
            <Text style={styles.avatarName}>{user?.firstName ?? ""}</Text>
            <Text style={styles.avatarEmail}>{user?.email ?? ""}</Text>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profil</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Prénom</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Prénom"
              placeholderTextColor={theme.colors.textSecondary}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="email@exemple.com"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="done"
            />
          </View>

          <Pressable
            style={[styles.saveBtn, savingProfile && styles.btnDisabled]}
            onPress={handleSaveProfile}
            disabled={savingProfile}
          >
            <Ionicons name="checkmark-circle-outline" size={17} color={theme.colors.background} />
            <Text style={styles.saveBtnText}>
              {savingProfile ? "Enregistrement…" : "Enregistrer le profil"}
            </Text>
          </Pressable>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mot de passe</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Mot de passe actuel</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.textSecondary}
              secureTextEntry
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Nouveau mot de passe</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.textSecondary}
              secureTextEntry
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Confirmer le nouveau mot de passe</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.textSecondary}
              secureTextEntry
              returnKeyType="done"
            />
          </View>

          <Pressable
            style={[styles.saveBtn, savingPassword && styles.btnDisabled]}
            onPress={handleSavePassword}
            disabled={savingPassword}
          >
            <Ionicons name="lock-closed-outline" size={17} color={theme.colors.background} />
            <Text style={styles.saveBtnText}>
              {savingPassword ? "Enregistrement…" : "Changer le mot de passe"}
            </Text>
          </Pressable>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compte</Text>

          <Pressable style={styles.logoutBtn} onPress={logout}>
            <Ionicons name="log-out-outline" size={18} color={theme.colors.textPrimary} />
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </Pressable>

          <Pressable style={styles.deleteBtn} onPress={handleRequestDelete}>
            <Ionicons name="trash-outline" size={18} color={theme.colors.danger} />
            <Text style={styles.deleteText}>Supprimer le compte</Text>
          </Pressable>
        </View>
      </ScrollView>
      <Modal
        visible={showDeleteModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalBox}>
            <View style={styles.modalIconRow}>
              <View style={styles.modalIconBg}>
                <Ionicons name="warning-outline" size={28} color={theme.colors.danger} />
              </View>
            </View>
            <Text style={styles.modalTitle}>Confirmer la suppression</Text>
            <Text style={styles.modalBody}>
              Entrez votre mot de passe pour confirmer la suppression définitive de votre compte.
            </Text>
            <TextInput
              style={styles.modalInput}
              value={deletePassword}
              onChangeText={setDeletePassword}
              placeholder="Mot de passe"
              placeholderTextColor={theme.colors.textSecondary}
              secureTextEntry
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </Pressable>
              <Pressable
                style={[styles.modalConfirmBtn, deleting && styles.btnDisabled]}
                onPress={handleConfirmDelete}
                disabled={deleting}
              >
                <Text style={styles.modalConfirmText}>
                  {deleting ? "Suppression…" : "Supprimer"}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },

  header: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
  },

  scrollContent: {
    padding: theme.spacing.md,
    gap: theme.spacing.lg,
    paddingBottom: 40,
  },

  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 22,
    fontFamily: theme.typography.fontFamily.bold,
  },
  avatarInfo: { gap: 2 },
  avatarName: {
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
  },
  avatarEmail: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },

  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },

  field: { gap: 6 },
  fieldLabel: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textPrimary,
  },
  input: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textPrimary,
  },

  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.colors.purple,
    borderRadius: theme.radius.sm,
    paddingVertical: 13,
    marginTop: 4,
  },
  saveBtnText: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.background,
  },
  btnDisabled: { opacity: 0.5 },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 13,
  },
  logoutText: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textPrimary,
  },

  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: theme.colors.danger + "12",
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.danger + "40",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 13,
  },
  deleteText: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.danger,
  },

  // Delete confirmation modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.lg,
  },
  modalBox: {
    width: "100%",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  modalIconRow: { alignItems: "center", marginBottom: 4 },
  modalIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.danger + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: theme.typography.size.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
    textAlign: "center",
  },
  modalBody: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  modalInput: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textPrimary,
    marginTop: 4,
  },
  modalActions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: 4,
  },
  modalCancelBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 13,
  },
  modalCancelText: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textPrimary,
  },
  modalConfirmBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.danger,
    borderRadius: theme.radius.sm,
    paddingVertical: 13,
  },
  modalConfirmText: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: "#fff",
  },
});
