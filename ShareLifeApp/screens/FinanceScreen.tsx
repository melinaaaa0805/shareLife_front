import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import api from "../api/api";
import { theme } from "../assets/style/theme";
import {
  BalanceResponse,
  Expense,
  GroupMember,
  Reimbursement,
} from "../types/types";
import { useAuth } from "../context/AuthContext";
import { useGroup } from "../context/GroupContext";
import BalanceSummary from "../components/finance/BalanceSummary";
import ExpenseCard from "../components/finance/ExpenseCard";
import AddExpenseModal from "../components/finance/AddExpenseModal";
import AddReimbursementModal from "../components/finance/AddReimbursementModal";

type Tab = "expenses" | "reimbursements" | "balances";

export default function FinanceScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { currentGroup } = useGroup();
  const groupId = currentGroup?.id ?? "";

  const [tab, setTab] = useState<Tab>("expenses");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
  const [balances, setBalances] = useState<BalanceResponse | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddReimbursement, setShowAddReimbursement] = useState(false);

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    fetchAll();
  }, [groupId]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [membersRes, expensesRes, reimbursementsRes, balancesRes] = await Promise.all([
        api.get(`/group-member/${groupId}`),
        api.get(`/finance/group/${groupId}/expenses`),
        api.get(`/finance/group/${groupId}/reimbursements`),
        api.get(`/finance/group/${groupId}/balances`),
      ]);
      setMembers(membersRes.data ?? []);
      setExpenses(expensesRes.data ?? []);
      setReimbursements(reimbursementsRes.data ?? []);
      setBalances(balancesRes.data ?? null);

      Animated.parallel([
        Animated.timing(headerOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.spring(contentAnim, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
      ]).start();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAll();
  };

  const handleDeleteExpense = (id: string) => {
    Alert.alert("Supprimer", "Supprimer cette dépense définitivement ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/finance/expenses/${id}`);
            fetchAll();
          } catch {
            Alert.alert("Erreur", "Impossible de supprimer la dépense.");
          }
        },
      },
    ]);
  };

  const currentUserId = user?.id ?? "";

  // ── Summary bar ─────────────────────────────────────────────────────────────
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const myExpenses = expenses
    .filter((e) => e.participants.some((p) => p.userId === currentUserId))
    .reduce((s, e) => s + (e.participants.find((p) => p.userId === currentUserId)?.share ?? 0), 0);

  if (!currentGroup) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="wallet-outline" size={48} color={theme.colors.textSecondary} />
        <Text style={styles.emptyText}>Aucun groupe sélectionné</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* ── Header ─── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Finances</Text>
          <Text style={styles.headerSub}>
            {expenses.length} dépense{expenses.length !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      {/* ── Summary pills ─── */}
      <Animated.View style={[styles.summaryRow, { opacity: headerOpacity }]}>
        <View style={styles.summaryPill}>
          <Text style={styles.summaryLabel}>Total dépensé</Text>
          <Text style={styles.summaryValue}>{totalExpenses.toFixed(2)} €</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryPill}>
          <Text style={styles.summaryLabel}>Ma part</Text>
          <Text style={[styles.summaryValue, { color: theme.colors.danger }]}>
            {myExpenses.toFixed(2)} €
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryPill}>
          <Text style={styles.summaryLabel}>Membres</Text>
          <Text style={styles.summaryValue}>{members.length}</Text>
        </View>
      </Animated.View>

      {/* ── Tab bar ─── */}
      <View style={styles.tabBar}>
        {([
          { key: "expenses" as Tab,        label: "Dépenses",        icon: "receipt-outline" as keyof typeof Ionicons.glyphMap },
          { key: "balances" as Tab,        label: "Soldes",          icon: "scale-outline" as keyof typeof Ionicons.glyphMap },
          { key: "reimbursements" as Tab,  label: "Remboursements",  icon: "swap-horizontal-outline" as keyof typeof Ionicons.glyphMap },
        ] as const).map((t) => (
          <Pressable
            key={t.key}
            style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
            onPress={() => setTab(t.key)}
          >
            <Ionicons
              name={t.icon}
              size={16}
              color={tab === t.key ? theme.colors.purple : theme.colors.textSecondary}
            />
            <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ── Content ─── */}
      <Animated.View style={[styles.content, { transform: [{ translateY: contentAnim }] }]}>
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.purple} />
          }
        >
          {loading && (
            <Text style={styles.emptyText}>Chargement…</Text>
          )}

          {!loading && tab === "expenses" && (
            <>
              {expenses.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Ionicons name="receipt-outline" size={40} color={theme.colors.border} />
                  <Text style={styles.emptyText}>Aucune dépense pour ce groupe</Text>
                  <Text style={styles.emptyHint}>Appuyez sur + pour ajouter la première</Text>
                </View>
              ) : (
                expenses.map((expense, i) => (
                  <ExpenseCard
                    key={expense.id}
                    expense={expense}
                    currentUserId={currentUserId}
                    onDelete={handleDeleteExpense}
                    index={i}
                  />
                ))
              )}
            </>
          )}

          {!loading && tab === "balances" && (
            <>
              {balances ? (
                <BalanceSummary data={balances} currentUserId={currentUserId} />
              ) : (
                <View style={styles.emptyBox}>
                  <Ionicons name="scale-outline" size={40} color={theme.colors.border} />
                  <Text style={styles.emptyText}>Aucune donnée de solde</Text>
                </View>
              )}
            </>
          )}

          {!loading && tab === "reimbursements" && (
            <>
              {reimbursements.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Ionicons name="swap-horizontal-outline" size={40} color={theme.colors.border} />
                  <Text style={styles.emptyText}>Aucun remboursement enregistré</Text>
                </View>
              ) : (
                reimbursements.map((r) => (
                  <View key={r.id} style={styles.reimbCard}>
                    <View style={styles.reimbIconBox}>
                      <Ionicons name="swap-horizontal-outline" size={18} color={theme.colors.mint} />
                    </View>
                    <View style={styles.reimbInfo}>
                      <Text style={styles.reimbTitle}>
                        <Text style={r.fromUser?.id === currentUserId ? styles.meText : styles.nameText}>
                          {r.fromUser?.id === currentUserId ? "Toi" : r.fromUser?.firstName ?? "?"}
                        </Text>
                        {" → "}
                        <Text style={r.toUser?.id === currentUserId ? styles.meText : styles.nameText}>
                          {r.toUser?.id === currentUserId ? "toi" : r.toUser?.firstName ?? "?"}
                        </Text>
                      </Text>
                      {r.note && <Text style={styles.reimbNote}>{r.note}</Text>}
                      <Text style={styles.reimbDate}>
                        {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                      </Text>
                    </View>
                    <Text style={styles.reimbAmount}>{r.amount.toFixed(2)} €</Text>
                  </View>
                ))
              )}
            </>
          )}
        </ScrollView>
      </Animated.View>

      {/* ── FABs ─── */}
      <View style={[styles.fabRow, { paddingBottom: insets.bottom + 12 }]}>
        {tab === "reimbursements" ? (
          <Pressable style={[styles.fab, styles.fabMint]} onPress={() => setShowAddReimbursement(true)}>
            <Ionicons name="swap-horizontal-outline" size={20} color={theme.colors.background} />
            <Text style={styles.fabText}>Ajouter un remboursement</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.fab} onPress={() => setShowAddExpense(true)}>
            <Ionicons name="add" size={20} color={theme.colors.background} />
            <Text style={styles.fabText}>Ajouter une dépense</Text>
          </Pressable>
        )}
      </View>

      {/* ── Modals ─── */}
      <AddExpenseModal
        visible={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        onCreated={fetchAll}
        groupId={groupId}
        members={members}
        currentUserId={currentUserId}
      />
      <AddReimbursementModal
        visible={showAddReimbursement}
        onClose={() => setShowAddReimbursement(false)}
        onCreated={fetchAll}
        groupId={groupId}
        members={members}
        currentUserId={currentUserId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },

  // Header
  emptyContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: 10,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerCenter: { alignItems: "center" },
  headerTitle: {
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
  },
  headerSub: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },

  // Summary
  summaryRow: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingVertical: 12,
  },
  summaryPill: { flex: 1, alignItems: "center", gap: 2 },
  summaryDivider: { width: 1, backgroundColor: theme.colors.border },
  summaryLabel: {
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
  },

  // Tabs
  tabBar: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: theme.spacing.sm,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabBtnActive: { borderBottomColor: theme.colors.purple },
  tabLabel: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
  },
  tabLabelActive: {
    color: theme.colors.purple,
    fontFamily: theme.typography.fontFamily.semiBold,
  },

  // Content
  content: { flex: 1 },
  listContent: { padding: theme.spacing.md, gap: theme.spacing.sm, paddingBottom: 80 },

  // Empty
  emptyBox: { alignItems: "center", gap: 12, paddingVertical: 60 },
  emptyText: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  emptyHint: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },

  // Reimbursement card
  reimbCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
  },
  reimbIconBox: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.mint + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  reimbInfo: { flex: 1, gap: 2 },
  reimbTitle: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textPrimary,
  },
  reimbNote: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  reimbDate: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  reimbAmount: {
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.mint,
  },
  meText: {
    color: theme.colors.purple,
    fontFamily: theme.typography.fontFamily.semiBold,
  },
  nameText: {
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.medium,
  },

  // FAB
  fabRow: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing.md,
    paddingTop: 8,
  },
  fab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.colors.purple,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    shadowColor: theme.colors.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  fabMint: {
    backgroundColor: theme.colors.mint,
    shadowColor: theme.colors.mint,
  },
  fabText: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.background,
  },
});
