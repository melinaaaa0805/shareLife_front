import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../../api/api";
import { theme } from "../../assets/style/theme";
import { GroupMember } from "../../types/types";

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
  groupId: string;
  members: GroupMember[];
  currentUserId: string;
}

export default function AddReimbursementModal({
  visible, onClose, onCreated, groupId, members, currentUserId,
}: Props) {
  const [toUserId, setToUserId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setToUserId(null);
    setAmount("");
    setNote("");
  };

  const handleSubmit = async () => {
    const amountNum = parseFloat(amount.replace(",", "."));
    if (!toUserId) return Alert.alert("Erreur", "Choisissez un destinataire.");
    if (isNaN(amountNum) || amountNum <= 0) return Alert.alert("Erreur", "Montant invalide.");

    setLoading(true);
    try {
      await api.post(`/finance/group/${groupId}/reimbursements`, {
        toUserId,
        amount: amountNum,
        note: note.trim() || undefined,
      });
      reset();
      onCreated();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Erreur lors de l'enregistrement.";
      Alert.alert("Erreur", Array.isArray(msg) ? msg.join("\n") : msg);
    } finally {
      setLoading(false);
    }
  };

  // Members excluding current user (you can't reimburse yourself)
  const targets = members.filter((m) => m.id !== currentUserId);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Enregistrer un remboursement</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={theme.colors.textPrimary} />
          </Pressable>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          {/* Recipient */}
          <View style={styles.field}>
            <Text style={styles.label}>J'ai remboursé</Text>
            <View style={styles.memberList}>
              {targets.map((m) => (
                <Pressable
                  key={m.id}
                  style={[styles.memberBtn, toUserId === m.id && styles.memberBtnOn]}
                  onPress={() => setToUserId(m.id)}
                >
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberInitial}>
                      {(m.firstName?.[0] ?? "?").toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[styles.memberName, toUserId === m.id && styles.memberNameOn]}>
                    {m.firstName}
                  </Text>
                  {toUserId === m.id && (
                    <Ionicons name="checkmark-circle" size={18} color={theme.colors.purple} />
                  )}
                </Pressable>
              ))}
            </View>
          </View>

          {/* Amount */}
          <View style={styles.field}>
            <Text style={styles.label}>Montant (€)</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="decimal-pad"
              returnKeyType="done"
            />
          </View>

          {/* Note */}
          <View style={styles.field}>
            <Text style={styles.label}>Note (optionnel)</Text>
            <TextInput
              style={styles.input}
              value={note}
              onChangeText={setNote}
              placeholder="Ex: virement du 30 mars"
              placeholderTextColor={theme.colors.textSecondary}
              returnKeyType="done"
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Ionicons name="swap-horizontal-outline" size={18} color={theme.colors.background} />
            <Text style={styles.submitText}>
              {loading ? "Enregistrement…" : "Enregistrer le remboursement"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
    flex: 1,
    paddingRight: theme.spacing.sm,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { flex: 1 },
  scrollContent: { padding: theme.spacing.md, gap: theme.spacing.md, paddingBottom: 20 },
  field: { gap: 8 },
  label: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textPrimary,
  },
  memberList: { gap: 6 },
  memberBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  memberBtnOn: { borderColor: theme.colors.purple, backgroundColor: theme.colors.purple + "15" },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  memberInitial: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
  },
  memberName: {
    flex: 1,
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
  },
  memberNameOn: { color: theme.colors.textPrimary },
  footer: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.colors.mint,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.background,
  },
});
