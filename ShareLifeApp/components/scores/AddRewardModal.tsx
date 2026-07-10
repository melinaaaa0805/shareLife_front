import React, { useState } from "react";
import {
  Alert,
  Modal,
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
import { RewardAssignee } from "../../types/types";

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
  groupId: string;
}

const ASSIGNEE_OPTIONS: {
  value: RewardAssignee;
  label: string;
  sub: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}[] = [
  {
    value: "WINNER",
    label: "Gagnant",
    sub: "Le meilleur score de la période",
    icon: "trophy",
    color: theme.colors.yellow,
  },
  {
    value: "LOSER",
    label: "Dernier",
    sub: "Le score le plus bas de la période",
    icon: "skull-outline",
    color: theme.colors.danger,
  },
];

export default function AddRewardModal({ visible, onClose, onCreated, groupId }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState<RewardAssignee>("WINNER");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setTitle("");
    setDescription("");
    setAssignedTo("WINNER");
  };

  const handleSubmit = async () => {
    if (!title.trim()) return Alert.alert("Erreur", "Le titre est requis.");
    setLoading(true);
    try {
      await api.post(`/scores/group/${groupId}/rewards`, {
        title: title.trim(),
        description: description.trim() || undefined,
        assignedTo,
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
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Nouvelle récompense</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={theme.colors.textPrimary} />
          </Pressable>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          {/* Title */}
          <View style={styles.field}>
            <Text style={styles.label}>Titre</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder='Ex: "Le gagnant choisit le film"'
              placeholderTextColor={theme.colors.textSecondary}
              returnKeyType="next"
            />
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={styles.label}>Description (optionnel)</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={description}
              onChangeText={setDescription}
              placeholder="Précisions sur la récompense…"
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              returnKeyType="done"
            />
          </View>

          {/* Assignee */}
          <View style={styles.field}>
            <Text style={styles.label}>Attribuée à</Text>
            {ASSIGNEE_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={[
                  styles.optionBtn,
                  assignedTo === opt.value && {
                    borderColor: opt.color,
                    backgroundColor: opt.color + "15",
                  },
                ]}
                onPress={() => setAssignedTo(opt.value)}
              >
                <View style={[styles.optionIcon, { backgroundColor: opt.color + "20" }]}>
                  <Ionicons name={opt.icon} size={20} color={opt.color} />
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, assignedTo === opt.value && { color: opt.color }]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.optionSub}>{opt.sub}</Text>
                </View>
                {assignedTo === opt.value && (
                  <Ionicons name="checkmark-circle" size={20} color={opt.color} />
                )}
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Ionicons name="gift-outline" size={18} color={theme.colors.background} />
            <Text style={styles.submitText}>
              {loading ? "Enregistrement…" : "Créer la récompense"}
            </Text>
          </Pressable>
        </View>
      </View>
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
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: theme.colors.surface,
    borderWidth: 1, borderColor: theme.colors.border,
    alignItems: "center", justifyContent: "center",
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
    borderWidth: 1, borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textPrimary,
  },
  inputMulti: { minHeight: 80, textAlignVertical: "top", paddingTop: 12 },
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  optionIcon: {
    width: 40, height: 40, borderRadius: theme.radius.sm,
    alignItems: "center", justifyContent: "center",
  },
  optionText: { flex: 1 },
  optionLabel: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
  },
  optionSub: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  footer: {
    padding: theme.spacing.md,
    borderTopWidth: 1, borderTopColor: theme.colors.border,
  },
  submitBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: theme.colors.purple,
    borderRadius: theme.radius.md, paddingVertical: 14,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.background,
  },
});
