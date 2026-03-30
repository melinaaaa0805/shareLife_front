import React from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../assets/style/theme";
import { MealIngredient } from "../../types/meals";

interface Props {
  ingredients: MealIngredient[];
  onChange: (list: MealIngredient[]) => void;
}

export default function IngredientEditor({ ingredients, onChange }: Props) {
  const update = (i: number, field: keyof MealIngredient, val: string) => {
    onChange(ingredients.map((ing, idx) => (idx === i ? { ...ing, [field]: val } : ing)));
  };
  const remove = (i: number) => onChange(ingredients.filter((_, idx) => idx !== i));
  const add = () => onChange([...ingredients, { name: "", quantity: "", unit: "" }]);

  return (
    <View>
      {ingredients.map((ing, i) => (
        <View key={i} style={styles.row}>
          <TextInput
            style={[styles.input, styles.inputName]}
            placeholder="Ingrédient"
            placeholderTextColor={theme.colors.textSecondary}
            value={ing.name}
            onChangeText={(v) => update(i, "name", v)}
          />
          <TextInput
            style={[styles.input, styles.inputQty]}
            placeholder="Qté"
            placeholderTextColor={theme.colors.textSecondary}
            value={ing.quantity}
            onChangeText={(v) => update(i, "quantity", v)}
          />
          <TextInput
            style={[styles.input, styles.inputUnit]}
            placeholder="Unité"
            placeholderTextColor={theme.colors.textSecondary}
            value={ing.unit || ""}
            onChangeText={(v) => update(i, "unit", v)}
          />
          <TouchableOpacity onPress={() => remove(i)} style={styles.removeBtn}>
            <Ionicons name="close-circle" size={18} color={theme.colors.danger} />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={styles.addBtn} onPress={add}>
        <Ionicons name="add-circle-outline" size={15} color={theme.colors.mint} />
        <Text style={styles.addBtnText}>Ajouter un ingrédient</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
