import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet, Easing } from 'react-native';
import { theme } from '../assets/style/theme';

const AVATAR_COLORS = [
  theme.colors.purple,
  theme.colors.pink,
  theme.colors.mint,
  theme.colors.yellow,
  '#7BC4EA',
  '#EA9B7B',
];

type MemberItemProps = {
  firstName: string;
  email: string;
  index: number;
  isAdmin?: boolean;
};

export default function MemberItem({ firstName, email, index, isAdmin }: MemberItemProps) {
  const slideAnim = useRef(new Animated.Value(40)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 380,
        delay: index * 80,
        useNativeDriver: true,
        easing: Easing.out(Easing.exp),
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const initial = firstName ? firstName[0].toUpperCase() : '?';

  return (
    <Animated.View
      style={{
        transform: [{ translateY: slideAnim }],
        opacity: opacityAnim,
      }}
    >
      <View style={styles.memberCard}>
        <View style={[styles.avatar, { backgroundColor: avatarColor + '33', borderColor: avatarColor }]}>
          <Text style={[styles.avatarText, { color: avatarColor }]}>{initial}</Text>
        </View>
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.memberName}>{firstName}</Text>
            {isAdmin && (
              <View style={styles.adminChip}>
                <Text style={styles.adminChipText}>👑 Chef</Text>
              </View>
            )}
          </View>
          <Text style={styles.memberEmail}>{email}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  avatarText: {
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.bold,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: {
    fontSize: theme.typography.size.md,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.semiBold,
  },
  memberEmail: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.regular,
    marginTop: 2,
  },
  adminChip: {
    backgroundColor: '#FFD70022',
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: theme.radius.round,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  adminChipText: {
    fontSize: 10,
    color: '#FFD700',
    fontFamily: theme.typography.fontFamily.semiBold,
  },
});
