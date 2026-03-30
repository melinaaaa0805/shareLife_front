import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../assets/style/theme";
import { BalanceResponse, DebtEdge, MemberBalance } from "../../types/types";

interface Props {
  data: BalanceResponse;
  currentUserId: string;
}

function BalanceRow({ balance, currentUserId }: { balance: MemberBalance; currentUserId: string }) {
  const isMe = balance.userId === currentUserId;
  const positive = balance.netBalance >= 0;
  const color = positive ? theme.colors.success : theme.colors.danger;

  return (
    <View style={[styles.balanceRow, isMe && styles.balanceRowMe]}>
      <View style={styles.balanceAvatar}>
        <Text style={styles.balanceInitial}>
          {(balance.firstName?.[0] ?? "?").toUpperCase()}
        </Text>
      </View>
      <View style={styles.balanceInfo}>
        <Text style={styles.balanceName}>
          {isMe ? "Toi" : balance.firstName}
          {isMe && <Text style={styles.meBadge}> · moi</Text>}
        </Text>
        <Text style={styles.balanceSub}>
          payé {balance.totalPaid.toFixed(2)} € · doit {balance.totalOwed.toFixed(2)} €
        </Text>
      </View>
      <View style={[styles.netBadge, { backgroundColor: color + "18" }]}>
        <Text style={[styles.netAmount, { color }]}>
          {positive ? "+" : ""}{balance.netBalance.toFixed(2)} €
        </Text>
      </View>
    </View>
  );
}

function DebtRow({ debt, currentUserId }: { debt: DebtEdge; currentUserId: string }) {
  const isMeDebtor = debt.fromUserId === currentUserId;
  const isMeCreditor = debt.toUserId === currentUserId;

  return (
    <View style={styles.debtRow}>
      <Ionicons name="arrow-forward-outline" size={14} color={theme.colors.textSecondary} />
      <Text style={styles.debtText}>
        <Text style={isMeDebtor ? styles.debtMe : styles.debtName}>
          {isMeDebtor ? "Toi" : debt.fromFirstName}
        </Text>
        {" doit "}
        <Text style={[styles.debtAmount, { color: theme.colors.danger }]}>
          {debt.amount.toFixed(2)} €
        </Text>
        {" à "}
        <Text style={isMeCreditor ? styles.debtMe : styles.debtName}>
          {isMeCreditor ? "toi" : debt.toFirstName}
        </Text>
      </Text>
    </View>
  );
}

export default function BalanceSummary({ data, currentUserId }: Props) {
  const hasDebts = data.simplifiedDebts.length > 0;

  return (
    <View style={styles.container}>
      {/* Balances */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <Ionicons name="scale-outline" size={14} color={theme.colors.purple} />
          </View>
          <Text style={styles.sectionTitle}>Soldes</Text>
        </View>
        {data.balances.map((b) => (
          <BalanceRow key={b.userId} balance={b} currentUserId={currentUserId} />
        ))}
      </View>

      {/* Simplified debts */}
      {hasDebts && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="swap-horizontal-outline" size={14} color={theme.colors.purple} />
            </View>
            <Text style={styles.sectionTitle}>Remboursements suggérés</Text>
          </View>
          {data.simplifiedDebts.map((d, i) => (
            <DebtRow key={i} debt={d} currentUserId={currentUserId} />
          ))}
        </View>
      )}

      {!hasDebts && (
        <View style={styles.settled}>
          <Ionicons name="checkmark-circle-outline" size={18} color={theme.colors.success} />
          <Text style={styles.settledText}>Tout est à jour !</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
  },
  section: { padding: theme.spacing.md, gap: theme.spacing.sm },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  sectionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.purple + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
  },

  // Balance row
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: theme.radius.sm,
  },
  balanceRowMe: { backgroundColor: theme.colors.purple + "0D" },
  balanceAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  balanceInitial: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
  },
  balanceInfo: { flex: 1 },
  balanceName: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
  },
  meBadge: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.purple,
  },
  balanceSub: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  netBadge: {
    borderRadius: theme.radius.round,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  netAmount: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.bold,
  },

  // Debt row
  debtRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 5,
  },
  debtText: {
    flex: 1,
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    flexWrap: "wrap",
  },
  debtName: { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily.medium },
  debtMe: { color: theme.colors.purple, fontFamily: theme.typography.fontFamily.semiBold },
  debtAmount: { fontFamily: theme.typography.fontFamily.semiBold },

  // Settled
  settled: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: theme.spacing.md,
    paddingTop: 0,
  },
  settledText: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.success,
  },
});
