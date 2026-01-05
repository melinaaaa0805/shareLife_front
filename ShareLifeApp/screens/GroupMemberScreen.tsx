import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import api from '../api/api';
import { User } from '../types/types';

type RouteProps = RouteProp<{ params: { groupId: string } }, 'params'>;

const GroupMembersScreen = () => {
  const route = useRoute<RouteProps>();
  const { groupId } = route.params;
  const [members, setMembers] = useState<User[]>([]);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await api.get(`/group-member/${groupId}`);
      setMembers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!members.length) return <Text>Aucun membre</Text>;

  return (
    <FlatList
      data={members}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.member}>
          <Text>{item.firstName} {item.lastName} ({item.email})</Text>
        </View>
      )}
      contentContainerStyle={styles.list}
    />
  );
};

export default GroupMembersScreen;

const styles = StyleSheet.create({
  list: { padding: 20 },
  member: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
});
