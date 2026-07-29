import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { fonts, radii, spacing } from '../../utils/theme';

// variant: 'primary' | 'accent' | 'ghost' | 'danger'   size: 'md' | 'sm'
export default function Button({ label, onPress, variant = 'primary', size = 'md', icon, disabled, loading, style, fullWidth }) {
  const { colors, isDarkTheme } = useAppTheme();

  const palette = {
    primary: { bg: colors.primary, text: isDarkTheme ? '#1A1400' : '#FFFFFF', border: colors.primary },
    accent: { bg: colors.accent, text: '#1A1400', border: colors.accent },
    ghost: { bg: 'transparent', text: colors.text, border: colors.border },
    danger: { bg: colors.dangerTint, text: colors.danger, border: colors.dangerTint },
  }[variant];

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.base,
        size === 'sm' ? styles.sm : styles.md,
        { backgroundColor: palette.bg, borderColor: palette.border },
        fullWidth && { alignSelf: 'stretch' },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.text} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={size === 'sm' ? 14 : 16} color={palette.text} style={{ marginRight: 7 }} />}
          <Text style={[styles.label, size === 'sm' && styles.labelSm, { color: palette.text }]}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
  },
  md: { paddingVertical: 12, paddingHorizontal: spacing.xl },
  sm: { paddingVertical: 8, paddingHorizontal: spacing.md },
  label: { fontFamily: fonts.bold, fontSize: 14 },
  labelSm: { fontSize: 12.5 },
});
