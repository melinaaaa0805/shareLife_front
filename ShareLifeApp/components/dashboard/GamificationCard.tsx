import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/api';
import { theme } from '../../assets/style/theme';
import { Badge, GamificationProfile } from '../../types/types';

export default function GamificationCard() {
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const slideAnim = useRef(new Animated.Value(16)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    api.get('/gamification/me')
      .then(res => {
        setProfile(res.data);
        Animated.parallel([
          Animated.timing(opacityAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 8 }),
        ]).start();
      })
      .catch(() => {});
  }, []);

  if (!profile) return null;

  const earnedBadges = profile.badges.filter(b => b.earned);
  const unearnedBadges = profile.badges.filter(b => !b.earned);

  return (
    <Animated.View style={[styles.card, { opacity: opacityAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Ionicons name="flame-outline" size={14} color="#FF6B35" />
        </View>
        <Text style={styles.title}>Ma progression</Text>
      </View>

      {/* Streak row */}
      <View style={styles.streakRow}>
        <View style={styles.streakBlock}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <View>
            <Text style={styles.streakValue}>{profile.streak}</Text>
            <Text style={styles.streakLabel}>jours consécutifs</Text>
          </View>
        </View>
        <View style={styles.streakDivider} />
        <View style={styles.streakBlock}>
          <Text style={styles.streakEmoji}>🏆</Text>
          <View>
            <Text style={styles.streakValue}>{profile.bestStreak}</Text>
            <Text style={styles.streakLabel}>meilleure série</Text>
          </View>
        </View>
        <View style={styles.streakDivider} />
        <View style={styles.streakBlock}>
          <Text style={styles.streakEmoji}>✅</Text>
          <View>
            <Text style={styles.streakValue}>{profile.totalTasksDone}</Text>
            <Text style={styles.streakLabel}>tâches faites</Text>
          </View>
        </View>
      </View>

      {/* Badges */}
      {profile.badges.length > 0 && (
        <View style={styles.badgesSection}>
          <Text style={styles.badgesTitle}>Badges</Text>
          <View style={styles.badgesRow}>
            {earnedBadges.map(b => (
              <BadgeChip key={b.id} badge={b} />
            ))}
            {unearnedBadges.map(b => (
              <BadgeChip key={b.id} badge={b} />
            ))}
          </View>
        </View>
      )}
    </Animated.View>
  );
}

function BadgeChip({ badge }: { badge: Badge }) {
  return (
    <View style={[styles.badgeChip, !badge.earned && styles.badgeChipUnearned]}>
      <Text style={[styles.badgeIcon, !badge.earned && styles.badgeIconUnearned]}>
        {badge.icon}
      </Text>
      <View>
        <Text style={[styles.badgeLabel, !badge.earned && styles.badgeLabelUnearned]}>
          {badge.label}
        </Text>
        <Text style={styles.badgeDesc} numberOfLines={1}>
          {badge.description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 16,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  iconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#FF6B3520',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 14,
  },
  streakBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  streakDivider: {
    width: 1,
    height: 32,
    backgroundColor: theme.colors.border,
  },
  streakEmoji: { fontSize: 20 },
  streakValue: {
    fontSize: 18,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
    lineHeight: 22,
  },
  streakLabel: {
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  badgesSection: { marginTop: 4 },
  badgesTitle: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  badgesRow: { gap: 6 },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.purple + '12',
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.purple + '30',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  badgeChipUnearned: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
  },
  badgeIcon: { fontSize: 22 },
  badgeIconUnearned: { opacity: 0.35 },
  badgeLabel: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
  },
  badgeLabelUnearned: {
    color: theme.colors.textSecondary,
  },
  badgeDesc: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },
});
