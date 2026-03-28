import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Pressable,
  Platform,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/api';
import { RootStackParamList, Task, User } from '../types/types';
import { useGroup } from '../context/GroupContext';
import { useAuth } from '../context/AuthContext';
import { theme } from '../assets/style/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// ─── Animated counter ────────────────────────────────────────────────────────

function AnimatedNumber({ value, style }: { value: number; style?: any }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value,
      duration: 900,
      useNativeDriver: false,
    }).start();
    const listener = anim.addListener(({ value: v }) => setDisplay(Math.round(v)));
    return () => anim.removeListener(listener);
  }, [value]);

  return <Text style={style}>{display}</Text>;
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  accent,
  delay,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  accent: string;
  delay: number;
}) {
  const slideAnim = useRef(new Animated.Value(20)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 1, duration: 350, delay, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 8, delay }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[styles.statCard, { opacity: opacityAnim, transform: [{ translateY: slideAnim }] }]}
    >
      <View style={[styles.statIconBox, { backgroundColor: accent + '22' }]}>
        <Ionicons name={icon} size={18} color={accent} />
      </View>
      <AnimatedNumber value={value} style={[styles.statValue, { color: accent }]} />
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

// ─── Action button ────────────────────────────────────────────────────────────

function ActionCard({
  icon,
  label,
  sub,
  accent,
  onPress,
  delay,
  badge,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub?: string;
  accent: string;
  onPress: () => void;
  delay: number;
  badge?: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, delay, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 8, delay }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.actionCard,
        { opacity: opacityAnim, transform: [{ translateY: slideAnim }, { scale }] },
      ]}
    >
      <Pressable
        style={styles.actionCardInner}
        onPress={onPress}
        onPressIn={() =>
          Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 60 }).start()
        }
        onPressOut={() =>
          Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }).start()
        }
      >
        <View style={[styles.actionIconBox, { backgroundColor: accent + '20' }]}>
          <Ionicons name={icon} size={22} color={accent} />
          {badge != null && badge > 0 && (
            <View style={styles.actionBadge}>
              <Text style={styles.actionBadgeText}>{badge > 99 ? '99+' : badge}</Text>
            </View>
          )}
        </View>
        <Text style={styles.actionLabel}>{label}</Text>
        {sub && <Text style={styles.actionSub}>{sub}</Text>}
      </Pressable>
    </Animated.View>
  );
}

// ─── Member row ───────────────────────────────────────────────────────────────

function MemberRow({
  member,
  total,
  done,
  index,
  isOwner,
}: {
  member: User;
  total: number;
  done: number;
  index: number;
  isOwner: boolean;
}) {
  const barAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pct = total > 0 ? done / total : 0;

  useEffect(() => {
    const delay = 400 + index * 80;
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, delay, useNativeDriver: true }),
      Animated.timing(barAnim, { toValue: pct, duration: 700, delay, useNativeDriver: false }),
    ]).start();
  }, [pct]);

  const initials = (member.firstName?.[0] ?? '?').toUpperCase();
  const PALETTE = ['#9B7BEA', '#EAB1CF', '#FFE27A', '#A6D8C0', '#7BC8EA', '#EA9B7B'];
  const color = PALETTE[index % PALETTE.length];

  return (
    <Animated.View style={[styles.memberRow, { opacity: opacityAnim }]}>
      <View style={[styles.memberAvatar, { backgroundColor: color + '30', borderColor: color + '60' }]}>
        <Text style={[styles.memberInitials, { color }]}>{initials}</Text>
      </View>
      <View style={styles.memberInfo}>
        <View style={styles.memberTopRow}>
          <Text style={styles.memberName}>
            {member.firstName ?? member.email}
            {isOwner && (
              <Text style={styles.ownerTag}> · admin</Text>
            )}
          </Text>
          <Text style={styles.memberScore}>
            {done}/{total}
          </Text>
        </View>
        <View style={styles.memberBarBg}>
          <Animated.View
            style={[
              styles.memberBarFill,
              {
                width: barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                backgroundColor: color,
              },
            ]}
          />
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

const GroupDashboardScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const isFocused = useIsFocused();
  const { currentGroup } = useGroup();
  const { user } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;

  if (!currentGroup || !user) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="people-outline" size={48} color={theme.colors.textSecondary} />
        <Text style={styles.emptyText}>Aucun groupe sélectionné</Text>
      </View>
    );
  }

  const groupId = currentGroup.id;
  const currentUserId = user.id;

  useEffect(() => {
    if (isFocused) fetchGroup();
  }, [isFocused]);

  const fetchGroup = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/groups/${currentGroup.id}`);
      setTasks(res.data.tasks || []);
      setMembers(res.data.members || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const completedCount = tasks.filter(t => t.done).length;
  const unassignedCount = tasks.filter(t => !t.assignedUser).length;
  const myTasks = tasks.filter(t => t.assignedUser?.id === currentUserId);
  const myDoneCount = myTasks.filter(t => t.done).length;
  const totalTasks = tasks.length;
  const completedPct = totalTasks ? completedCount / totalTasks : 0;
  const isAdmin = currentGroup.owner?.id === user.id;

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(progressWidth, {
          toValue: completedPct,
          duration: 1000,
          delay: 300,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [loading]);

  // Per-member stats from tasks
  const memberStats = members.map(m => {
    const assigned = tasks.filter(t => t.assignedUser?.id === (m as any).userId ?? m.id);
    const done = assigned.filter(t => t.done).length;
    return { member: m, total: assigned.length, done };
  });

  if (loading) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Chargement…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.groupName}>{currentGroup.name}</Text>
          <Text style={styles.groupSub}>
            {members.length} membre{members.length > 1 ? 's' : ''} · Semaine en cours
          </Text>
        </View>
        <View style={styles.headerBadges}>
          {currentGroup.mode === 'FUNNY' && (
            <View style={styles.modeBadge}>
              <Ionicons name="color-wand-outline" size={12} color={theme.colors.pink} />
              <Text style={styles.modeBadgeText}>Drôle</Text>
            </View>
          )}
          {isAdmin && (
            <View style={[styles.modeBadge, styles.adminBadge]}>
              <Ionicons name="shield-checkmark-outline" size={12} color={theme.colors.yellow} />
              <Text style={[styles.modeBadgeText, { color: theme.colors.yellow }]}>Admin</Text>
            </View>
          )}
        </View>
      </Animated.View>

      {/* ── Progress card ── */}
      <Animated.View style={[styles.progressCard, { opacity: headerAnim }]}>
        <View style={styles.progressTop}>
          <View>
            <Text style={styles.progressTitle}>Progression de la semaine</Text>
            <Text style={styles.progressSub}>
              {completedCount} tâche{completedCount > 1 ? 's' : ''} terminée{completedCount > 1 ? 's' : ''} sur {totalTasks}
            </Text>
          </View>
          <View style={styles.progressPctBox}>
            <AnimatedNumber
              value={Math.round(completedPct * 100)}
              style={styles.progressPct}
            />
            <Text style={styles.progressPctSign}>%</Text>
          </View>
        </View>
        <View style={styles.progressBarBg}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progressWidth.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </Animated.View>

      {/* ── Stat cards ── */}
      <View style={styles.statsRow}>
        <StatCard
          icon="checkmark-circle-outline"
          label="Terminées"
          value={completedCount}
          accent={theme.colors.success}
          delay={100}
        />
        <StatCard
          icon="person-outline"
          label="Mes tâches"
          value={myTasks.length}
          accent={theme.colors.purple}
          delay={180}
        />
        <StatCard
          icon="alert-circle-outline"
          label="Non assignées"
          value={unassignedCount}
          accent={theme.colors.warning}
          delay={260}
        />
      </View>

      {/* ── My tasks recap ── */}
      {myTasks.length > 0 && (
        <Animated.View style={[styles.section, { opacity: headerAnim }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBox}>
              <Ionicons name="star-outline" size={14} color={theme.colors.purple} />
            </View>
            <Text style={styles.sectionTitle}>Mes tâches cette semaine</Text>
          </View>
          <View style={styles.myTasksBarBg}>
            <Animated.View
              style={[
                styles.myTasksBarFill,
                {
                  width: progressWidth.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.myTasksSub}>
            {myDoneCount}/{myTasks.length} · {myTasks.length > 0 ? Math.round((myDoneCount / myTasks.length) * 100) : 0}% accompli
          </Text>
        </Animated.View>
      )}

      {/* ── Members leaderboard ── */}
      {memberStats.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBox}>
              <Ionicons name="people-outline" size={14} color={theme.colors.purple} />
            </View>
            <Text style={styles.sectionTitle}>Contributions</Text>
          </View>
          {memberStats.map(({ member, total, done }, i) => (
            <MemberRow
              key={(member as any).userId ?? member.id ?? i}
              member={member}
              total={total}
              done={done}
              index={i}
              isOwner={currentGroup.owner?.id === ((member as any).userId ?? member.id)}
            />
          ))}
        </View>
      )}

      {/* ── Quick actions ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconBox}>
            <Ionicons name="flash-outline" size={14} color={theme.colors.purple} />
          </View>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
        </View>
        <View style={styles.actionsGrid}>
          <ActionCard
            icon="checkbox-outline"
            label="Mes tâches"
            sub={`${myTasks.length} assignée${myTasks.length > 1 ? 's' : ''}`}
            accent={theme.colors.purple}
            onPress={() => navigation.navigate('TasksScreen', { groupId, currentUserId })}
            delay={300}
          />
          <ActionCard
            icon="alert-circle-outline"
            label="Non assignées"
            sub="À prendre en charge"
            accent={theme.colors.warning}
            onPress={() => navigation.navigate('UnassignedTasks', { groupId })}
            delay={360}
            badge={unassignedCount}
          />
          <ActionCard
            icon="people-outline"
            label="Membres"
            sub={`${members.length} personne${members.length > 1 ? 's' : ''}`}
            accent={theme.colors.mint}
            onPress={() => navigation.navigate('GroupMembers', { groupId })}
            delay={420}
          />
          {isAdmin && (
            <ActionCard
              icon="person-add-outline"
              label="Inviter"
              sub="Ajouter un membre"
              accent={theme.colors.pink}
              onPress={() => navigation.navigate('AddMember', { groupId })}
              delay={480}
            />
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default GroupDashboardScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    padding: theme.spacing.md,
    paddingBottom: 40,
    gap: theme.spacing.sm,
  },

  emptyContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  headerLeft: { flex: 1 },
  groupName: {
    fontSize: theme.typography.size.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
  },
  groupSub: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginTop: 3,
  },
  headerBadges: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    maxWidth: 140,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.pink + '18',
    borderRadius: theme.radius.round,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: theme.colors.pink + '40',
  },
  adminBadge: {
    backgroundColor: theme.colors.yellow + '15',
    borderColor: theme.colors.yellow + '40',
  },
  modeBadgeText: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.pink,
  },

  // Progress card
  progressCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  progressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  progressTitle: {
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
  },
  progressSub: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginTop: 3,
  },
  progressPctBox: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  progressPct: {
    fontSize: 36,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.purple,
    lineHeight: 40,
  },
  progressPctSign: {
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.purple,
    marginBottom: 4,
    marginLeft: 2,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.round,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.purple,
    borderRadius: theme.radius.round,
  },

  // Stat cards row
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 4,
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: theme.typography.size.xl,
    fontFamily: theme.typography.fontFamily.bold,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },

  // Section
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  sectionIconBox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: theme.colors.purple + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // My tasks bar
  myTasksBarBg: {
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  myTasksBarFill: {
    height: '100%',
    backgroundColor: theme.colors.purple,
    borderRadius: 3,
  },
  myTasksSub: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
  },

  // Members
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  memberInitials: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.bold,
  },
  memberInfo: { flex: 1 },
  memberTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  memberName: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
  },
  ownerTag: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  memberScore: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textSecondary,
  },
  memberBarBg: {
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  memberBarFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Actions grid
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  actionCard: {
    width: '47%',
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  actionCardInner: {
    padding: 14,
  },
  actionIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  actionBadgeText: {
    fontSize: 9,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.background,
  },
  actionLabel: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
    marginBottom: 3,
  },
  actionSub: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
});
