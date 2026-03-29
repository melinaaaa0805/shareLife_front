import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../api/api";
import { useGroup } from "../context/GroupContext";
import { useWeek } from "../context/WeekContext";
import { theme } from "../assets/style/theme";

// ─── Types ────────────────────────────────────────────────────────────────────

type ShoppingItem = {
  name: string;
  quantity: string;
  _done?: boolean; // local only
  _key: string;   // local key for animations
};

type ShoppingList = {
  id: string;
  weekNumber: number;
  year?: number;
  items: { name: string; quantity: string }[];
};

// ─── Utils ────────────────────────────────────────────────────────────────────

function makeKey() {
  return Math.random().toString(36).slice(2);
}

// ─── Item row ─────────────────────────────────────────────────────────────────

function ItemRow({
  item,
  index,
  onToggle,
  onDelete,
}: {
  item: ShoppingItem;
  index: number;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const deleteScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
        delay: index * 40,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
        delay: index * 40,
      }),
    ]).start();
  }, []);

  const handleDelete = () => {
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -20, duration: 200, useNativeDriver: true }),
    ]).start(onDelete);
  };

  return (
    <Animated.View
      style={[
        styles.itemRow,
        item._done && styles.itemRowDone,
        { opacity: opacityAnim, transform: [{ translateX: slideAnim }] },
      ]}
    >
      {/* Checkbox */}
      <TouchableOpacity style={styles.checkboxBtn} onPress={onToggle} activeOpacity={0.7}>
        <View style={[styles.checkbox, item._done && styles.checkboxChecked]}>
          {item._done && <Ionicons name="checkmark" size={12} color="#FFF" />}
        </View>
      </TouchableOpacity>

      {/* Name */}
      <Text
        style={[styles.itemName, item._done && styles.itemNameDone]}
        numberOfLines={1}
      >
        {item.name}
      </Text>

      {/* Quantity */}
      <View style={[styles.qtyChip, item._done && styles.qtyChipDone]}>
        <Text style={[styles.qtyText, item._done && styles.qtyTextDone]}>
          {item.quantity || "1"}
        </Text>
      </View>

      {/* Delete */}
      <Animated.View style={{ transform: [{ scale: deleteScale }] }}>
        <Pressable
          style={styles.deleteBtn}
          onPress={handleDelete}
          onPressIn={() =>
            Animated.spring(deleteScale, { toValue: 0.85, useNativeDriver: true, speed: 60 }).start()
          }
          onPressOut={() =>
            Animated.spring(deleteScale, { toValue: 1, useNativeDriver: true, speed: 40 }).start()
          }
        >
          <Ionicons name="trash-outline" size={15} color={theme.colors.danger} />
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ShoppingListScreen() {
  const { currentGroup } = useGroup();
  const groupId = currentGroup?.id;
  const { week: currentWeek, year, goToPrevWeek, goToNextWeek, goToToday, isCurrentWeek } = useWeek();

  const [listId, setListId] = useState<string | null>(null);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Input state
  const [newName, setNewName] = useState("");
  const [newQty, setNewQty] = useState("1");
  const [nameFocused, setNameFocused] = useState(false);

  // Historique des articles habituels
  const [history, setHistory] = useState<string[]>([]);

  // Animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const inputSlide = useRef(new Animated.Value(80)).current;
  const addBtnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(inputSlide, { toValue: 0, useNativeDriver: true, tension: 70, friction: 9, delay: 200 }),
    ]).start();
  }, []);

  const historyKey = `@sharelife_history_${groupId}`;

  useEffect(() => {
    if (!groupId) return;
    AsyncStorage.getItem(historyKey)
      .then(v => { if (v) setHistory(JSON.parse(v)); })
      .catch(() => {});
  }, [groupId]);

  const saveToHistory = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...history.filter(h => h.toLowerCase() !== trimmed.toLowerCase())].slice(0, 30);
    setHistory(updated);
    AsyncStorage.setItem(historyKey, JSON.stringify(updated)).catch(() => {});
  };

  useFocusEffect(
    useCallback(() => {
      if (groupId) fetchList();
    }, [groupId, currentWeek, year])
  );

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/shopping-lists/${groupId}`);
      const lists: ShoppingList[] = res.data;
      console.log("[ShoppingList] listes reçues:", JSON.stringify(lists.map(l => ({ id: l.id, week: l.weekNumber, year: l.year, items: l.items.length }))));
      console.log("[ShoppingList] cherche semaine:", currentWeek, "année:", year);
      const current = lists.find(l => l.weekNumber === currentWeek && l.year === year)
        ?? lists.find(l => l.weekNumber === currentWeek);
      console.log("[ShoppingList] liste trouvée:", current ? `id=${current.id}, year=${current.year}, ${current.items.length} items` : "aucune");
      if (current) {
        setListId(current.id);
        setItems(current.items.map(i => ({ ...i, _done: false, _key: makeKey() })));
      } else {
        setListId(null);
        setItems([]);
      }
      Animated.timing(statsAnim, { toValue: 1, duration: 300, useNativeDriver: true, delay: 100 }).start();
    } catch (e) {
      console.error("Erreur chargement liste", e);
    } finally {
      setLoading(false);
    }
  };

  const syncToBackend = useCallback(
    async (updatedItems: ShoppingItem[]) => {
      if (!groupId) return;
      const payload = updatedItems.map(({ name, quantity }) => ({ name, quantity }));
      setSaving(true);
      try {
        if (listId) {
          await api.put(`/shopping-lists/${listId}`, { items: payload });
        } else {
          const res = await api.post(`/shopping-lists/${groupId}`, {
            weekNumber: currentWeek,
            year,
            items: payload,
          });
          setListId(res.data.id);
        }
      } catch (e) {
        console.error("Erreur sync liste", e);
      } finally {
        setSaving(false);
      }
    },
    [groupId, listId, currentWeek, year]
  );

  const addItem = (name: string, qty: string) => {
    const newItem: ShoppingItem = { name, quantity: qty || "1", _done: false, _key: makeKey() };
    const updated = [...items, newItem];
    setItems(updated);
    saveToHistory(name);
    syncToBackend(updated);
    Animated.sequence([
      Animated.spring(addBtnScale, { toValue: 0.9, useNativeDriver: true, speed: 60 }),
      Animated.spring(addBtnScale, { toValue: 1, useNativeDriver: true, speed: 40 }),
    ]).start();
  };

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    addItem(name, newQty.trim());
    setNewName("");
    setNewQty("1");
  };

  const handleAddFromSuggestion = (name: string) => {
    addItem(name, "1");
  };

  const handleToggle = (key: string) => {
    setItems(prev =>
      prev.map(i => (i._key === key ? { ...i, _done: !i._done } : i))
    );
  };

  const handleDelete = (key: string) => {
    const updated = items.filter(i => i._key !== key);
    setItems(updated);
    syncToBackend(updated);
  };

  const handleClearDone = () => {
    const updated = items.filter(i => !i._done);
    setItems(updated);
    syncToBackend(updated);
  };

  const doneCount = items.filter(i => i._done).length;
  const totalCount = items.length;
  const progressPct = totalCount > 0 ? doneCount / totalCount : 0;
  const hasDone = doneCount > 0;

  const suggestions = history
    .filter(h =>
      (newName.trim().length === 0 || h.toLowerCase().includes(newName.trim().toLowerCase())) &&
      !items.some(i => i.name.toLowerCase() === h.toLowerCase())
    )
    .slice(0, 8);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* ── Header ── */}
      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Liste de courses</Text>
          <Text style={styles.subtitle}>{currentGroup?.name ?? "Groupe"}</Text>
        </View>
        {saving && (
          <View style={styles.savingBadge}>
            <Text style={styles.savingText}>Sync…</Text>
          </View>
        )}
      </Animated.View>

      {/* ── Week nav ── */}
      <View style={styles.weekNav}>
        <TouchableOpacity style={styles.weekNavArrow} onPress={goToPrevWeek}>
          <Ionicons name="chevron-back" size={18} color={theme.colors.purple} />
        </TouchableOpacity>
        <TouchableOpacity onPress={goToToday} activeOpacity={0.7} style={styles.weekNavCenter}>
          <Text style={styles.weekNavLabel}>Semaine {currentWeek}{year !== new Date().getFullYear() ? ` · ${year}` : ""}</Text>
          {!isCurrentWeek && (
            <View style={styles.backTodayPill}>
              <Text style={styles.backTodayText}>Aujourd'hui</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.weekNavArrow} onPress={goToNextWeek}>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.purple} />
        </TouchableOpacity>
      </View>

      {/* ── Stats bar ── */}
      {!loading && (
        <Animated.View style={[styles.statsBar, { opacity: statsAnim }]}>
          <View style={styles.statsLeft}>
            <Text style={styles.statsCount}>
              <Text style={styles.statsCountBold}>{doneCount}</Text>/{totalCount} article{totalCount > 1 ? "s" : ""}
            </Text>
            {hasDone && (
              <TouchableOpacity style={styles.clearBtn} onPress={handleClearDone}>
                <Ionicons name="checkmark-done-outline" size={13} color={theme.colors.success} />
                <Text style={styles.clearText}>Supprimer les cochés</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPct * 100}%` as any }]} />
          </View>
        </Animated.View>
      )}

      {/* ── List ── */}
      {loading ? (
        <View style={styles.loadingState}>
          <Ionicons name="cart-outline" size={40} color={theme.colors.textSecondary} />
          <Text style={styles.loadingText}>Chargement…</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item._key}
          renderItem={({ item, index }) => (
            <ItemRow
              item={item}
              index={index}
              onToggle={() => handleToggle(item._key)}
              onDelete={() => handleDelete(item._key)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="cart-outline" size={36} color={theme.colors.purple} />
              </View>
              <Text style={styles.emptyTitle}>Rien dans le caddie !</Text>
              <Text style={styles.emptySub}>
                Ajoute tes articles ci-dessous pour commencer ta liste de la semaine.
              </Text>
            </View>
          }
          ListFooterComponent={
            items.length > 0 ? (
              <View style={styles.summaryCard}>
                <Ionicons name="bag-check-outline" size={16} color={theme.colors.success} />
                <Text style={styles.summaryText}>
                  {totalCount - doneCount} article{totalCount - doneCount !== 1 ? "s" : ""} restant{totalCount - doneCount !== 1 ? "s" : ""}
                </Text>
              </View>
            ) : null
          }
        />
      )}

      {/* ── Input footer ── */}
      <Animated.View style={[styles.inputFooter, { transform: [{ translateY: inputSlide }] }]}>

        {/* Suggestions d'articles habituels */}
        {suggestions.length > 0 && (
          <View style={styles.suggestionsSection}>
            <View style={styles.suggestionsHeader}>
              <Ionicons name="time-outline" size={13} color={theme.colors.textSecondary} />
              <Text style={styles.suggestionsLabel}>Habituels</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionsRow}
              keyboardShouldPersistTaps="always"
            >
              {suggestions.map(s => (
                <TouchableOpacity
                  key={s}
                  style={styles.suggestionChip}
                  onPress={() => handleAddFromSuggestion(s)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.suggestionChipText} numberOfLines={1}>{s}</Text>
                  <Ionicons name="add" size={13} color={theme.colors.purple} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Ligne principale : input + quantité + bouton */}
        <View style={styles.inputRow}>
          <View style={[styles.nameInputWrap, nameFocused && styles.nameInputFocused]}>
            <TextInput
              style={styles.nameInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Ajouter un article…"
              placeholderTextColor={theme.colors.textSecondary}
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleAdd}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
            />
            {/* Quantité inline */}
            <View style={styles.qtyInlineWrap}>
              <TextInput
                style={styles.qtyInlineInput}
                value={newQty}
                onChangeText={setNewQty}
                keyboardType="numeric"
                maxLength={4}
                selectTextOnFocus
              />
            </View>
          </View>

          <Animated.View style={{ transform: [{ scale: addBtnScale }] }}>
            <Pressable
              style={[styles.addBtn, !newName.trim() && styles.addBtnDisabled]}
              onPress={handleAdd}
              disabled={!newName.trim()}
              onPressIn={() =>
                Animated.spring(addBtnScale, { toValue: 0.9, useNativeDriver: true, speed: 60 }).start()
              }
              onPressOut={() =>
                Animated.spring(addBtnScale, { toValue: 1, useNativeDriver: true, speed: 40 }).start()
              }
            >
              <Ionicons name="add" size={24} color="#FFF" />
            </Pressable>
          </Animated.View>
        </View>

        {/* Quantités rapides */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.qtyRow}
          contentContainerStyle={styles.qtyRowContent}
          keyboardShouldPersistTaps="always"
        >
          {["1", "2", "3", "4", "6", "10", "12"].map(q => (
            <TouchableOpacity
              key={q}
              style={[styles.qtyPill, newQty === q && styles.qtyPillActive]}
              onPress={() => setNewQty(q)}
            >
              <Text style={[styles.qtyPillText, newQty === q && styles.qtyPillTextActive]}>×{q}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerLeft: { flex: 1 },
  title: {
    fontSize: theme.typography.size.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginTop: 3,
  },
  savingBadge: {
    backgroundColor: theme.colors.purple + "20",
    borderRadius: theme.radius.round,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  savingText: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.purple,
  },

  // Week nav
  weekNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  weekNavArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  weekNavCenter: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  weekNavLabel: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
  },
  backTodayPill: {
    backgroundColor: theme.colors.purple + "22",
    borderRadius: theme.radius.round,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  backTodayText: {
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.purple,
  },

  // Stats
  statsBar: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 8,
  },
  statsLeft: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statsCount: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  statsCountBold: {
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.colors.success + "18",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.round,
  },
  clearText: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.success,
  },
  progressBarBg: {
    height: 3,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: theme.colors.success,
    borderRadius: 2,
  },

  // List
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: 200,
  },

  // Item row
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 10,
  },
  itemRowDone: {
    opacity: 0.55,
    borderColor: theme.colors.success + "30",
    backgroundColor: theme.colors.success + "08",
  },
  checkboxBtn: {
    padding: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  itemName: {
    flex: 1,
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textPrimary,
  },
  itemNameDone: {
    textDecorationLine: "line-through",
    color: theme.colors.textSecondary,
  },
  qtyChip: {
    backgroundColor: theme.colors.purple + "20",
    borderRadius: theme.radius.round,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 34,
    alignItems: "center",
  },
  qtyChipDone: {
    backgroundColor: theme.colors.border,
  },
  qtyText: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.purple,
  },
  qtyTextDone: { color: theme.colors.textSecondary },
  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.danger + "15",
    alignItems: "center",
    justifyContent: "center",
  },

  // Loading
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },

  // Empty
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: theme.spacing.xl,
    gap: 12,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.purple + "18",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: theme.typography.size.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
  },
  emptySub: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },

  // Summary footer
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.success + "30",
    marginTop: 4,
  },
  summaryText: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
  },

  // Input footer
  inputFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
    gap: 10,
  },

  // Suggestions
  suggestionsSection: {
    gap: 6,
  },
  suggestionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  suggestionsLabel: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  suggestionsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.colors.purple + "12",
    borderWidth: 1,
    borderColor: theme.colors.purple + "30",
    borderRadius: theme.radius.round,
    paddingHorizontal: 12,
    paddingVertical: 6,
    maxWidth: 160,
  },
  suggestionChipText: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.purple,
    flexShrink: 1,
  },

  // Input row
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  nameInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    paddingLeft: theme.spacing.md,
    paddingRight: 6,
    overflow: "hidden",
  },
  nameInputFocused: {
    borderColor: theme.colors.purple,
    shadowColor: theme.colors.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  nameInput: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.md,
    paddingVertical: 13,
  },
  qtyInlineWrap: {
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 42,
    alignItems: "center",
  },
  qtyInlineInput: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.purple,
    textAlign: "center",
    minWidth: 30,
  },

  // Qty pills
  qtyRow: {
    marginTop: -2,
  },
  qtyRowContent: {
    gap: 7,
    alignItems: "center",
  },
  qtyPill: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: theme.radius.round,
    backgroundColor: theme.colors.background,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  qtyPillActive: {
    backgroundColor: theme.colors.purple,
    borderColor: theme.colors.purple,
  },
  qtyPillText: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textSecondary,
  },
  qtyPillTextActive: { color: "#FFF" },

  // Add button
  addBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.purple,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.colors.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  addBtnDisabled: {
    backgroundColor: theme.colors.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },
});
