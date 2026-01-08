import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import api from "../api/api";
import { RootStackParamList } from "../types/types";
import { Group } from "../types/types";
import { useGroup } from "../context/GroupContext";
import { theme } from "../assets/style/theme";
import MemberItem from "../components/MemberItem";

type GroupDetailRouteProp = RouteProp<RootStackParamList, "GroupDetail">;
type GroupDetailNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "GroupDetail"
>;

export default function GroupDetailScreen() {
  const route = useRoute<GroupDetailRouteProp>();
  const { groupId, group: initialGroup } = route.params;
  const [group, setGroup] = useState<Group | null>(initialGroup ?? null);
  const navigation = useNavigation<GroupDetailNavigationProp>();
  const { setCurrentGroup } = useGroup();

  const fadeAnim = useRef(new Animated.Value(0)).current; // animation fade in

  const fetchGroup = async () => {
    try {
      if (groupId === "new") return;
      const res = await api.get(`/groups/${groupId}`);
      setGroup(res.data);
      console.log("GROUP ", group);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.exp),
      }).start();
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
    navigation.replace("MainTabs");
  };

  return (
    <View style={styles.container}>
      {group ? (
        <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
          <Text style={styles.title}>{group.name}</Text>
          <Text style={styles.subtitle}>Membres :</Text>

          <FlatList
            data={group.members}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <MemberItem
                firstName={item.firstName} // ← ici
                email={item?.email} // ← ici
                index={index}
              />
            )}
          />

          <Text style={styles.infoText}>
            Prêt à commencer à partager la charge mentale avec ce groupe ?
          </Text>

          <TouchableOpacity
            style={styles.startButton}
            activeOpacity={0.8}
            onPress={startGroup}
          >
            <Text style={styles.startButtonText}>Commencer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addMemberButton}
            onPress={() =>
              navigation.navigate("AddMember", { groupId: groupId })
            }
          >
            <Text style={styles.addMemberText}>Ajouter des membres</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <Text style={styles.loadingText}>Chargement...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.size.xxl,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.bold,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.size.lg,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.medium,
    marginBottom: theme.spacing.md,
  },
  memberCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.sm,
    shadowColor: theme.shadows.soft.shadowColor,
    shadowOffset: theme.shadows.soft.shadowOffset,
    shadowOpacity: theme.shadows.soft.shadowOpacity,
    shadowRadius: theme.shadows.soft.shadowRadius,
    elevation: theme.shadows.soft.elevation,
  },
  memberName: {
    fontSize: theme.typography.size.md,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.semiBold,
  },
  memberEmail: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.regular,
  },
  startButton: {
    backgroundColor: theme.colors.purple,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: "center",
    marginTop: theme.spacing.lg,
    shadowColor: theme.shadows.soft.shadowColor,
    shadowOffset: theme.shadows.soft.shadowOffset,
    shadowOpacity: theme.shadows.soft.shadowOpacity,
    shadowRadius: theme.shadows.soft.shadowRadius,
    elevation: theme.shadows.soft.elevation,
  },
  startButtonText: {
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.size.md,
  },
  addMemberButton: {
    marginTop: theme.spacing.sm,
    alignItems: "center",
  },
  addMemberText: {
    color: theme.colors.pink,
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.medium,
  },
  infoText: {
    marginTop: theme.spacing.md,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.md,
    textAlign: "center",
  },
  loadingText: {
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginTop: theme.spacing.xl,
    fontSize: theme.typography.size.lg,
  },
});
