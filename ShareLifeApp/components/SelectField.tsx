import React from "react";
import { View, Text, StyleSheet } from "react-native";
import RNPickerSelect from "react-native-picker-select";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../assets/style/theme";

interface Props {
  label: string;
  value: any;
  onValueChange: (val: any) => void;
  items: { label: string; value: any }[];
}

const SelectField: React.FC<Props> = ({
  label,
  value,
  onValueChange,
  items,
}) => (
  <View style={styles.pickerContainer}>
    <Text style={styles.label}>{label}</Text>
    <RNPickerSelect
      onValueChange={onValueChange}
      value={value}
      items={items}
      placeholder={{
        label: `Sélectionner ${label.toLowerCase()}...`,
        value: null,
      }}
      style={{
        inputIOS: {
          color: theme.colors.textPrimary,
          padding: 12,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.md,
        },
        inputAndroid: {
          color: theme.colors.textPrimary,
          padding: 12,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.md,
        },
        placeholder: { color: theme.colors.textSecondary },
      }}
      useNativeAndroidPickerStyle={false}
      Icon={() => (
        <Ionicons name="chevron-down" size={20} color={theme.colors.purple} />
      )}
    />
  </View>
);

export default SelectField;

const styles = StyleSheet.create({
  pickerContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  label: {
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
});
