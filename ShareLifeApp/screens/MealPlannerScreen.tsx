import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../api/api";
import { theme } from "../assets/style/theme";
import { useAuth } from "../context/AuthContext";
import { useGroup } from "../context/GroupContext";
import { useWeek } from "../context/WeekContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MealIngredient {
  name: string;
  quantity: string;
  unit?: string;
}

interface MealVote {
  id: string;
  user: { id: string; firstName: string };
  dayOfWeek: number;
  meal: { id: string };
}

interface WeeklyMeal {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  ingredients: MealIngredient[];
  weekNumber: number;
  year: number;
  proposedBy?: { id: string; firstName: string } | null;
  votes?: MealVote[];
}

interface CatalogMeal {
  name: string;
  description?: string;
  ingredients: MealIngredient[];
  tags: string[];
}

interface SearchResult {
  externalId: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  ingredients: MealIngredient[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getISOWeek(d: Date): { week: number; year: number } {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  const week =
    Math.round(
      ((date.getTime() - week1.getTime()) / 86400000 +
        ((week1.getDay() + 6) % 7)) /
        7,
    ) + 1;
  return { week, year: date.getFullYear() };
}

function getWeekDates(week: number, year: number): Date[] {
  const jan4 = new Date(year, 0, 4);
  const startOfWeek1 = new Date(jan4);
  startOfWeek1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
  const monday = new Date(startOfWeek1);
  monday.setDate(startOfWeek1.getDate() + (week - 1) * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

const DAYS_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const DAYS_FULL = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

// ─── IngredientEditor ─────────────────────────────────────────────────────────

function IngredientEditor({
  ingredients,
  onChange,
}: {
  ingredients: MealIngredient[];
  onChange: (list: MealIngredient[]) => void;
}) {
  const update = (i: number, field: keyof MealIngredient, val: string) => {
    const next = ingredients.map((ing, idx) =>
      idx === i ? { ...ing, [field]: val } : ing
    );
    onChange(next);
  };
  const remove = (i: number) => onChange(ingredients.filter((_, idx) => idx !== i));
  const add = () => onChange([...ingredients, { name: "", quantity: "", unit: "" }]);

  return (
    <View>
      {ingredients.map((ing, i) => (
        <View key={i} style={ingStyles.row}>
          <TextInput
            style={[ingStyles.input, ingStyles.inputName]}
            placeholder="Ingrédient"
            placeholderTextColor={theme.colors.textSecondary}
            value={ing.name}
            onChangeText={(v) => update(i, "name", v)}
          />
          <TextInput
            style={[ingStyles.input, ingStyles.inputQty]}
            placeholder="Qté"
            placeholderTextColor={theme.colors.textSecondary}
            value={ing.quantity}
            onChangeText={(v) => update(i, "quantity", v)}
          />
          <TextInput
            style={[ingStyles.input, ingStyles.inputUnit]}
            placeholder="Unité"
            placeholderTextColor={theme.colors.textSecondary}
            value={ing.unit || ""}
            onChangeText={(v) => update(i, "unit", v)}
          />
          <TouchableOpacity onPress={() => remove(i)} style={ingStyles.removeBtn}>
            <Ionicons name="close-circle" size={18} color={theme.colors.danger} />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={ingStyles.addBtn} onPress={add}>
        <Ionicons name="add-circle-outline" size={15} color={theme.colors.mint} />
        <Text style={ingStyles.addBtnText}>Ajouter un ingrédient</Text>
      </TouchableOpacity>
    </View>
  );
}

const ingStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: theme.colors.textPrimary,
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.regular,
  },
  inputName: { flex: 3 },
  inputQty: { flex: 1.5 },
  inputUnit: { flex: 1.5 },
  removeBtn: { padding: 2 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    marginTop: 2,
  },
  addBtnText: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.mint,
  },
});

// ─── MealCard ─────────────────────────────────────────────────────────────────

function MealCard({
  meal,
  votes,
  userId,
  onDelete,
  onEdit,
  onAddToShopping,
  onVote,
  index,
}: {
  meal: WeeklyMeal;
  votes: MealVote[];
  userId?: string;
  onDelete: (id: string) => void;
  onEdit: (meal: WeeklyMeal) => void;
  onAddToShopping: (meal: WeeklyMeal) => void;
  onVote: (mealId: string, day: number) => void;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const slideAnim = useRef(new Animated.Value(20)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const expandAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 1, duration: 280, delay: index * 60, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 8, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  const toggleExpand = () => {
    const toValue = expanded ? 0 : 1;
    Animated.timing(expandAnim, { toValue, duration: 220, useNativeDriver: false }).start();
    setExpanded(!expanded);
  };

  const votesByDay: Record<number, MealVote[]> = {};
  votes.forEach((v) => {
    if (v.meal?.id === meal.id) {
      if (!votesByDay[v.dayOfWeek]) votesByDay[v.dayOfWeek] = [];
      votesByDay[v.dayOfWeek].push(v);
    }
  });
  const totalVotes = Object.values(votesByDay).flat().length;
  const myVoteDay = Object.entries(votesByDay).find(([_, dayVotes]) =>
    dayVotes.some((v) => v.user?.id === userId)
  );

  return (
    <Animated.View
      style={[styles.mealCard, { opacity: opacityAnim, transform: [{ translateY: slideAnim }] }]}
    >
      {/* Card header */}
      <View style={styles.mealCardHeader}>
        {meal.imageUrl ? (
          <Image source={{ uri: meal.imageUrl }} style={styles.mealImage} />
        ) : (
          <View style={styles.mealImagePlaceholder}>
            <Ionicons name="restaurant-outline" size={22} color={theme.colors.purple} />
          </View>
        )}

        <View style={styles.mealInfo}>
          <Text style={styles.mealName} numberOfLines={2}>{meal.name}</Text>
          {meal.proposedBy && (
            <Text style={styles.mealProposedBy}>par {meal.proposedBy.firstName}</Text>
          )}
          <View style={styles.mealMeta}>
            <View style={styles.metaChip}>
              <Ionicons name="list-outline" size={11} color={theme.colors.textSecondary} />
              <Text style={styles.metaChipText}>{meal.ingredients.length} ingréd.</Text>
            </View>
            {totalVotes > 0 && (
              <View style={[styles.metaChip, styles.voteChip]}>
                <Ionicons name="heart" size={11} color={theme.colors.pink} />
                <Text style={[styles.metaChipText, { color: theme.colors.pink }]}>
                  {totalVotes} vote{totalVotes > 1 ? "s" : ""}
                </Text>
              </View>
            )}
            {myVoteDay && (
              <View style={[styles.metaChip, styles.myVoteChip]}>
                <Ionicons name="calendar-outline" size={11} color={theme.colors.mint} />
                <Text style={[styles.metaChipText, { color: theme.colors.mint }]}>
                  {DAYS_SHORT[+myVoteDay[0]]}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.mealActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => onEdit(meal)}>
            <Ionicons name="pencil-outline" size={16} color={theme.colors.purple} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => onAddToShopping(meal)}>
            <Ionicons name="cart-outline" size={16} color={theme.colors.mint} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => onDelete(meal.id)}>
            <Ionicons name="trash-outline" size={16} color={theme.colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Expand toggle */}
      <TouchableOpacity style={styles.expandBtn} onPress={toggleExpand}>
        <Text style={styles.expandBtnText}>
          {expanded ? "Masquer" : "Ingrédients & voter"}
        </Text>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={13}
          color={theme.colors.purple}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedSection}>
          {meal.ingredients.length > 0 && (
            <View style={styles.ingredientsSection}>
              <Text style={styles.sectionLabel}>Ingrédients</Text>
              <View style={styles.ingredientsList}>
                {meal.ingredients.map((ing, i) => (
                  <View key={i} style={styles.ingredientRow}>
                    <View style={styles.ingredientDot} />
                    <Text style={styles.ingredientText}>
                      {ing.name}
                      {ing.quantity ? (
                        <Text style={styles.ingredientQty}>
                          {" – "}{ing.quantity}{ing.unit ? ` ${ing.unit}` : ""}
                        </Text>
                      ) : null}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.voteSection}>
            <Text style={styles.sectionLabel}>Voter pour un jour</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.dayVoteRow}>
                {DAYS_SHORT.map((day, i) => {
                  const dayVotes = votesByDay[i] || [];
                  const isMyVote = dayVotes.some((v) => v.user?.id === userId);
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[styles.dayVoteBtn, isMyVote && styles.dayVoteBtnActive]}
                      onPress={() => onVote(meal.id, i)}
                    >
                      <Text style={[styles.dayVoteBtnText, isMyVote && styles.dayVoteBtnTextActive]}>
                        {day}
                      </Text>
                      {dayVotes.length > 0 && (
                        <View style={styles.dayVoteCount}>
                          <Text style={styles.dayVoteCountText}>{dayVotes.length}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            {Object.entries(votesByDay).length > 0 && (
              <View style={styles.votersList}>
                {Object.entries(votesByDay).map(([day, dayVotes]) => (
                  <Text key={day} style={styles.votersText}>
                    {DAYS_FULL[+day]} : {dayVotes.map((v) => v.user?.firstName).join(", ")}
                  </Text>
                ))}
              </View>
            )}
          </View>
        </View>
      )}
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

type AddTab = "catalog" | "search" | "manual";

export default function MealPlannerScreen() {
  const { currentGroup } = useGroup();
  const { user } = useAuth();
  const isFocused = useIsFocused();
  const userId = user?.id;
  const { week: weekNumber, year, goToPrevWeek, goToNextWeek, goToToday, isCurrentWeek } = useWeek();
  const [meals, setMeals] = useState<WeeklyMeal[]>([]);
  const [votes, setVotes] = useState<MealVote[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Add modal ──
  const [showAddModal, setShowAddModal] = useState(false);
  const [addTab, setAddTab] = useState<AddTab>("catalog");

  // Catalog tab
  const [catalog, setCatalog] = useState<CatalogMeal[]>([]);
  const [catalogQuery, setCatalogQuery] = useState("");

  // Search tab
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);

  // Manual tab
  const [manualName, setManualName] = useState("");
  const [manualDesc, setManualDesc] = useState("");
  const [manualIngredients, setManualIngredients] = useState<MealIngredient[]>([
    { name: "", quantity: "", unit: "" },
  ]);

  const [saving, setSaving] = useState(false);

  // ── Edit modal ──
  const [editingMeal, setEditingMeal] = useState<WeeklyMeal | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editIngredients, setEditIngredients] = useState<MealIngredient[]>([]);

  useEffect(() => {
    if (isFocused && currentGroup) {
      fetchMeals();
      fetchVotes();
    }
  }, [isFocused, weekNumber, year, currentGroup]);

  // Load catalog on mount
  useEffect(() => {
    api.get("meals/catalog").then((r) => setCatalog(r.data)).catch(() => {});
  }, []);

  const fetchMeals = async () => {
    setLoading(true);
    try {
      const res = await api.get(`meals/${currentGroup!.id}/${year}/${weekNumber}`);
      setMeals(res.data);
    } catch (e) {
      console.error("Erreur fetch repas", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchVotes = async () => {
    try {
      const res = await api.get(`meal-votes/${currentGroup!.id}/${year}/${weekNumber}`);
      setVotes(res.data);
    } catch (e) {
      console.error("Erreur fetch votes", e);
    }
  };

  // Catalog search (local)
  const filteredCatalog = catalogQuery.trim().length >= 1
    ? catalog.filter((m) =>
        m.name.toLowerCase().includes(catalogQuery.toLowerCase()) ||
        m.tags.some((t) => t.toLowerCase().includes(catalogQuery.toLowerCase())) ||
        m.ingredients.some((i) => i.name.toLowerCase().includes(catalogQuery.toLowerCase()))
      )
    : catalog;

  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) return;
    setSearching(true);
    try {
      const res = await api.get(`meals/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(res.data);
    } catch {
      console.error("Erreur recherche TheMealDB");
    } finally {
      setSearching(false);
    }
  };

  const handleAddFromCatalog = async (catalogMeal: CatalogMeal) => {
    setSaving(true);
    try {
      await api.post(`meals/${currentGroup!.id}`, {
        name: catalogMeal.name,
        description: catalogMeal.description,
        ingredients: catalogMeal.ingredients,
        weekNumber,
        year,
      });
      closeAddModal();
      fetchMeals();
    } catch {
      Alert.alert("Erreur", "Impossible d'ajouter ce repas.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddFromSearch = async (result: SearchResult) => {
    setSaving(true);
    try {
      await api.post(`meals/${currentGroup!.id}`, {
        name: result.name,
        description: result.description,
        imageUrl: result.imageUrl,
        externalId: result.externalId,
        ingredients: result.ingredients,
        weekNumber,
        year,
      });
      closeAddModal();
      fetchMeals();
    } catch {
      Alert.alert("Erreur", "Impossible d'ajouter ce repas.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddManual = async () => {
    if (!manualName.trim()) {
      Alert.alert("Erreur", "Le nom du repas est requis.");
      return;
    }
    const ingredients = manualIngredients.filter((i) => i.name.trim());
    setSaving(true);
    try {
      await api.post(`meals/${currentGroup!.id}`, {
        name: manualName.trim(),
        description: manualDesc.trim() || undefined,
        ingredients,
        weekNumber,
        year,
      });
      closeAddModal();
      fetchMeals();
    } catch {
      Alert.alert("Erreur", "Impossible d'ajouter ce repas.");
    } finally {
      setSaving(false);
    }
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedResult(null);
    setManualName("");
    setManualDesc("");
    setManualIngredients([{ name: "", quantity: "", unit: "" }]);
    setCatalogQuery("");
  };

  const openEditModal = (meal: WeeklyMeal) => {
    setEditingMeal(meal);
    setEditName(meal.name);
    setEditDesc(meal.description || "");
    setEditIngredients(meal.ingredients.map((i) => ({ ...i })));
  };

  const handleSaveEdit = async () => {
    if (!editingMeal || !editName.trim()) return;
    const ingredients = editIngredients.filter((i) => i.name.trim());
    setSaving(true);
    try {
      const res = await api.patch(`meals/${editingMeal.id}`, {
        name: editName.trim(),
        description: editDesc.trim() || undefined,
        ingredients,
      });
      setMeals((prev) => prev.map((m) => (m.id === editingMeal.id ? { ...m, ...res.data } : m)));
      setEditingMeal(null);
    } catch {
      Alert.alert("Erreur", "Impossible de sauvegarder les modifications.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Supprimer", "Retirer ce repas de la semaine ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`meals/${id}`);
            setMeals((prev) => prev.filter((m) => m.id !== id));
          } catch {
            Alert.alert("Erreur", "Impossible de supprimer ce repas.");
          }
        },
      },
    ]);
  };

  const handleAddToShopping = async (meal: WeeklyMeal) => {
    try {
      await api.post(`meals/${meal.id}/add-to-shopping`, {
        groupId: currentGroup!.id,
        weekNumber,
      });
      Alert.alert("Ajouté !", `Les ingrédients de "${meal.name}" ont été ajoutés à la liste de courses.`);
    } catch {
      Alert.alert("Erreur", "Impossible d'ajouter les ingrédients.");
    }
  };

  const handleVote = async (mealId: string, dayOfWeek: number) => {
    const existingVote = votes.find(
      (v) => v.user?.id === userId && v.dayOfWeek === dayOfWeek && v.meal?.id === mealId,
    );
    if (existingVote) {
      setVotes((prev) => prev.filter((v) => v.id !== existingVote.id));
      try {
        await api.delete(`meal-votes/${existingVote.id}`);
      } catch {
        setVotes((prev) => [...prev, existingVote]);
      }
      return;
    }
    try {
      const res = await api.post("meal-votes", {
        mealId,
        dayOfWeek,
        groupId: currentGroup!.id,
        weekNumber,
        year,
      });
      setVotes((prev) => {
        const filtered = prev.filter((v) => !(v.user?.id === userId && v.dayOfWeek === dayOfWeek));
        return res.data ? [...filtered, res.data] : filtered;
      });
    } catch {
      console.error("Erreur vote");
    }
  };

  const weekDates = getWeekDates(weekNumber, year);

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.screenTitle}>Repas</Text>
          <Text style={styles.screenSub}>{currentGroup?.name}</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => { setShowAddModal(true); setAddTab("catalog"); }}
        >
          <Ionicons name="add" size={18} color="#FFF" />
          <Text style={styles.addBtnText}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      {/* ── Week navigation ── */}
      <View style={styles.weekNav}>
        <TouchableOpacity onPress={goToPrevWeek} style={styles.weekArrow}>
          <Ionicons name="chevron-back" size={20} color={theme.colors.purple} />
        </TouchableOpacity>
        <TouchableOpacity onPress={goToToday} activeOpacity={0.7} style={styles.weekInfo}>
          <Text style={styles.weekLabel}>
            Semaine {weekNumber}{year !== new Date().getFullYear() ? ` · ${year}` : ""}
          </Text>
          {isCurrentWeek && (
            <View style={styles.currentWeekBadge}>
              <Text style={styles.currentWeekBadgeText}>Cette semaine</Text>
            </View>
          )}
          {!isCurrentWeek && (
            <View style={[styles.currentWeekBadge, { backgroundColor: theme.colors.purple + "22" }]}>
              <Text style={[styles.currentWeekBadgeText, { color: theme.colors.purple }]}>Aujourd'hui</Text>
            </View>
          )}
          <Text style={styles.weekRange}>
            {weekDates[0].getDate()}/{weekDates[0].getMonth() + 1} –{" "}
            {weekDates[6].getDate()}/{weekDates[6].getMonth() + 1}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goToNextWeek} style={styles.weekArrow}>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.purple} />
        </TouchableOpacity>
      </View>

      {/* ── Day votes recap ── */}
      {votes.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.dayRecapScroll}
          contentContainerStyle={styles.dayRecapContent}
        >
          {DAYS_SHORT.map((day, i) => {
            const dayVotes = votes.filter((v) => v.dayOfWeek === i);
            const mealIds = [...new Set(dayVotes.map((v) => v.meal?.id))];
            const topMeal = mealIds
              .map((id) => ({
                meal: meals.find((m) => m.id === id),
                count: dayVotes.filter((v) => v.meal?.id === id).length,
              }))
              .sort((a, b) => b.count - a.count)[0];
            const hasMyVote = dayVotes.some((v) => v.user?.id === userId);
            return (
              <View key={i} style={[styles.dayRecapCard, hasMyVote && styles.dayRecapCardActive]}>
                <Text style={[styles.dayRecapLabel, hasMyVote && styles.dayRecapLabelActive]}>{day}</Text>
                {topMeal?.meal ? (
                  <>
                    <Text style={styles.dayRecapMeal} numberOfLines={2}>{topMeal.meal.name}</Text>
                    <Text style={styles.dayRecapVotes}>{topMeal.count} vote{topMeal.count > 1 ? "s" : ""}</Text>
                  </>
                ) : (
                  <Text style={styles.dayRecapEmpty}>—</Text>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* ── Meals list ── */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={theme.colors.purple} />
        </View>
      ) : (
        <FlatList
          data={meals}
          keyExtractor={(m) => m.id}
          renderItem={({ item, index }) => (
            <MealCard
              meal={item}
              votes={votes}
              userId={userId}
              onDelete={handleDelete}
              onEdit={openEditModal}
              onAddToShopping={handleAddToShopping}
              onVote={handleVote}
              index={index}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="restaurant-outline" size={32} color={theme.colors.purple} />
              </View>
              <Text style={styles.emptyTitle}>Aucun repas planifié</Text>
              <Text style={styles.emptySub}>
                Appuyez sur "Ajouter" pour choisir dans le catalogue ou créer un repas.
              </Text>
            </View>
          }
        />
      )}

      {/* ────────────────── MODAL AJOUT ────────────────── */}
      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={closeAddModal}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter un repas</Text>
              <TouchableOpacity onPress={closeAddModal}>
                <Ionicons name="close" size={22} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabRow}>
              {(["catalog", "search", "manual"] as AddTab[]).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tabBtn, addTab === tab && styles.tabBtnActive]}
                  onPress={() => setAddTab(tab)}
                >
                  <Ionicons
                    name={tab === "catalog" ? "book-outline" : tab === "search" ? "globe-outline" : "create-outline"}
                    size={13}
                    color={addTab === tab ? "#FFF" : theme.colors.textSecondary}
                  />
                  <Text style={[styles.tabBtnText, addTab === tab && styles.tabBtnTextActive]}>
                    {tab === "catalog" ? "Catalogue" : tab === "search" ? "En ligne" : "Manuel"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── Catalogue local ── */}
            {addTab === "catalog" && (
              <View style={{ flex: 1 }}>
                <View style={styles.searchRow}>
                  <Ionicons name="search-outline" size={16} color={theme.colors.textSecondary} style={{ marginRight: 6 }} />
                  <TextInput
                    style={styles.searchInputInline}
                    placeholder="Poulet, pasta, curry…"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={catalogQuery}
                    onChangeText={setCatalogQuery}
                    returnKeyType="search"
                  />
                  {catalogQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setCatalogQuery("")}>
                      <Ionicons name="close-circle" size={16} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                  {filteredCatalog.map((meal, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.catalogCard}
                      onPress={() => handleAddFromCatalog(meal)}
                      activeOpacity={0.75}
                      disabled={saving}
                    >
                      <View style={styles.catalogIcon}>
                        <Ionicons name="restaurant-outline" size={18} color={theme.colors.purple} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.catalogName}>{meal.name}</Text>
                        <View style={styles.catalogMeta}>
                          <Text style={styles.catalogIngCount}>{meal.ingredients.length} ingréd.</Text>
                          {meal.tags.slice(0, 2).map((tag) => (
                            <View key={tag} style={styles.tagChip}>
                              <Text style={styles.tagChipText}>{tag}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                      <Ionicons name="add-circle-outline" size={20} color={theme.colors.mint} />
                    </TouchableOpacity>
                  ))}
                  {filteredCatalog.length === 0 && (
                    <Text style={styles.noResults}>Aucun résultat pour "{catalogQuery}"</Text>
                  )}
                </ScrollView>
              </View>
            )}

            {/* ── Recherche TheMealDB ── */}
            {addTab === "search" && (
              <View style={{ flex: 1 }}>
                <View style={styles.searchRow}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Ex: pasta, chicken, sushi…"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                  />
                  <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={searching}>
                    {searching ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Ionicons name="search" size={18} color="#FFF" />
                    )}
                  </TouchableOpacity>
                </View>
                <Text style={styles.searchHint}>Recherche en anglais via TheMealDB</Text>

                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                  {searchResults.map((result) => (
                    <TouchableOpacity
                      key={result.externalId}
                      style={[
                        styles.searchResultCard,
                        selectedResult?.externalId === result.externalId && styles.searchResultCardSelected,
                      ]}
                      onPress={() => setSelectedResult(result)}
                      activeOpacity={0.8}
                    >
                      {result.imageUrl ? (
                        <Image source={{ uri: result.imageUrl }} style={styles.resultImage} />
                      ) : (
                        <View style={styles.resultImagePlaceholder}>
                          <Ionicons name="restaurant-outline" size={20} color={theme.colors.purple} />
                        </View>
                      )}
                      <View style={styles.resultInfo}>
                        <Text style={styles.resultName}>{result.name}</Text>
                        <Text style={styles.resultIngCount}>{result.ingredients.length} ingrédients</Text>
                      </View>
                      {selectedResult?.externalId === result.externalId && (
                        <Ionicons name="checkmark-circle" size={20} color={theme.colors.purple} />
                      )}
                    </TouchableOpacity>
                  ))}
                  {searchResults.length === 0 && !searching && searchQuery.length > 0 && (
                    <Text style={styles.noResults}>Aucun résultat. Essayez en anglais.</Text>
                  )}
                </ScrollView>

                {selectedResult && (
                  <TouchableOpacity
                    style={[styles.confirmBtn, saving && { opacity: 0.6 }]}
                    onPress={() => handleAddFromSearch(selectedResult)}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <Ionicons name="add-circle-outline" size={18} color="#FFF" />
                        <Text style={styles.confirmBtnText}>Ajouter "{selectedResult.name}"</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* ── Manuel ── */}
            {addTab === "manual" && (
              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text style={styles.fieldLabel}>Nom du repas *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex: Spaghetti carbonara"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={manualName}
                  onChangeText={setManualName}
                />
                <Text style={styles.fieldLabel}>Description (optionnel)</Text>
                <TextInput
                  style={[styles.textInput, styles.textInputMulti]}
                  placeholder="Quelques mots sur ce plat…"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={manualDesc}
                  onChangeText={setManualDesc}
                  multiline
                  numberOfLines={2}
                />
                <Text style={styles.fieldLabel}>Ingrédients</Text>
                <IngredientEditor ingredients={manualIngredients} onChange={setManualIngredients} />
                <TouchableOpacity
                  style={[styles.confirmBtn, saving && { opacity: 0.6 }, { marginTop: 16 }]}
                  onPress={handleAddManual}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="add-circle-outline" size={18} color="#FFF" />
                      <Text style={styles.confirmBtnText}>Ajouter ce repas</Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ────────────────── MODAL ÉDITION ────────────────── */}
      <Modal
        visible={!!editingMeal}
        animationType="slide"
        transparent
        onRequestClose={() => setEditingMeal(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Modifier le repas</Text>
              <TouchableOpacity onPress={() => setEditingMeal(null)}>
                <Ionicons name="close" size={22} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.fieldLabel}>Nom *</Text>
              <TextInput
                style={styles.textInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Nom du repas"
                placeholderTextColor={theme.colors.textSecondary}
              />
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textInputMulti]}
                value={editDesc}
                onChangeText={setEditDesc}
                placeholder="Description…"
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                numberOfLines={2}
              />
              <Text style={styles.fieldLabel}>Ingrédients</Text>
              <IngredientEditor ingredients={editIngredients} onChange={setEditIngredients} />
              <TouchableOpacity
                style={[styles.confirmBtn, saving && { opacity: 0.6 }, { marginTop: 16 }]}
                onPress={handleSaveEdit}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />
                    <Text style={styles.confirmBtnText}>Sauvegarder</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  headerLeft: { flex: 1 },
  screenTitle: {
    fontSize: theme.typography.size.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
  },
  screenSub: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.colors.purple,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: theme.radius.round,
    shadowColor: theme.colors.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addBtnText: {
    color: "#FFF",
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.size.sm,
  },

  // Week nav
  weekNav: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    gap: 8,
  },
  weekArrow: {
    padding: 8,
    borderRadius: theme.radius.round,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  weekInfo: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  weekLabel: {
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
  },
  currentWeekBadge: {
    backgroundColor: theme.colors.purple + "22",
    borderRadius: theme.radius.round,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: theme.colors.purple + "44",
  },
  currentWeekBadgeText: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.purple,
  },
  weekRange: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },

  // Day recap
  dayRecapScroll: { flexGrow: 0 },
  dayRecapContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
    gap: 8,
  },
  dayRecapCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 10,
    width: 80,
    alignItems: "center",
    gap: 4,
  },
  dayRecapCardActive: {
    borderColor: theme.colors.mint + "60",
    backgroundColor: theme.colors.mint + "0A",
  },
  dayRecapLabel: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dayRecapLabelActive: { color: theme.colors.mint },
  dayRecapMeal: {
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textPrimary,
    textAlign: "center",
    lineHeight: 13,
  },
  dayRecapVotes: {
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.pink,
  },
  dayRecapEmpty: {
    fontSize: 14,
    color: theme.colors.border,
  },

  // List
  listContent: { padding: theme.spacing.md, paddingBottom: 40 },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center" },

  // Meal card
  mealCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
  },
  mealCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    gap: 12,
  },
  mealImage: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.border,
  },
  mealImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.purple + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  mealInfo: { flex: 1, gap: 4 },
  mealName: {
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
    lineHeight: 20,
  },
  mealProposedBy: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  mealMeta: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  mealActions: { gap: 6 },
  iconBtn: {
    padding: 6,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  // Meta chips
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.round,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  metaChipText: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
  },
  voteChip: { borderColor: theme.colors.pink + "40" },
  myVoteChip: { borderColor: theme.colors.mint + "40" },

  // Expand
  expandBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  expandBtnText: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.purple,
  },
  expandedSection: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 12,
  },

  // Ingredients
  ingredientsSection: { gap: 6 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  ingredientsList: { gap: 4 },
  ingredientRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  ingredientDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.colors.purple,
  },
  ingredientText: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  ingredientQty: { color: theme.colors.textSecondary },

  // Vote section
  voteSection: { gap: 8 },
  dayVoteRow: { flexDirection: "row", gap: 8 },
  dayVoteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    gap: 4,
  },
  dayVoteBtnActive: {
    borderColor: theme.colors.purple,
    backgroundColor: theme.colors.purple + "18",
  },
  dayVoteBtnText: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textSecondary,
  },
  dayVoteBtnTextActive: { color: theme.colors.purple },
  dayVoteCount: {
    backgroundColor: theme.colors.pink,
    borderRadius: theme.radius.round,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: "center",
  },
  dayVoteCountText: {
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#0E0E0E",
  },
  votersList: { gap: 3 },
  votersText: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },

  // Empty state
  emptyState: { alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 12 },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.purple + "18",
    alignItems: "center",
    justifyContent: "center",
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
    paddingHorizontal: 24,
  },

  // Modal base
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    paddingTop: 12,
    maxHeight: "90%",
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 14,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    fontSize: theme.typography.size.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
  },

  // Tabs
  tabRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 9,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  tabBtnActive: {
    backgroundColor: theme.colors.purple,
    borderColor: theme.colors.purple,
  },
  tabBtnText: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textSecondary,
  },
  tabBtnTextActive: { color: "#FFF" },

  // Catalog
  catalogCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  catalogIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.purple + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  catalogName: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  catalogMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  catalogIngCount: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  tagChip: {
    backgroundColor: theme.colors.purple + "18",
    borderRadius: theme.radius.round,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagChipText: {
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.purple,
  },

  // Search row
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 12,
    marginBottom: 10,
    gap: 6,
  },
  searchInputInline: {
    flex: 1,
    paddingVertical: 10,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.sm,
  },
  searchBtn: {
    padding: 10,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.purple,
  },
  searchHint: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginBottom: 8,
    marginTop: -4,
  },
  searchResultCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchResultCardSelected: {
    backgroundColor: theme.colors.purple + "12",
    borderRadius: theme.radius.sm,
    paddingHorizontal: 8,
    marginHorizontal: -8,
  },
  resultImage: { width: 44, height: 44, borderRadius: theme.radius.sm },
  resultImagePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.purple + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  resultInfo: { flex: 1 },
  resultName: {
    fontSize: theme.typography.size.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
  },
  resultIngCount: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  selectedCheck: {},
  noResults: {
    textAlign: "center",
    fontSize: theme.typography.size.sm,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.regular,
    paddingVertical: theme.spacing.lg,
  },

  // Form
  fieldLabel: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
    marginTop: 12,
  },
  textInput: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.sm,
  },
  textInputMulti: { minHeight: 60, textAlignVertical: "top" },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.colors.purple,
    paddingVertical: 14,
    borderRadius: theme.radius.round,
    shadowColor: theme.colors.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnText: {
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.bold,
    color: "#FFF",
  },
});
