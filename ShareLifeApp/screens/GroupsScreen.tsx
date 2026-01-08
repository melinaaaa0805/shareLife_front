import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../types/types";
import api from "../api/api";
import { Group } from "../types/types";
import { useAuth } from "../context/AuthContext";
import { theme } from "../assets/style/theme";
type GroupsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Groups"
>;

export default function GroupsScreen() {
  const navigation = useNavigation<GroupsScreenNavigationProp>();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const response = await api.get("/groups/me");
      console.log("les groupes", response.data);
      setGroups(response.data);
    } catch (error) {
      console.error("Erreur groupes:", error);
      Alert.alert("Erreur", "Impossible de charger les groupes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", fetchGroups);
    return unsubscribe;
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes groupes 🏠</Text>
        <Text style={styles.subtitle}>
          Organisez, répartissez, respirez… et déléguez enfin 💪
        </Text>
      </View>

      {!groups.length ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Aucun groupe pour le moment 👀</Text>
          <Text style={styles.emptyText}>
            Crée un espace pour ta maison, ajoute des membres, répartis les
            tâches, et observe la charge mentale diminuer 📉✨
          </Text>
          <TouchableOpacity
            style={styles.createFirstButton}
            onPress={() => navigation.navigate("CreateGroup")}
          >
            <Text style={styles.createFirstText}>Créer mon premier groupe</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* GROUP LIST */
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.groupCard}
              onPress={() =>
                navigation.navigate("GroupDetail", {
                  groupId: item.id,
                  group: item,
                })
              }
            >
              <Text style={styles.groupName}>{item.name}</Text>

              {item.membersCount !== undefined && (
                <Text style={styles.membersText}>
                  {item.membersCount} membres
                </Text>
              )}

              {item.overdueTasks && item.overdueTasks > 3 && (
                <View style={styles.badgeOverload}>
                  <Text style={styles.badgeText}>⚠️ Charge élevée</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("CreateGroup")}
      >
        <Text style={styles.addButtonText}>+ Créer un groupe</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
  },

  /* ===== HEADER ===== */
  header: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.size.xl,
    color: theme.colors.purple,
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.sm,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },

  /* ===== LIST ===== */
  list: {
    paddingBottom: 120,
  },

  /* ===== CARDS ===== */
  groupCard: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.soft,
    position: "relative",
  },
  groupName: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.size.lg,
    color: theme.colors.textPrimary,
  },
  membersText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },

  /* ===== BADGES (idées futures) ===== */
  badgeOverload: {
    backgroundColor: theme.colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.round,
    position: "absolute",
    top: 12,
    right: 12,
  },
  badgeText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 10,
    color: theme.colors.background,
  },

  /* ===== LOGOUT BUTTON ===== */
  logoutButton: {
    alignSelf: "flex-end",
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.round,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 10,
  },
  logoutText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.size.sm,
    color: theme.colors.danger,
  },

  /* ===== EMPTY STATE ===== */
  emptyState: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginTop: 20,
    alignItems: "center",
  },
  emptyTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.size.lg,
    color: theme.colors.pink,
    textAlign: "center",
  },
  emptyText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.md,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  createFirstButton: {
    backgroundColor: theme.colors.mint,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
  },
  createFirstText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.size.md,
    color: theme.colors.background,
  },

  /* ===== ADD BUTTON ===== */
  addButton: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: theme.colors.purple,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    alignItems: "center",
  },
  addButtonText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.size.md,
    color: theme.colors.background,
  },

  /* ===== CENTER LOADING ===== */
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
});
