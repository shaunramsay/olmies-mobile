import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { fonts, radii } from '../../utils/theme';

export default function Chip({ label, active, onPress, style }) {
  const { colors, isDarkTheme } = useAppTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.base,
        {
          backgroundColor: active ? colors.primary : colors.cardBackground,
          borderColor: active ? colors.primary : colors.border,
        },
        style,
      ]}
    >
      <Text style={[styles.label, { color: active ? (isDarkTheme ? '#1A1400' : '#FFFFFF') : colors.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: radii.pill, borderWidth: 1 },
  label: { fontFamily: fonts.semiBold, fontSize: 12.5 },
});
