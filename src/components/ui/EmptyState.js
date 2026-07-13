import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { fonts, radii, spacing } from '../../utils/theme';

export default function EmptyState({ icon = 'file-tray-outline', title, message, action }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.base, { borderColor: colors.border, backgroundColor: colors.cardBackground }]}>
      <Ionicons name={icon} size={26} color={colors.textSecondary} style={{ marginBottom: 10 }} />
      {title ? <Text style={[styles.title, { color: colors.text }]}>{title}</Text> : null}
      {message ? <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text> : null}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: radii.lg,
    padding: spacing.xxl,
    alignItems: 'center',
  },
  title: { fontFamily: fonts.bold, fontSize: 14, textAlign: 'center', marginBottom: 4 },
  message: { fontFamily: fonts.regular, fontSize: 12.5, textAlign: 'center' },
});
