import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { radii } from '../../utils/theme';

export default function ProgressBar({ progress = 0, height = 8, style }) {
  const { colors } = useAppTheme();
  const pct = Math.max(0, Math.min(1, progress)) * 100;
  return (
    <View style={[styles.track, { height, backgroundColor: colors.surfaceAlt }, style]}>
      <View style={[styles.fill, { width: `${pct}%`, height, backgroundColor: colors.primary }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { borderRadius: radii.pill, overflow: 'hidden', width: '100%' },
  fill: { borderRadius: radii.pill },
});
