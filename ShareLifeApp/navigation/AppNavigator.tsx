import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { NavigationContainer, useNavigation, NavigationProp } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import GroupsScreen from '../screens/GroupsScreen';
import GroupDetailScreen from '../screens/GroupDetailScreen';
import CreateGroupScreen from '../screens/CreateGroupScreen';
import GroupDashboardScreen from '../screens/GroupDashboardScreen';
import TasksScreen from '../screens/TasksScreens';
import UnassignedTasksScreen from '../screens/UnassignedScreen';
import AddMemberScreen from '../screens/AddMemberScreen';
import GroupMembersScreen from '../screens/GroupMemberScreen';
import CalendarScreen from '../screens/CalendarScreen';
import ShoppingListScreen from '../screens/ShoppingListScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useAuth } from '../context/AuthContext';
import { Group } from '../types/types';
import AddTaskScreen from '../screens/AddTaskScreen';
import HomeScreen from '../screens/HomeScreen';

export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Register: undefined;
  Groups: undefined;
  StartGroup: undefined;
  MainTabs: undefined;
  GroupDetail: { groupId: string; group?: Group };
  CreateGroup: undefined;
  GroupDashboard: { groupId: string; currentUserId: string };
  UnassignedTasks: { groupId: string };
  AddMember: { groupId: string };
  GroupMembers: { groupId: string };
  TasksScreen: { groupId: string; currentUserId: string };
  Settings: undefined;
  AddTask: {day?: string};
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  return (
    <Tab.Navigator
      screenOptions={{
        headerRight: () => (
          <TouchableOpacity
            style={{
              marginRight: 16,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#4CAF50',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>⚙️</Text>
          </TouchableOpacity>
        ),
      }}
    >
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Dashboard" component={GroupDashboardScreen} />
      <Tab.Screen name="ShoppingList" component={ShoppingListScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home" // <-- toujours commencer par HomeScreen
        screenOptions={{ headerShown: false }} // header caché pour HomeScreen et modern look
      >

        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Connexion' }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Inscription' }} />
                      <Stack.Screen name="Home" component={HomeScreen} />

          </>
        ) : (
          <>
            <Stack.Screen name="Groups" component={GroupsScreen} options={{ title: 'Mes Groupes' }} />
            <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: true, title: 'Mon groupe' }} />
            <Stack.Screen name="GroupDetail" component={GroupDetailScreen} options={{ title: 'Détails du Groupe' }} />
            <Stack.Screen name="CreateGroup" component={CreateGroupScreen} options={{ title: 'Créer un Groupe' }} />
            <Stack.Screen name="TasksScreen" component={TasksScreen} options={{ title: 'Tâches' }} />
            <Stack.Screen name="UnassignedTasks" component={UnassignedTasksScreen} options={{ title: 'Tâches non assignées' }} />
            <Stack.Screen name="AddMember" component={AddMemberScreen} options={{ title: 'Ajouter un membre' }} />
            <Stack.Screen name="GroupMembers" component={GroupMembersScreen} options={{ title: 'Membres' }} />
            <Stack.Screen name="AddTask" component={AddTaskScreen} options={{ title: 'Ajouter une tâche' }} />

            <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Paramètres' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
