import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  Alert,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import api from "../api/api";
import { RootStackParamList, GroupMember } from "../types/types";
import { theme } from "../assets/style/theme";

type SpinWheelRouteProp = RouteProp<RootStackParamList, "SpinWheel">;
type SpinWheelNavProp = NativeStackNavigationProp<RootStackParamList, "SpinWheel">;

const SEGMENT_COLORS = [
  "#9B7BEA", // purple
  "#EAB1CF", // pink
  "#FFE27A", // yellow
  "#A6D8C0", // mint
  "#7BC4EA", // blue
  "#EA9B7B", // orange
  "#B1EAC0", // light green
  "#C0B1EA", // lavender
];

const WHEEL_SIZE = Math.min(Dimensions.get("window").width - 48, 320);
const RADIUS = WHEEL_SIZE / 2;

export default function SpinWheelScreen() {
  const route = useRoute<SpinWheelRouteProp>();
  const navigation = useNavigation<SpinWheelNavProp>();
  const { groupId, members } = route.params;

  const rotation = useRef(new Animated.Value(0)).current;
  const currentAngle = useRef(0);

  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<GroupMember | null>(null);

  const n = members.length;
  const segmentAngle = 360 / n;

  const spin = () => {
    if (spinning || n === 0) return;
    setWinner(null);
    setSpinning(true);

    // Nombre de tours aléatoires (5 à 8) + offset aléatoire
    const extraTurns = 5 + Math.floor(Math.random() * 4);
    const randomOffset = Math.random() * 360;
    const targetAngle = currentAngle.current + extraTurns * 360 + randomOffset;

    Animated.timing(rotation, {
      toValue: targetAngle,
      duration: 4000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      currentAngle.current = targetAngle % 360;

      // Le pointeur est en haut (270° dans le repère SVG standard, soit -90°)
      // Segment sélectionné : l'angle normalisé pointé vers le haut
      const normalizedAngle = ((360 - currentAngle.current) % 360 + 360) % 360;
      const winnerIndex = Math.floor(normalizedAngle / segmentAngle) % n;
      const elected = members[winnerIndex];

      setWinner(elected);
      setSpinning(false);
      confirmElection(elected);
    });
  };

  const confirmElection = (elected: GroupMember) => {
    Alert.alert(
      "🎉 Chef de la semaine !",
      `${elected.firstName} a été tiré au sort comme chef de la semaine.\nSeul(e) il/elle pourra attribuer les tâches.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          onPress: () => saveElection(elected),
        },
      ]
    );
  };

  const saveElection = async (elected: GroupMember) => {
    try {
      await api.post(`/groups/${groupId}/elect-admin`, { winnerId: elected.id });
      navigation.goBack();
    } catch (e) {
      Alert.alert("Erreur", "Impossible d'enregistrer le chef de la semaine.");
    }
  };

  // Interpolation de la rotation pour Animated
  const rotate = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
    extrapolate: "extend",
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎡 Tirage au sort</Text>
      <Text style={styles.subtitle}>
        {n} participant{n > 1 ? "s" : ""}
      </Text>

      {/* Pointeur fixe */}
      <View style={styles.pointerContainer}>
        <View style={styles.pointer} />
      </View>

      {/* Roue */}
      <View style={[styles.wheelWrapper, { width: WHEEL_SIZE, height: WHEEL_SIZE }]}>
        <Animated.View
          style={[
            styles.wheel,
            { width: WHEEL_SIZE, height: WHEEL_SIZE, borderRadius: RADIUS },
            { transform: [{ rotate }] },
          ]}
        >
          {members.map((member, i) => {
            const angle = i * segmentAngle;
            const midAngle = (angle + segmentAngle / 2) * (Math.PI / 180);
            const labelR = RADIUS * 0.65;
            const x = RADIUS + labelR * Math.sin(midAngle) - RADIUS * 0.25;
            const y = RADIUS - labelR * Math.cos(midAngle) - 12;

            return (
              <React.Fragment key={member.id}>
                {/* Ligne de séparation */}
                <View
                  style={[
                    styles.divider,
                    {
                      width: RADIUS,
                      transform: [
                        { translateX: RADIUS / 2 },
                        { translateY: RADIUS - 1 },
                        { rotate: `${angle}deg` },
                        { translateX: -RADIUS / 2 },
                        { translateY: -(RADIUS - 1) },
                      ],
                    },
                  ]}
                />
                {/* Fond de segment (couleur en arc) */}
                <View
                  style={[
                    styles.segment,
                    {
                      backgroundColor: SEGMENT_COLORS[i % SEGMENT_COLORS.length] + "33",
                      transform: [
                        { translateX: RADIUS },
                        { translateY: RADIUS },
                        { rotate: `${angle + segmentAngle / 2}deg` },
                        { translateX: -RADIUS },
                        { translateY: -RADIUS },
                      ],
                    },
                  ]}
                />
                {/* Nom du membre */}
                <View
                  style={[
                    styles.labelContainer,
                    {
                      left: x,
                      top: y,
                      backgroundColor: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
                    },
                  ]}
                >
                  <Text style={styles.labelText} numberOfLines={1}>
                    {member.firstName}
                  </Text>
                </View>
              </React.Fragment>
            );
          })}

          {/* Centre de la roue */}
          <View style={styles.center} />
        </Animated.View>
      </View>

      {/* Résultat */}
      {winner && (
        <View style={styles.winnerBadge}>
          <Text style={styles.winnerText}>👑 {winner.firstName}</Text>
        </View>
      )}

      {/* Bouton */}
      <TouchableOpacity
        style={[styles.spinBtn, spinning && styles.spinBtnDisabled]}
        onPress={spin}
        disabled={spinning}
      >
        <Text style={styles.spinBtnText}>
          {spinning ? "En cours..." : "🎰 Tourner la roue !"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.cancelText}>Annuler</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: theme.typography.size.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.textSecondary,
    marginBottom: 32,
  },
  pointerContainer: {
    alignItems: "center",
    marginBottom: -12,
    zIndex: 10,
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderTopWidth: 24,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: theme.colors.yellow,
  },
  wheelWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadows.soft,
  },
  wheel: {
    position: "relative",
    backgroundColor: theme.colors.surface,
    borderWidth: 3,
    borderColor: theme.colors.purple,
    overflow: "hidden",
  },
  divider: {
    position: "absolute",
    height: 2,
    backgroundColor: theme.colors.border,
    transformOrigin: "left center",
    top: RADIUS - 1,
    left: RADIUS,
  },
  segment: {
    position: "absolute",
    width: RADIUS,
    height: 2,
    top: RADIUS - 1,
    left: RADIUS,
  },
  labelContainer: {
    position: "absolute",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    maxWidth: RADIUS * 0.5,
  },
  labelText: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: "#1A1A1A",
  },
  center: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.purple,
    top: RADIUS - 10,
    left: RADIUS - 10,
    zIndex: 5,
  },
  winnerBadge: {
    marginTop: 24,
    backgroundColor: "#FFD70022",
    borderWidth: 1,
    borderColor: "#FFD700",
    borderRadius: theme.radius.md,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  winnerText: {
    fontSize: theme.typography.size.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
  },
  spinBtn: {
    marginTop: 24,
    backgroundColor: theme.colors.purple,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: theme.radius.md,
    ...theme.shadows.soft,
  },
  spinBtnDisabled: {
    backgroundColor: theme.colors.disabled,
  },
  spinBtnText: {
    color: "#FFF",
    fontSize: theme.typography.size.md,
    fontFamily: theme.typography.fontFamily.bold,
  },
  cancelText: {
    marginTop: 16,
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.sm,
  },
});
