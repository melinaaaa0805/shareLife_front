import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../types/types";
import api from "../api/api";
import { Group } from "../types/types";
import { useAuth, UpdateProfilePayload } from "../context/AuthContext";
import { theme } from "../assets/style/theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "Groups">;

// ─── Palette de couleurs avatar ───────────────────────────────────────────────
const AVATAR_PALETTE = [
  "#9B7BEA", // purple
  "#EAB1CF", // pink
  "#A6D8C0", // mint
  "#FFE27A", // yellow
  "#7BC4EA", // blue
  "#EA9B7B", // orange
  "#B1EAD4", // teal
  "#C4B1EA", // lavender
];

function getDefaultColor(name: string) {
  return AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length];
}

// ─── Composant carte groupe ────────────────────────────────────────────────────
function GroupCard({
  group,
  index,
  onPress,
}: {
  group: Group;
  index: number;
  onPress: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(24)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        delay: index * 70,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 70,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const accent = getDefaultColor(group.name);
  const initial = group.name[0].toUpperCase();
  const memberCount = group.members?.length ?? group.membersCount ?? 0;

  return (
    <Animated.View
      style={{ transform: [{ translateY: slideAnim }, { scale: scaleAnim }], opacity: opacityAnim }}
    >
      <Pressable
        style={styles.groupCard}
        onPress={onPress}
        onPressIn={() =>
          Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start()
        }
        onPressOut={() =>
          Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 30 }).start()
        }
      >
        <View style={[styles.groupCardAccent, { backgroundColor: accent }]} />
        <View style={[styles.groupCardAvatar, { backgroundColor: accent + "22", borderColor: accent }]}>
          <Text style={[styles.groupCardAvatarText, { color: accent }]}>{initial}</Text>
        </View>
        <View style={styles.groupCardBody}>
          <Text style={styles.groupCardName}>{group.name}</Text>
          <Text style={styles.groupCardSub}>
            {memberCount} membre{memberCount !== 1 ? "s" : ""}
          </Text>
        </View>
        <Text style={styles.groupCardArrow}>›</Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── Écran principal ───────────────────────────────────────────────────────────
export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { user, logout, updateUser } = useAuth();

  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [sheetVisible, setSheetVisible] = useState(false);

  // Edit form state
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [selectedColor, setSelectedColor] = useState(
    user?.avatarColor ?? getDefaultColor(user?.firstName ?? "A")
  );
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "password">("info");

  // Bottom sheet animation
  const sheetAnim = useRef(new Animated.Value(0)).current;

  const openSheet = () => {
    setFirstName(user?.firstName ?? "");
    setEmail(user?.email ?? "");
    setCurrentPassword("");
    setNewPassword("");
    setSelectedColor(user?.avatarColor ?? getDefaultColor(user?.firstName ?? "A"));
    setActiveTab("info");
    setSheetVisible(true);
    Animated.spring(sheetAnim, {
      toValue: 1,
      tension: 65,
      friction: 11,
      useNativeDriver: true,
    }).start();
  };

  const closeSheet = () => {
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setSheetVisible(false));
  };

  const sheetTranslateY = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [500, 0],
  });

  const backdropOpacity = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.6],
  });

  // Fetch groups
  const fetchGroups = async () => {
    setLoadingGroups(true);
    try {
      const res = await api.get("/groups/me");
      setGroups(res.data);
    } catch {
      Alert.alert("Erreur", "Impossible de charger les groupes");
    } finally {
      setLoadingGroups(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", fetchGroups);
    return unsubscribe;
  }, [navigation]);

  // Save profile
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: UpdateProfilePayload = {};
      if (firstName.trim() && firstName !== user?.firstName)
        payload.firstName = firstName.trim();
      if (email.trim() && email !== user?.email) payload.email = email.trim();
      if (selectedColor !== user?.avatarColor) payload.avatarColor = selectedColor;
      if (newPassword) {
        payload.newPassword = newPassword;
        payload.currentPassword = currentPassword;
      }
      if (Object.keys(payload).length === 0) {
        closeSheet();
        return;
      }
      await updateUser(payload);
      closeSheet();
    } catch (err: any) {
      Alert.alert(
        "Erreur",
        err?.response?.data?.message ?? "Impossible de mettre à jour le profil."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Déconnexion", "Tu veux vraiment te déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Déconnecter", style: "destructive", onPress: logout },
    ]);
  };

  const avatarColor = user?.avatarColor ?? getDefaultColor(user?.firstName ?? "A");
  const initial = (user?.firstName ?? "?")[0].toUpperCase();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header profil ── */}
        <View style={styles.profileHeader}>
          <View style={styles.profileLeft}>
            <TouchableOpacity
              style={[styles.avatar, { backgroundColor: avatarColor + "22", borderColor: avatarColor }]}
              onPress={openSheet}
              activeOpacity={0.8}
            >
              <Text style={[styles.avatarInitial, { color: avatarColor }]}>{initial}</Text>
              <View style={styles.avatarEditBadge}>
                <Text style={styles.avatarEditIcon}>✏️</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <Text style={styles.greeting}>
                Bonjour,{" "}
                <Text style={[styles.greetingName, { color: avatarColor }]}>
                  {user?.firstName}
                </Text>{" "}
                👋
              </Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutIcon}>⏻</Text>
          </TouchableOpacity>
        </View>

        {/* ── Section groupes ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes groupes</Text>
          <Text style={styles.sectionCount}>{groups.length}</Text>
        </View>

        {loadingGroups ? (
          <ActivityIndicator
            size="large"
            color={theme.colors.purple}
            style={{ marginTop: 40 }}
          />
        ) : groups.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🏡</Text>
            <Text style={styles.emptyTitle}>Aucun groupe pour l'instant</Text>
            <Text style={styles.emptyText}>
              Crée un espace partagé et invite tes proches
            </Text>
          </View>
        ) : (
          groups.map((g, i) => (
            <GroupCard
              key={g.id}
              group={g}
              index={i}
              onPress={() =>
                navigation.navigate("GroupDetail", { groupId: g.id, group: g })
              }
            />
          ))
        )}

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── Bouton créer groupe ── */}
      <View style={styles.footer}>
        <Pressable
          style={styles.createBtn}
          onPress={() => navigation.navigate("CreateGroup")}
        >
          <Text style={styles.createBtnText}>+ Créer un groupe</Text>
        </Pressable>
      </View>

      {/* ── Bottom sheet profil ── */}
      <Modal
        visible={sheetVisible}
        transparent
        animationType="none"
        onRequestClose={closeSheet}
      >
        <KeyboardAvoidingView
          style={styles.sheetOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Backdrop */}
          <Animated.View
            style={[styles.backdrop, { opacity: backdropOpacity }]}
          >
            <TouchableOpacity style={{ flex: 1 }} onPress={closeSheet} />
          </Animated.View>

          {/* Sheet */}
          <Animated.View
            style={[
              styles.sheet,
              { transform: [{ translateY: sheetTranslateY }] },
            ]}
          >
            {/* Poignée */}
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sheetTitle}>Mon profil</Text>
              <TouchableOpacity onPress={closeSheet}>
                <Text style={styles.sheetClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Avatar + palette */}
            <View style={styles.avatarSection}>
              <View
                style={[
                  styles.sheetAvatar,
                  { backgroundColor: selectedColor + "22", borderColor: selectedColor },
                ]}
              >
                <Text style={[styles.sheetAvatarText, { color: selectedColor }]}>
                  {initial}
                </Text>
              </View>
              <View style={styles.palette}>
                {AVATAR_PALETTE.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.paletteColor,
                      { backgroundColor: color },
                      selectedColor === color && styles.paletteColorSelected,
                    ]}
                    onPress={() => setSelectedColor(color)}
                  />
                ))}
              </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, activeTab === "info" && styles.tabActive]}
                onPress={() => setActiveTab("info")}
              >
                <Text style={[styles.tabText, activeTab === "info" && styles.tabTextActive]}>
                  Informations
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === "password" && styles.tabActive]}
                onPress={() => setActiveTab("password")}
              >
                <Text style={[styles.tabText, activeTab === "password" && styles.tabTextActive]}>
                  Mot de passe
                </Text>
              </TouchableOpacity>
            </View>

            {activeTab === "info" ? (
              <View style={styles.formFields}>
                <Text style={styles.fieldLabel}>Prénom</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Ton prénom"
                  placeholderTextColor={theme.colors.textSecondary}
                />
                <Text style={styles.fieldLabel}>Adresse email</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="ton@email.com"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            ) : (
              <View style={styles.formFields}>
                <Text style={styles.fieldLabel}>Mot de passe actuel</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="••••••••"
                  placeholderTextColor={theme.colors.textSecondary}
                  secureTextEntry
                />
                <Text style={styles.fieldLabel}>Nouveau mot de passe</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="••••••••"
                  placeholderTextColor={theme.colors.textSecondary}
                  secureTextEntry
                />
              </View>
            )}

            <Pressable
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>
                {saving ? "Enregistrement…" : "Enregistrer"}
              </Text>
            </Pressable>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.xl + 16 },

  // Profile header
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.xl,
  },
  profileLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.md,
    position: "relative",
  },
  avatarInitial: {
    fontSize: 22,
    fontFamily: theme.typography.fontFamily.bold,
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEditIcon: { fontSize: 9 },
  profileInfo: { flex: 1 },
  greeting: {
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
  },
  greetingName: { fontFamily: theme.typography.fontFamily.bold },
  profileEmail: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.regular,
    marginTop: 2,
  },
  logoutBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutIcon: { fontSize: 16 },

  // Section
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
    gap: 10,
  },
  sectionTitle: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  sectionCount: {
    backgroundColor: theme.colors.purple + "33",
    color: theme.colors.purple,
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.bold,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radius.round,
  },

  // Group card
  groupCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
  },
  groupCardAccent: { width: 4, alignSelf: "stretch" },
  groupCardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    margin: theme.spacing.md,
  },
  groupCardAvatarText: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.bold,
  },
  groupCardBody: { flex: 1, paddingVertical: theme.spacing.md },
  groupCardName: {
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
  },
  groupCardSub: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.regular,
    marginTop: 2,
  },
  groupCardArrow: {
    fontSize: 22,
    color: theme.colors.textSecondary,
    paddingRight: theme.spacing.md,
  },

  // Empty
  emptyState: {
    alignItems: "center",
    paddingVertical: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: "dashed",
    marginTop: theme.spacing.sm,
  },
  emptyEmoji: { fontSize: 36, marginBottom: theme.spacing.sm },
  emptyTitle: {
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: theme.spacing.lg,
  },

  // Footer
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
  createBtn: {
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
  createBtnText: {
    color: "#FFF",
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.size.md,
  },

  // Bottom sheet
  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: Platform.OS === "ios" ? 40 : 28,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: theme.spacing.md,
  },
  sheetHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  sheetTitle: {
    fontSize: theme.typography.size.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
  },
  sheetClose: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    padding: 4,
  },
  // Avatar + palette
  avatarSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sheetAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetAvatarText: {
    fontSize: 24,
    fontFamily: theme.typography.fontFamily.bold,
  },
  palette: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  paletteColor: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  paletteColorSelected: {
    borderWidth: 3,
    borderColor: theme.colors.textPrimary,
    transform: [{ scale: 1.15 }],
  },
  // Tabs
  tabs: {
    flexDirection: "row",
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: 3,
    marginBottom: theme.spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
    alignItems: "center",
  },
  tabActive: { backgroundColor: theme.colors.surface },
  tabText: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.semiBold,
  },
  // Form
  formFields: { marginBottom: theme.spacing.lg },
  fieldLabel: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: theme.spacing.sm,
  },
  fieldInput: {
    backgroundColor: theme.colors.card,
    color: theme.colors.textPrimary,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.regular,
  },
  // Save btn
  saveBtn: {
    backgroundColor: theme.colors.purple,
    paddingVertical: 15,
    borderRadius: theme.radius.round,
    alignItems: "center",
    shadowColor: theme.colors.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnDisabled: { backgroundColor: theme.colors.disabled, shadowOpacity: 0 },
  saveBtnText: {
    color: "#FFF",
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.size.md,
  },
});
