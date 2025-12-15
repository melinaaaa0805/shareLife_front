import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import api from '../api/api';
import { RootStackParamList } from '../navigation/AppNavigator';
import {Group} from '../types/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useGroup } from '../context/GroupContext';

type GroupDetailRouteProp = RouteProp<RootStackParamList, 'GroupDetail'>;
type GroupDetailNavigationProp =
  NativeStackNavigationProp<RootStackParamList, 'GroupDetail'>;

export default function GroupDetailScreen() {
const route = useRoute<GroupDetailRouteProp>();
const { groupId, group:initialGroup } = route.params;
const [group, setGroup] = useState<Group | null>(initialGroup ?? null);
  const navigation = useNavigation<GroupDetailNavigationProp>();
const { setCurrentGroup } = useGroup();

const fetchGroup = async () => {
  try {
    if (groupId === 'new') return;

    const res = await api.get(`/groups/${groupId}`);
    setGroup(res.data);
  } catch (error) {
    console.error(error);
  }
};


useFocusEffect(
  React.useCallback(() => {
    fetchGroup(); 
  }, [groupId])
);




useEffect(() => {
  fetchGroup();
}, []);

 const startGroup = () => {
    setCurrentGroup(group);
    navigation.replace('MainTabs'); // remplace l'écran par la navigation principale
  };


  return (
    <View style={styles.container}>
      {group ? (
        <>
          <Text style={styles.title}>{group.name}</Text>
          <Text style={styles.subtitle}>Membres :</Text>
          <FlatList
            data={group.members}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <Text style={styles.member}>{item.firstName} ({item.email})</Text>}
          />
          <TouchableOpacity onPress={startGroup}><Text>Commencer</Text>
          </TouchableOpacity>
           <TouchableOpacity
                     onPress={() => navigation.navigate('AddMember', { groupId: groupId, })}
                   >
                     <Text>Ajouter des membres</Text>
                              </TouchableOpacity>
        </>
      ) : (
        <Text>Chargement...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 18, marginTop: 16, marginBottom: 8 },
  member: { fontSize: 16, paddingVertical: 4 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginBottom: 12 },
});
