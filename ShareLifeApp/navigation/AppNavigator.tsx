import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  NavigationContainer,
  NavigationProp,
  useNavigation,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { navigationTheme, theme } from "../assets/style/theme";

import { useAuth } from "../context/AuthContext";
import { useGroup } from "../context/GroupContext";

import AddMemberScreen from "../screens/AddMemberScreen";
import AddTaskScreen from "../screens/AddTaskScreen";
import CalendarScreen from "../screens/CalendarScreen";
import CreateGroupScreen from "../screens/CreateGroupScreen";
import DayTasksScreen from "../screens/DayTasksScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import GroupDashboardScreen from "../screens/GroupDashboardScreen";
import GroupDetailScreen from "../screens/GroupDetailScreen";
import GroupMembersScreen from "../screens/GroupMemberScreen";
import GroupsScreen from "../screens/GroupsScreen";
import HomeScreen from "../screens/HomeScreen";
import ImportTaskScreen from "../screens/ImportTaskScreen";
import LoginScreen from "../screens/LoginScreen";
import MealPlannerScreen from "../screens/MealPlannerScreen";
import RegisterScreen from "../screens/RegisterScreen";
import SettingsScreen from "../screens/SettingsScreen";
import ShoppingListScreen from "../screens/ShoppingListScreen";
import SmartAssignScreen from "../screens/SmartAssignScreen";
import SpinWheelScreen from "../screens/SpinWheelScreen";
import TasksScreen from "../screens/TasksScreens";
import UnassignedTasksScreen from "../screens/UnassignedScreen";
import WeekTemplateScreen from "../screens/WeekTemplateScreen";
import { RootStackParamList } from "../types/types";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// ─── Back button ──────────────────────────────────────────────────────────────

function BackButton() {
  const navigation = useNavigation();
  return (
    <TouchableOpacity
      onPress={() => navigation.goBack()}
      style={navStyles.backBtn}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons
        name="chevron-back"
        size={20}
        color={theme.colors.textPrimary}
      />
    </TouchableOpacity>
  );
}

// ─── Shared header options ────────────────────────────────────────────────────

const sharedHeaderOptions = {
  headerStyle: {
    backgroundColor: theme.colors.surface,
  },
  headerTitleStyle: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.size.md,
    color: theme.colors.textPrimary,
  },
  headerTintColor: theme.colors.textPrimary,
  headerShadowVisible: false,
  headerBackVisible: false,
  headerLeft: () => <BackButton />,
  // Thin separator
  headerBottomBorderColor: theme.colors.border,
} as const;

// ─── Bottom tabs ──────────────────────────────────────────────────────────────

function GroupTabsHeader() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { currentGroup } = useGroup();

  return (
    <View style={navStyles.groupHeader}>
      <TouchableOpacity
        style={navStyles.groupHeaderBack}
        onPress={() => navigation.navigate("Groups")}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="chevron-back" size={18} color={theme.colors.purple} />
      </TouchableOpacity>

      <Text style={navStyles.groupHeaderName} numberOfLines={1}>
        {currentGroup?.name ?? ""}
      </Text>

      <TouchableOpacity
        style={navStyles.groupHeaderSettings}
        onPress={() =>
          currentGroup
            ? navigation.navigate("GroupDetail", { groupId: currentGroup.id })
            : undefined
        }
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons
          name="settings-outline"
          size={20}
          color={theme.colors.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );
}

function MainTabs() {
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <GroupTabsHeader />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            height: Platform.OS === "ios" ? 82 : 64,
            paddingBottom: Platform.OS === "ios" ? 22 : 10,
            paddingTop: 8,
          },
          tabBarActiveTintColor: theme.colors.purple,
          tabBarInactiveTintColor: theme.colors.textSecondary,
          tabBarLabelStyle: {
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: 11,
          },
          tabBarIcon: ({ focused, color }) => {
            let iconName: keyof typeof Ionicons.glyphMap = "home-outline";
            if (route.name === "Calendar")
              iconName = focused ? "calendar" : "calendar-outline";
            else if (route.name === "Dashboard")
              iconName = focused ? "stats-chart" : "stats-chart-outline";
            else if (route.name === "ShoppingList")
              iconName = focused ? "cart" : "cart-outline";
            else if (route.name === "MealPlanner")
              iconName = focused ? "restaurant" : "restaurant-outline";
            return <Ionicons name={iconName} size={22} color={color} />;
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
          name="MealPlanner"
          component={MealPlannerScreen}
          options={{ tabBarLabel: "Repas" }}
        />
        <Tab.Screen
          name="ShoppingList"
          component={ShoppingListScreen}
          options={{ tabBarLabel: "Courses" }}
        />
      </Tab.Navigator>
    </View>
  );
}

// ─── App navigator ────────────────────────────────────────────────────────────

export default function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={navStyles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.purple} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={sharedHeaderOptions}
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
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="MainTabs"
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="GroupDetail"
              component={GroupDetailScreen}
              options={{ title: "Groupe" }}
            />
            <Stack.Screen
              name="CreateGroup"
              component={CreateGroupScreen}
              options={{ title: "Nouveau groupe" }}
            />
            <Stack.Screen
              name="TasksScreen"
              component={TasksScreen}
              options={{ title: "Mes tâches" }}
            />
            <Stack.Screen
              name="UnassignedTasks"
              component={UnassignedTasksScreen}
              options={{ title: "Non assignées" }}
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
            <Stack.Screen
              name="DayTasks"
              component={DayTasksScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="AddTask"
              component={AddTaskScreen}
              options={{ title: "Nouvelle tâche" }}
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
            <Stack.Screen
              name="WeekTemplate"
              component={WeekTemplateScreen}
              options={{ title: "Modèle de semaine" }}
            />
            <Stack.Screen
              name="SmartAssign"
              component={SmartAssignScreen}
              options={{ title: "Répartition intelligente" }}
            />
          </>
        )}
        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPasswordScreen}
          options={{ title: "Mot de passe oublié" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const navStyles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },

  // Group tabs header
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingTop:
      Platform.OS === "ios" ? 54 : (StatusBar.currentHeight ?? 24) + 8,
    paddingBottom: 10,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  groupHeaderBack: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingRight: theme.spacing.sm,
  },
  groupHeaderBackText: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.purple,
  },
  groupHeaderName: {
    flex: 1,
    textAlign: "center",
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
    marginHorizontal: theme.spacing.sm,
  },
  groupHeaderSettings: {
    paddingLeft: theme.spacing.sm,
  },
});
