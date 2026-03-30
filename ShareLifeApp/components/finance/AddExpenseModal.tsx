import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../../api/api";
import { theme } from "../../assets/style/theme";
import { ExpenseCategory, GroupMember, SplitMode } from "../../types/types";

const CATEGORIES: { value: ExpenseCategory; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { value: "FOOD",      label: "Alimentation", icon: "fast-food-outline",         color: theme.colors.yellow },
  { value: "TRANSPORT", label: "Transport",    icon: "car-outline",               color: "#7BC4EA" },
  { value: "HOUSING",   label: "Logement",     icon: "home-outline",              color: theme.colors.mint },
  { value: "UTILITIES", label: "Charges",      icon: "flash-outline",             color: theme.colors.warning },
  { value: "LEISURE",   label: "Loisirs",      icon: "game-controller-outline",   color: theme.colors.pink },
  { value: "HEALTH",    label: "Santé",        icon: "medkit-outline",            color: theme.colors.success },
  { value: "OTHER",     label: "Autre",        icon: "ellipsis-horizontal-outline", color: theme.colors.textSecondary },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
  groupId: string;
  members: GroupMember[];
  currentUserId: string;
}

export default function AddExpenseModal({
  visible, onClose, onCreated, groupId, members, currentUserId,
}: Props) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("OTHER");
  const [splitMode, setSplitMode] = useState<SplitMode>("EQUAL");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(members.map((m) => m.id))
  );
  const [customShares, setCustomShares] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setTitle("");
    setAmount("");
    setCategory("OTHER");
    setSplitMode("EQUAL");
    setDate(new Date().toISOString().split("T")[0]);
    setSelectedIds(new Set(members.map((m) => m.id)));
    setCustomShares({});
  };

  const toggleMember = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    const amountNum = parseFloat(amount.replace(",", "."));
    if (!title.trim()) return Alert.alert("Erreur", "Le nom est requis.");
    if (isNaN(amountNum) || amountNum <= 0) return Alert.alert("Erreur", "Montant invalide.");
    if (selectedIds.size === 0) return Alert.alert("Erreur", "Au moins un participant requis.");

    const participants = Array.from(selectedIds).map((userId) => {
      const entry: { userId: string; share?: number } = { userId };
      if (splitMode === "CUSTOM") {
        const s = parseFloat((customShares[userId] ?? "0").replace(",", "."));
        entry.share = isNaN(s) ? 0 : s;
      }
      return entry;
    });

    setLoading(true);
    try {
      await api.post(`/finance/group/${groupId}/expenses`, {
        title: title.trim(),
        amount: amountNum,
        category,
        splitMode,
        date,
        participants,
      });
      reset();
      onCreated();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Erreur lors de la création.";
      Alert.alert("Erreur", Array.isArray(msg) ? msg.join("\n") : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Nouvelle dépense</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={theme.colors.textPrimary} />
          </Pressable>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Title */}
          <View style={styles.field}>
            <Text style={styles.label}>Nom de la dépense</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Ex: Courses Lidl"
              placeholderTextColor={theme.colors.textSecondary}
              returnKeyType="next"
            />
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

          {/* Date */}
          <View style={styles.field}>
            <Text style={styles.label}>Date</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="AAAA-MM-JJ"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          {/* Category */}
          <View style={styles.field}>
            <Text style={styles.label}>Catégorie</Text>
            <View style={styles.catGrid}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.value}
                  style={[styles.catBtn, category === cat.value && { backgroundColor: cat.color + "25", borderColor: cat.color }]}
                  onPress={() => setCategory(cat.value)}
                >
                  <Ionicons name={cat.icon} size={16} color={category === cat.value ? cat.color : theme.colors.textSecondary} />
                  <Text style={[styles.catLabel, category === cat.value && { color: cat.color }]}>
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Split mode */}
          <View style={styles.field}>
            <View style={styles.rowBetween}>
              <Text style={styles.label}>Répartition personnalisée</Text>
              <Switch
                value={splitMode === "CUSTOM"}
                onValueChange={(v) => setSplitMode(v ? "CUSTOM" : "EQUAL")}
                trackColor={{ false: theme.colors.border, true: theme.colors.purple + "70" }}
                thumbColor={splitMode === "CUSTOM" ? theme.colors.purple : theme.colors.textSecondary}
              />
            </View>
            {splitMode === "EQUAL" && (
              <Text style={styles.hint}>Le montant sera divisé équitablement entre les participants.</Text>
            )}
          </View>

          {/* Participants */}
          <View style={styles.field}>
            <Text style={styles.label}>Participants</Text>
            {members.map((m) => {
              const selected = selectedIds.has(m.id);
              return (
                <View key={m.id} style={styles.memberRow}>
                  <Pressable
                    style={[styles.memberCheck, selected && styles.memberCheckOn]}
                    onPress={() => toggleMember(m.id)}
                  >
                    <Ionicons
                      name={selected ? "checkmark" : ""}
                      size={14}
                      color={theme.colors.textPrimary}
                    />
                  </Pressable>
                  <Text style={[styles.memberName, !selected && styles.memberNameOff]}>
                    {m.id === currentUserId ? "Toi" : m.firstName}
                  </Text>
                  {splitMode === "CUSTOM" && selected && (
                    <TextInput
                      style={styles.shareInput}
                      value={customShares[m.id] ?? ""}
                      onChangeText={(v) => setCustomShares((p) => ({ ...p, [m.id]: v }))}
                      placeholder="0.00"
                      placeholderTextColor={theme.colors.textSecondary}
                      keyboardType="decimal-pad"
                    />
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* CTA */}
        <View style={styles.footer}>
          <Pressable
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Ionicons name="add-circle-outline" size={18} color={theme.colors.background} />
            <Text style={styles.submitText}>
              {loading ? "Enregistrement…" : "Ajouter la dépense"}
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
    fontSize: theme.typography.size.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
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
  hint: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginTop: 2,
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
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.round,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  catLabel: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
  },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  memberRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
  memberCheck: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  memberCheckOn: { backgroundColor: theme.colors.purple, borderColor: theme.colors.purple },
  memberName: {
    flex: 1,
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textPrimary,
  },
  memberNameOff: { color: theme.colors.textSecondary },
  shareInput: {
    width: 80,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textPrimary,
    textAlign: "right",
  },
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
    backgroundColor: theme.colors.purple,
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
