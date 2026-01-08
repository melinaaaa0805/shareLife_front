import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet, Easing } from 'react-native';
import { theme } from '../assets/style/theme';

type MemberItemProps = {
  firstName: string;
  email: string;
  index: number;
};

export default function MemberItem({ firstName, email, index }: MemberItemProps) {
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 400,
      delay: index * 100,
      useNativeDriver: true,
      easing: Easing.out(Easing.exp),
    }).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
      <View style={styles.memberCard}>
        <Text style={styles.memberName}>{firstName}</Text>
        <Text style={styles.memberEmail}>{email}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
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
});
