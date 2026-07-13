import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { fonts, radii, spacing } from '../../utils/theme';

export default function Input({ label, style, containerStyle, ...props }) {
  const { colors } = useAppTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={containerStyle}>
      {label ? <Text style={[styles.label, { color: colors.text }]}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textSecondary}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        style={[
          styles.input,
          {
            backgroundColor: colors.background,
            borderColor: focused ? colors.primary : colors.border,
            color: colors.text,
          },
          focused && { backgroundColor: colors.cardBackground },
          style,
        ]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: fonts.bold, fontSize: 11.5, marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderRadius: radii.md,
    paddingVertical: 11,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
});
