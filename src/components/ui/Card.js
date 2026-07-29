import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { radii, shadow, spacing } from '../../utils/theme';

export default function Card({ children, style, padded = true, highlighted = false, elevated = false }) {
  const { colors, isDarkTheme } = useAppTheme();
  return (
    <View
      style={[
        styles.base,
        padded && styles.padded,
        {
          backgroundColor: highlighted ? colors.accentTint : colors.cardBackground,
          borderColor: highlighted ? colors.accent : colors.border,
        },
        elevated && !isDarkTheme && shadow.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radii.lg, borderWidth: 1 },
  padded: { padding: spacing.lg },
});
