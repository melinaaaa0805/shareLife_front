import React, { useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../assets/style/theme";

export interface ShoppingItem {
  name: string;
  quantity: string;
  _done?: boolean;
  _key: string;
}

interface Props {
  item: ShoppingItem;
  index: number;
  onToggle: () => void;
  onDelete: () => void;
}

export default function ShoppingItemRow({ item, index, onToggle, onDelete }: Props) {
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
      <TouchableOpacity style={styles.checkboxBtn} onPress={onToggle} activeOpacity={0.7}>
        <View style={[styles.checkbox, item._done && styles.checkboxChecked]}>
          {item._done && <Ionicons name="checkmark" size={12} color="#FFF" />}
        </View>
      </TouchableOpacity>

      <Text style={[styles.itemName, item._done && styles.itemNameDone]} numberOfLines={1}>
        {item.name}
      </Text>

      <View style={[styles.qtyChip, item._done && styles.qtyChipDone]}>
        <Text style={[styles.qtyText, item._done && styles.qtyTextDone]}>
          {item.quantity || "1"}
        </Text>
      </View>

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

const styles = StyleSheet.create({
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
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
  checkboxBtn: { padding: 2 },
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
  qtyChipDone: { backgroundColor: theme.colors.border },
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
});
