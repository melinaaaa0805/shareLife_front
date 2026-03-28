import React from "react";
import { TouchableOpacity, Text, View, StyleSheet } from "react-native";
import {
  NavigationContainer,
  useNavigation,
  NavigationProp,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { ActivityIndicator } from "react-native";
import { theme } from "../assets/style/theme";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../context/AuthContext";
import { Group } from "../types/types";

import HomeScreen from "../screens/HomeScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import GroupsScreen from "../screens/GroupsScreen";
import GroupDetailScreen from "../screens/GroupDetailScreen";
import CreateGroupScreen from "../screens/CreateGroupScreen";
import GroupDashboardScreen from "../screens/GroupDashboardScreen";
import TasksScreen from "../screens/TasksScreens";
import UnassignedTasksScreen from "../screens/UnassignedScreen";
import AddMemberScreen from "../screens/AddMemberScreen";
import GroupMembersScreen from "../screens/GroupMemberScreen";
import CalendarScreen from "../screens/CalendarScreen";
import ShoppingListScreen from "../screens/ShoppingListScreen";
import SettingsScreen from "../screens/SettingsScreen";
import AddTaskScreen from "../screens/AddTaskScreen";
import DayTasksScreen from "../screens/DayTasksScreen";
import { RootStackParamList } from "../types/types";
import ImportTaskScreen from "../screens/ImportTaskScreen";
import SpinWheelScreen from "../screens/SpinWheelScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        headerStyle: {
          backgroundColor: theme.colors.surface,
          shadowColor: "transparent",
        },
        headerTitleStyle: {
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: theme.typography.size.lg,
          color: theme.colors.purple,
        },
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 0,
          height: 70,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: theme.colors.purple,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarLabelStyle: { fontFamily: theme.typography.fontFamily.medium },

        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home-outline";

          if (route.name === "Calendar")
            iconName = focused ? "calendar" : "calendar-outline";
          else if (route.name === "Dashboard")
            iconName = focused ? "stats-chart" : "stats-chart-outline";
          else if (route.name === "ShoppingList")
            iconName = focused ? "cart" : "cart-outline";

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{ tabBarLabel: "Calendrier" }}
      />
      <Tab.Screen
        name="Dashboard"
        component={GroupDashboardScreen}
        options={{ tabBarLabel: "Dashboard" }}
      />
      <Tab.Screen
        name="ShoppingList"
        component={ShoppingListScreen}
        options={{ tabBarLabel: "Courses" }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.purple} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTitleStyle: {
            fontFamily: theme.typography.fontFamily.bold,
            color: theme.colors.purple,
          },
          headerTintColor: theme.colors.purple,
          headerShadowVisible: false,
        }}
      >
        {!isAuthenticated ? (
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ title: "Connexion" }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ title: "Inscription" }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Groups"
              component={GroupsScreen}
              options={{ title: "Accueil", headerShown: false }}
            />
            <Stack.Screen
              name="MainTabs"
              component={MainTabs}
              options={{ headerShown: true, title: "Mon groupe" }}
            />
            <Stack.Screen
              name="GroupDetail"
              component={GroupDetailScreen}
              options={{ title: "Détails du Groupe" }}
            />
            <Stack.Screen
              name="CreateGroup"
              component={CreateGroupScreen}
              options={{ title: "Créer un Groupe" }}
            />
            <Stack.Screen
              name="TasksScreen"
              component={TasksScreen}
              options={{ title: "Tâches" }}
            />
            <Stack.Screen
              name="UnassignedTasks"
              component={UnassignedTasksScreen}
              options={{ title: "Tâches non assignées" }}
            />
            <Stack.Screen
              name="AddMember"
              component={AddMemberScreen}
              options={{ title: "Ajouter un membre" }}
            />
            <Stack.Screen
              name="GroupMembers"
              component={GroupMembersScreen}
              options={{ title: "Membres" }}
            />
            <Stack.Screen name="DayTasks" component={DayTasksScreen} />
            <Stack.Screen
              name="AddTask"
              component={AddTaskScreen}
              options={{ title: "Ajouter une tâche" }}
            />
            <Stack.Screen
              name="ImportTask"
              component={ImportTaskScreen}
              options={{ title: "Importer une tâche" }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ title: "Paramètres" }}
            />
            <Stack.Screen
              name="SpinWheel"
              component={SpinWheelScreen}
              options={{ title: "Tirage au sort" }}
            />
          </>
        )}

        {/* Toujours disponible, auth ou non */}
        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPasswordScreen}
          options={{ title: "Mot de passe oublié" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
});
