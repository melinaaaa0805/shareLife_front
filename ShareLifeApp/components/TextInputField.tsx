import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { theme } from "../assets/style/theme";

interface Props {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
  keyboardType?: "default" | "numeric";
  placeholder?: string;
}

const TextInputField: React.FC<Props> = ({
  label,
  value,
  onChangeText,
  multiline,
  keyboardType,
  placeholder,
}) => (
  <View style={{ marginBottom: theme.spacing.md }}>
    {label && <Text style={styles.label}>{label}</Text>}
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={theme.colors.textSecondary}
      style={[styles.input, multiline && { height: 80 }]}
      multiline={multiline}
      keyboardType={keyboardType}
    />
  </View>
);

export default TextInputField;

const styles = StyleSheet.create({
  input: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.textPrimary,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    fontSize: theme.typography.size.md,
  },
  label: {
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
});
