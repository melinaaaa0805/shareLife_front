import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import api from '../api/api';
import { Group, Task, User } from '../types/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/types';
import { useGroup } from '../context/GroupContext';
import { useAuth } from '../context/AuthContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;



const GroupDashboardScreen = () => {
const navigation = useNavigation<NavigationProp>();
  const { currentGroup} = useGroup();
  const {user} = useAuth();
 
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

if (!currentGroup || !user) {
  return <Text>Aucun groupe sélectionné</Text>;
}
  const groupId = currentGroup.id;
  const currentUserId = user.id;

  useEffect(() => {
    fetchGroup();
  }, []);

  const fetchGroup = async () => {
    try {
      const res = await api.get(`/groups/${currentGroup?.id}`);
      setTasks(res.data.tasks || []);
      setMembers(res.data.members || []);
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur', 'Impossible de charger le groupe');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Text>Chargement...</Text>;

  const completedTasksCount = tasks.filter(t => t.completed).length;
  const unassignedTasks = tasks.filter(t => !t.assignedUser);
  const isAdmin = currentGroup?.owner.id === user?.id;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{currentGroup?.name} - Dashboard</Text>

      <Text>Tâches réalisées : {completedTasksCount}</Text>
      <Text>Tâches non assignées : {unassignedTasks.length}</Text>
      <Text>Membres : {members.length}</Text>

      <Button
        title="Mes tâches"
        onPress={() => navigation.navigate('TasksScreen', { groupId, currentUserId })}
      />
      <Button
        title="Tâches non assignées"
        onPress={() => navigation.navigate('UnassignedTasks', { groupId })}
      />
      {isAdmin && (
        <Button
          title="Ajouter un membre"
          onPress={() => navigation.navigate('AddMember', { groupId })}
        />
      )}
      <Button
        title="Voir les membres"
        onPress={() => navigation.navigate('GroupMembers', { groupId })}
      />
    </View>
  );
};

export default GroupDashboardScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
});
