import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Button,
  StyleSheet,
  Alert,
} from "react-native";
import api from "../api/api";
import { Group } from "../types/types";
import { useGroup } from "../context/GroupContext";
type ShoppingItem = {
  id: string;
  name: string;
  quantity: number;
};

export default function ShoppingListScreen() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItem, setNewItem] = useState("");
  const [loading, setLoading] = useState(true);
  const group = useGroup();
  const currentGroup = group.currentGroup;

  const fetchItems = async () => {
    try {
      const res = await api.get(`/shopping-lists/${currentGroup?.id}`); // adapter l’endpoint backend
      setItems(res.data);
    } catch (err) {
      console.error(err);
      Alert.alert("Erreur", "Impossible de récupérer la liste de course.");
    } finally {
      setLoading(false);
    }
  };

  const addItem = async () => {
    if (!newItem.trim()) return;
    try {
      const res = await api.post("/shopping-list", { name: newItem });
      setItems(res.data); // backend retourne la liste mise à jour
      setNewItem("");
    } catch (err) {
      console.error(err);
      Alert.alert("Erreur", "Impossible d’ajouter l’élément.");
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Liste de courses</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Text style={styles.item}>
            {item.name} x{item.quantity || 1}
          </Text>
        )}
      />
      <TextInput
        style={styles.input}
        placeholder="Nouvel élément"
        value={newItem}
        onChangeText={setNewItem}
      />
      <Button title="Ajouter" onPress={addItem} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 12 },
  item: { fontSize: 16, paddingVertical: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
    marginVertical: 12,
  },
});
