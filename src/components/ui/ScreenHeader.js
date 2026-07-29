import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { fonts, spacing } from '../../utils/theme';

export default function ScreenHeader({ title, subtitle, right }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.lg, gap: spacing.md },
  title: { fontFamily: fonts.extraBold, fontSize: 22, letterSpacing: -0.3 },
  subtitle: { fontFamily: fonts.regular, fontSize: 13, marginTop: 3 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
