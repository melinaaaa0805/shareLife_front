import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Pressable,
  Alert,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/api';
import { RootStackParamList, User } from '../types/types';
import { useGroup } from '../context/GroupContext';
import { useAuth } from '../context/AuthContext';
import { useWeek } from '../context/WeekContext';
import { theme } from '../assets/style/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// ─── Types ────────────────────────────────────────────────────────────────────

type WeekTask = {
  id: string;
  title: string;
  weight: number;
  duration?: number | null;
  done: boolean;
  assignedUser: { id: string; firstName: string } | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────


/**
 * Charge mentale = somme sur mes tâches EN COURS de :
 *   poids × (1 + min(durée, 120) / 60)
 *
 * Exemples :
 *  - tâche légère (p=1, 15 min) → 1 × 1.25 = 1.25
 *  - tâche moyenne (p=3, 30 min) → 3 × 1.5  = 4.5
 *  - tâche lourde  (p=5, 60 min) → 5 × 2.0  = 10
 */
function computeMentalLoad(tasks: WeekTask[]): number {
  return tasks.reduce((sum, t) => {
    const dur = Math.min(t.duration ?? 30, 120);
    return sum + (t.weight ?? 1) * (1 + dur / 60);
  }, 0);
}

const LOAD_LEVELS = [
  { max: 3,  label: 'Légère',  color: '#4CAF50' },
  { max: 7,  label: 'Modérée', color: '#8BC34A' },
  { max: 12, label: 'Élevée',  color: '#FFC107' },
  { max: 18, label: 'Lourde',  color: '#FF9800' },
  { max: Infinity, label: 'Intense', color: '#F44336' },
];

function getLoadLevel(score: number) {
  return LOAD_LEVELS.find(l => score <= l.max) ?? LOAD_LEVELS[LOAD_LEVELS.length - 1];
}

// ─── Animated counter ────────────────────────────────────────────────────────

function AnimatedNumber({ value, style }: { value: number; style?: any }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    Animated.timing(anim, { toValue: value, duration: 800, useNativeDriver: false }).start();
    const listener = anim.addListener(({ value: v }) => setDisplay(Math.round(v)));
    return () => anim.removeListener(listener);
  }, [value]);

  return <Text style={style}>{display}</Text>;
}

// ─── Stat card ───────────────────────────────────────────────────────────────

function StatCard({
  icon, label, value, accent, delay,
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
  }, [delay]);

  return (
    <Animated.View style={[styles.statCard, { opacity: opacityAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={[styles.statIconBox, { backgroundColor: accent + '22' }]}>
        <Ionicons name={icon} size={18} color={accent} />
      </View>
      <AnimatedNumber value={value} style={[styles.statValue, { color: accent }]} />
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

// ─── Mental load card ─────────────────────────────────────────────────────────

function MentalLoadCard({ score, delay }: { score: number; delay: number }) {
  const level = getLoadLevel(score);
  const MAX_DISPLAY = 20;
  const pct = Math.min(score / MAX_DISPLAY, 1);

  const slideAnim = useRef(new Animated.Value(16)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 1, duration: 350, delay, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 8, delay }),
      Animated.timing(barAnim, { toValue: pct, duration: 900, delay: delay + 100, useNativeDriver: false }),
    ]).start();
  }, [pct, delay]);

  return (
    <Animated.View style={[styles.loadCard, { opacity: opacityAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.loadTop}>
        <View style={styles.loadLeft}>
          <View style={styles.sectionIconBox}>
            <Ionicons name="barbell-outline" size={14} color={theme.colors.purple} />
          </View>
          <Text style={styles.sectionTitle}>Charge mentale de la semaine</Text>
        </View>
        <View style={[styles.loadBadge, { backgroundColor: level.color + '20', borderColor: level.color + '50' }]}>
          <Text style={[styles.loadBadgeText, { color: level.color }]}>{level.label}</Text>
        </View>
      </View>

      {/* Gauge */}
      <View style={styles.gaugeRow}>
        <View style={styles.gaugeBg}>
          <Animated.View
            style={[
              styles.gaugeFill,
              {
                width: barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                backgroundColor: level.color,
              },
            ]}
          />
        </View>
        <Text style={[styles.gaugeScore, { color: level.color }]}>
          {score.toFixed(1)}
        </Text>
      </View>

      <Text style={styles.loadHint}>
        Somme du poids × durée de toutes tes tâches cette semaine
      </Text>
    </Animated.View>
  );
}

// ─── My tasks progress ───────────────────────────────────────────────────────

function MyTasksProgress({ done, total, delay }: { done: number; total: number; delay: number }) {
  const pct = total > 0 ? done / total : 0;
  const slideAnim = useRef(new Animated.Value(16)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 1, duration: 350, delay, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 8, delay }),
      Animated.timing(barAnim, { toValue: pct, duration: 900, delay: delay + 100, useNativeDriver: false }),
    ]).start();
  }, [pct, delay]);

  return (
    <Animated.View style={[styles.section, { opacity: opacityAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconBox}>
          <Ionicons name="star-outline" size={14} color={theme.colors.purple} />
        </View>
        <Text style={styles.sectionTitle}>Ma progression</Text>
        <Text style={styles.progressFraction}>{done}/{total}</Text>
      </View>
      <View style={styles.progressBarBg}>
        <Animated.View
          style={[
            styles.progressBarFill,
            { width: barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
          ]}
        />
      </View>
      <Text style={styles.progressPct}>
        {total > 0 ? Math.round(pct * 100) : 0}% accompli
      </Text>
    </Animated.View>
  );
}

// ─── Member row ──────────────────────────────────────────────────────────────

function MemberRow({
  member, total, done, index, isOwner,
}: {
  member: User; total: number; done: number; index: number; isOwner: boolean;
}) {
  const barAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pct = total > 0 ? done / total : 0;
  const PALETTE = ['#9B7BEA', '#EAB1CF', '#FFE27A', '#A6D8C0', '#7BC8EA', '#EA9B7B'];
  const color = PALETTE[index % PALETTE.length];

  useEffect(() => {
    const d = 400 + index * 80;
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, delay: d, useNativeDriver: true }),
      Animated.timing(barAnim, { toValue: pct, duration: 700, delay: d, useNativeDriver: false }),
    ]).start();
  }, [pct]);

  return (
    <Animated.View style={[styles.memberRow, { opacity: opacityAnim }]}>
      <View style={[styles.memberAvatar, { backgroundColor: color + '30', borderColor: color + '60' }]}>
        <Text style={[styles.memberInitials, { color }]}>
          {(member.firstName?.[0] ?? '?').toUpperCase()}
        </Text>
      </View>
      <View style={styles.memberInfo}>
        <View style={styles.memberTopRow}>
          <Text style={styles.memberName}>
            {member.firstName ?? member.email}
            {isOwner && <Text style={styles.ownerTag}> · admin</Text>}
          </Text>
          <Text style={styles.memberScore}>{done}/{total}</Text>
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

// ─── Action card ─────────────────────────────────────────────────────────────

function ActionCard({
  icon, label, sub, accent, onPress, delay, badge,
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
  }, [delay]);

  return (
    <Animated.View style={[styles.actionCard, { opacity: opacityAnim, transform: [{ translateY: slideAnim }, { scale }] }]}>
      <Pressable
        style={styles.actionCardInner}
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 60 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }).start()}
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

// ─── Main screen ─────────────────────────────────────────────────────────────

const GroupDashboardScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const isFocused = useIsFocused();
  const { currentGroup } = useGroup();
  const { user } = useAuth();
  const { week, year, goToPrevWeek, goToNextWeek, goToToday, isCurrentWeek } = useWeek();

  const [tasks, setTasks] = useState<WeekTask[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const headerAnim = useRef(new Animated.Value(0)).current;

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
    if (isFocused) {
      headerAnim.setValue(0);
      fetchData();
    }
  }, [isFocused, week, year]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [groupRes, tasksRes] = await Promise.all([
        api.get(`/groups/${currentGroup.id}`),
        api.get(`/tasks/week/${currentGroup.id}/${year}/${week}`),
      ]);
      setMembers(groupRes.data.members || []);
      setTasks(tasksRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }, [loading]);

  const handleResetWeek = () => {
    Alert.alert(
      'Remettre la semaine à zéro',
      `Toutes les tâches de la semaine ${week} seront définitivement supprimées. Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Tout supprimer',
          style: 'destructive',
          onPress: async () => {
            setResetting(true);
            try {
              await api.delete(`/tasks/week/${groupId}/${year}/${week}`);
              await fetchData();
            } catch {
              Alert.alert('Erreur', 'Impossible de réinitialiser la semaine.');
            } finally {
              setResetting(false);
            }
          },
        },
      ],
    );
  };

  // ── Computed stats ───────────────────────────────────────────────────────
  const myTasks       = tasks.filter(t => t.assignedUser?.id === currentUserId);
  const myDone        = myTasks.filter(t => t.done);
  const unassigned    = tasks.filter(t => !t.assignedUser);
  const mentalLoad    = computeMentalLoad(myTasks);
  const isAdmin       = currentGroup.owner?.id === user.id;

  const memberStats = members.map(m => ({
    member: m,
    total: tasks.filter(t => t.assignedUser?.id === m.id).length,
    done:  tasks.filter(t => t.assignedUser?.id === m.id && t.done).length,
  }));

  if (loading) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Chargement…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

      {/* ── Header ── */}
      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.groupName}>{currentGroup.name}</Text>
          <Text style={styles.groupSub}>
            {members.length} membre{members.length > 1 ? 's' : ''}
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

      {/* ── Week nav ── */}
      <View style={styles.weekNav}>
        <Pressable style={styles.weekNavArrow} onPress={goToPrevWeek}>
          <Ionicons name="chevron-back" size={18} color={theme.colors.purple} />
        </Pressable>
        <Pressable onPress={goToToday} style={styles.weekNavCenter}>
          <Text style={styles.weekNavLabel}>
            Semaine {week}{year !== new Date().getFullYear() ? ` · ${year}` : ""}
          </Text>
          {!isCurrentWeek && (
            <View style={styles.backTodayPill}>
              <Text style={styles.backTodayText}>Revenir à aujourd'hui</Text>
            </View>
          )}
        </Pressable>
        <Pressable style={styles.weekNavArrow} onPress={goToNextWeek}>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.purple} />
        </Pressable>
      </View>

      {/* ── 3 stat cards ── */}
      <View style={styles.statsRow}>
        <StatCard
          icon="person-outline"
          label="Mes tâches"
          value={myTasks.length}
          accent={theme.colors.purple}
          delay={80}
        />
        <StatCard
          icon="checkmark-circle-outline"
          label="Terminées"
          value={myDone.length}
          accent={theme.colors.success}
          delay={160}
        />
        <StatCard
          icon="alert-circle-outline"
          label="Non assignées"
          value={unassigned.length}
          accent={theme.colors.warning}
          delay={240}
        />
      </View>

      {/* ── Mental load ── */}
      <MentalLoadCard score={mentalLoad} delay={300} />

      {/* ── My progress ── */}
      {myTasks.length > 0 && (
        <MyTasksProgress done={myDone.length} total={myTasks.length} delay={380} />
      )}

      {/* ── Members leaderboard ── */}
      {memberStats.length > 0 && (
        <Animated.View style={[styles.section, { opacity: headerAnim }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBox}>
              <Ionicons name="people-outline" size={14} color={theme.colors.purple} />
            </View>
            <Text style={styles.sectionTitle}>Contributions</Text>
          </View>
          {memberStats.map(({ member, total, done }, i) => (
            <MemberRow
              key={member.id ?? i}
              member={member}
              total={total}
              done={done}
              index={i}
              isOwner={currentGroup.owner?.id === member.id}
            />
          ))}
        </Animated.View>
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
            sub={`${myTasks.length} assignée${myTasks.length !== 1 ? 's' : ''}`}
            accent={theme.colors.purple}
            onPress={() => navigation.navigate('TasksScreen', { groupId, currentUserId })}
            delay={460}
          />
          <ActionCard
            icon="alert-circle-outline"
            label="Non assignées"
            sub="À prendre en charge"
            accent={theme.colors.warning}
            onPress={() => navigation.navigate('UnassignedTasks', { groupId })}
            delay={520}
            badge={unassigned.length}
          />
          <ActionCard
            icon="people-outline"
            label="Membres"
            sub={`${members.length} personne${members.length !== 1 ? 's' : ''}`}
            accent={theme.colors.mint}
            onPress={() => navigation.navigate('GroupMembers', { groupId })}
            delay={580}
          />
          <ActionCard
            icon="calendar-clear-outline"
            label="Modèle semaine"
            sub="Appliquer le planning type"
            accent={theme.colors.yellow}
            onPress={() => navigation.navigate('WeekTemplate')}
            delay={640}
          />
          {isAdmin && (
            <ActionCard
              icon="person-add-outline"
              label="Inviter"
              sub="Ajouter un membre"
              accent={theme.colors.pink}
              onPress={() => navigation.navigate('AddMember', { groupId })}
              delay={700}
            />
          )}
        </View>
      </View>

      {/* ── Reset week (admin only) ── */}
      {isAdmin && (
        <Pressable
          style={[styles.resetBtn, resetting && styles.resetBtnDisabled]}
          onPress={handleResetWeek}
          disabled={resetting}
        >
          <Ionicons name="trash-outline" size={16} color={theme.colors.danger} />
          <Text style={styles.resetBtnText}>
            {resetting ? 'Suppression…' : 'Remettre la semaine à zéro'}
          </Text>
        </Pressable>
      )}

    </ScrollView>
  );
};

export default GroupDashboardScreen;

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { padding: theme.spacing.md, paddingBottom: 40, gap: theme.spacing.sm },

  emptyContainer: { flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: theme.typography.size.md, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textSecondary },

  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: theme.spacing.sm },
  weekNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: theme.spacing.sm, marginBottom: theme.spacing.sm, borderWidth: 1, borderColor: theme.colors.border },
  weekNavArrow: { width: 34, height: 34, borderRadius: 17, backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  weekNavCenter: { flex: 1, alignItems: 'center', gap: 4 },
  weekNavLabel: { fontSize: theme.typography.size.sm, fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.textPrimary },
  backTodayPill: { backgroundColor: theme.colors.purple + '22', borderRadius: theme.radius.round, paddingHorizontal: 10, paddingVertical: 2 },
  backTodayText: { fontSize: 10, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.purple },
  headerLeft: { flex: 1 },
  groupName: { fontSize: theme.typography.size.xl, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.textPrimary },
  groupSub: { fontSize: theme.typography.size.xs, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textSecondary, marginTop: 3 },
  headerBadges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 140 },
  modeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.colors.pink + '18', borderRadius: theme.radius.round, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: theme.colors.pink + '40' },
  adminBadge: { backgroundColor: theme.colors.yellow + '15', borderColor: theme.colors.yellow + '40' },
  modeBadgeText: { fontSize: 11, fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.pink },

  // Stat cards
  statsRow: { flexDirection: 'row', gap: theme.spacing.sm },
  statCard: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border, gap: 4 },
  statIconBox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statValue: { fontSize: theme.typography.size.xl, fontFamily: theme.typography.fontFamily.bold },
  statLabel: { fontSize: 10, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textSecondary, textAlign: 'center' },

  // Mental load card
  loadCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border },
  loadTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md },
  loadLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loadBadge: { borderRadius: theme.radius.round, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  loadBadgeText: { fontSize: 12, fontFamily: theme.typography.fontFamily.semiBold },
  gaugeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  gaugeBg: { flex: 1, height: 10, backgroundColor: theme.colors.border, borderRadius: 5, overflow: 'hidden' },
  gaugeFill: { height: '100%', borderRadius: 5 },
  gaugeScore: { fontSize: 14, fontFamily: theme.typography.fontFamily.bold, minWidth: 36, textAlign: 'right' },
  loadHint: { fontSize: 11, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textSecondary },

  // My progress
  section: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: theme.spacing.md },
  sectionIconBox: { width: 24, height: 24, borderRadius: 8, backgroundColor: theme.colors.purple + '20', alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { flex: 1, fontSize: theme.typography.size.xs, fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },
  progressFraction: { fontSize: 12, fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.textSecondary },
  progressBarBg: { height: 6, backgroundColor: theme.colors.border, borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progressBarFill: { height: '100%', backgroundColor: theme.colors.purple, borderRadius: 3 },
  progressPct: { fontSize: 11, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.textSecondary, textAlign: 'right' },

  // Members
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  memberAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  memberInitials: { fontSize: 14, fontFamily: theme.typography.fontFamily.bold },
  memberInfo: { flex: 1 },
  memberTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  memberName: { fontSize: theme.typography.size.sm, fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.textPrimary },
  ownerTag: { fontSize: 11, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textSecondary },
  memberScore: { fontSize: 11, fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.textSecondary },
  memberBarBg: { height: 4, backgroundColor: theme.colors.border, borderRadius: 2, overflow: 'hidden' },
  memberBarFill: { height: '100%', borderRadius: 2 },

  // Actions
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  actionCard: { width: '47%', backgroundColor: theme.colors.background, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden' },
  actionCardInner: { padding: 14 },
  actionIconBox: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  actionBadge: { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: theme.colors.warning, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: theme.colors.surface },
  actionBadgeText: { fontSize: 9, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.background },
  actionLabel: { fontSize: theme.typography.size.sm, fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.textPrimary, marginBottom: 3 },
  actionSub: { fontSize: 11, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textSecondary },

  // Reset week
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.danger + '50',
    backgroundColor: theme.colors.danger + '0C',
  },
  resetBtnDisabled: { opacity: 0.5 },
  resetBtnText: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.danger,
  },
});
