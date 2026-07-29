import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { fonts, radii } from '../../utils/theme';

// tone: 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'neutral'
export default function Badge({ label, tone = 'neutral', style }) {
  const { colors } = useAppTheme();

  const toneMap = {
    success: { bg: colors.successTint, fg: colors.success },
    warning: { bg: colors.warningTint, fg: colors.warning },
    danger: { bg: colors.dangerTint, fg: colors.danger },
    info: { bg: colors.infoTint, fg: colors.info },
    accent: { bg: colors.accentTint, fg: colors.accentInk },
    neutral: { bg: colors.surfaceAlt, fg: colors.secondary },
  }[tone];

  return (
    <View style={[styles.base, { backgroundColor: toneMap.bg }, style]}>
      <Text style={[styles.label, { color: toneMap.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: radii.pill, alignSelf: 'flex-start' },
  label: { fontFamily: fonts.bold, fontSize: 10.5, letterSpacing: 0.3 },
});
