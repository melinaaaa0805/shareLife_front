import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

type Group = {
  id: string;
  name: string;
  owner: { id: string; email: string };
};

type Props = {
  group: Group;
  onPress: () => void;
};

export default function GroupCard({ group, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Text style={styles.name}>{group.name}</Text>
      <Text style={styles.owner}>Propriétaire: {group.owner.email}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, borderBottomWidth: 1, borderColor: '#ccc', borderRadius: 6, marginBottom: 8 },
  name: { fontSize: 16, fontWeight: 'bold' },
  owner: { fontSize: 12, color: '#666' },
});
