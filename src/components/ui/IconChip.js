import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { radii } from '../../utils/theme';

// tone: 'navy' | 'accent' | 'success' | 'danger' | 'info'
export default function IconChip({ name, tone = 'navy', size = 30, iconSize = 15 }) {
  const { colors } = useAppTheme();
  const toneMap = {
    navy: { bg: colors.primaryTint, fg: colors.secondary },
    accent: { bg: colors.accentTint, fg: colors.accentInk },
    success: { bg: colors.successTint, fg: colors.success },
    danger: { bg: colors.dangerTint, fg: colors.danger },
    info: { bg: colors.infoTint, fg: colors.info },
  }[tone];

  return (
    <View style={[styles.base, { width: size, height: size, borderRadius: radii.sm, backgroundColor: toneMap.bg }]}>
      <Ionicons name={name} size={iconSize} color={toneMap.fg} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});
