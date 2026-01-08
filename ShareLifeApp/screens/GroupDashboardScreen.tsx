import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../api/api';
import { RootStackParamList, Task, User } from '../types/types';
import { useGroup } from '../context/GroupContext';
import { useAuth } from '../context/AuthContext';
import { theme } from '../assets/style/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const GroupDashboardScreen = () => {
const navigation = useNavigation<NavigationProp>();
  const { currentGroup } = useGroup();
  const { user } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  if (!currentGroup || !user) {
    return <Text style={styles.emptyText}>Aucun groupe sélectionné</Text>;
  }

  const groupId = currentGroup.id;
  const currentUserId = user.id;

  useEffect(() => {
    fetchGroup();
  }, []);

  const fetchGroup = async () => {
    try {
      const res = await api.get(`/groups/${currentGroup.id}`);
      setTasks(res.data.tasks || []);
      setMembers(res.data.members || []);
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur', 'Impossible de charger le groupe');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Text style={styles.loadingText}>Chargement...</Text>;

  const completedTasksCount = tasks.filter(t => t.done).length;
  const unassignedTasks = tasks.filter(t => !t.assignedUser);
  const isAdmin = currentGroup?.owner.id === user?.id;
  const totalTasks = tasks.length;
  const completedPercent = totalTasks ? Math.round((completedTasksCount / totalTasks) * 100) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: theme.spacing.xl }}>
      <Text style={styles.title}>{currentGroup.name} - Dashboard</Text>

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: theme.colors.mint }]}>
          <Text style={styles.statTitle}>Tâches réalisées</Text>
          <Text style={styles.statValue}>{completedTasksCount}/{totalTasks}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${completedPercent}%`, backgroundColor: theme.colors.purple }]} />
          </View>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.colors.yellow }]}>
          <Text style={styles.statTitle}>Tâches non assignées</Text>
          <Text style={styles.statValue}>{unassignedTasks.length}</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.colors.pink }]}>
          <Text style={styles.statTitle}>Membres</Text>
          <Text style={styles.statValue}>{members.length}</Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('TasksScreen', { groupId, currentUserId })}
        >
          <Text style={styles.actionText}>Mes tâches</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('UnassignedTasks', { groupId })}
        >
          <Text style={styles.actionText}>Tâches non assignées</Text>
        </TouchableOpacity>

        {isAdmin && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('AddMember', { groupId })}
          >
            <Text style={styles.actionText}>Ajouter un membre</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('GroupMembers', { groupId })}
        >
          <Text style={styles.actionText}>Voir les membres</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default GroupDashboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.size.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.purple,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: theme.typography.size.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
  loadingText: {
    fontSize: theme.typography.size.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
  statsContainer: {
    marginBottom: theme.spacing.xl,
  },
  statCard: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.md,
    shadowColor: theme.shadows.soft.shadowColor,
    shadowOffset: theme.shadows.soft.shadowOffset,
    shadowOpacity: theme.shadows.soft.shadowOpacity,
    shadowRadius: theme.shadows.soft.shadowRadius,
    elevation: theme.shadows.soft.elevation,
  },
  statTitle: {
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.background,
    marginBottom: 4,
  },
  statValue: {
    fontSize: theme.typography.size.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.background,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    width: '100%',
    backgroundColor: theme.colors.disabled,
    borderRadius: theme.radius.round,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.radius.round,
  },
  actionsContainer: {
    marginTop: theme.spacing.md,
  },
  actionButton: {
    backgroundColor: theme.colors.purple,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.sm,
    alignItems: 'center',
    ...theme.shadows.soft,
  },
  actionText: {
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
  },
});
