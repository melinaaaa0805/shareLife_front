import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { theme } from "../assets/style/theme";

interface Props {
  weight: number;
  setWeight: (value: number) => void;
}

const WeightSelector: React.FC<Props> = ({ weight, setWeight }) => {
  const levels = [
    { label: "Tranquille", color: "#4CAF50", emoji: "😌" },
    { label: "Ça va", color: "#8BC34A", emoji: "🙂" },
    { label: "Moyen", color: "#FFC107", emoji: "😐" },
    { label: "Courage...", color: "#FF9800", emoji: "😓" },
    { label: "RELLOU À MORT", color: "#F44336", emoji: "😵‍💫" },
  ];

  return (
    <View style={{ marginVertical: theme.spacing.md }}>
      <Text
        style={{
          fontFamily: theme.typography.fontFamily.semiBold,
          color: theme.colors.textPrimary,
        }}
      >
        Poids de la charge
      </Text>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 8,
        }}
      >
        {levels.map((l, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => setWeight(i + 1)}
            style={{
              flex: 1,
              marginHorizontal: 2,
              height: 40,
              borderRadius: 8,
              backgroundColor: i < weight ? l.color : "#ccc",
              justifyContent: "center",
              alignItems: "center",
              transform: [{ scale: i + 1 === weight ? 1.2 : 1 }],
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 18 }}>
              {l.emoji}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text
        style={{
          textAlign: "center",
          marginTop: 4,
          fontWeight: "600",
          color: levels[weight - 1].color,
        }}
      >
        {levels[weight - 1].label} ({weight}/5)
      </Text>
    </View>
  );
};

export default WeightSelector;
