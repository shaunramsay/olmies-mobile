import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { IconChip, ScreenHeader } from '../../components/ui';
import { fonts, radii, spacing } from '../../utils/theme';

export default function CampusMapScreen() {
  const { colors } = useAppTheme();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <ScreenHeader title="Campus Map" subtitle="Find any building, service or vendor on the Papine campus." />
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <Ionicons name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search locations, buildings, rooms..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={[styles.mapPlaceholder, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <IconChip name="phone-portrait-outline" tone="navy" size={64} iconSize={28} />
        <Text style={[styles.mapTitle, { color: colors.text }]}>Best viewed on the mobile app</Text>
        <Text style={[styles.mapSubtitle, { color: colors.textSecondary }]}>
          The interactive campus map uses native hardware rendering for smooth, accurate directions and is only available on iOS and Android. Open Campus Companion on your phone to explore the map, get walking directions, and contribute new pins.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    height: 44,
    marginBottom: spacing.lg,
    borderWidth: 1.5,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.regular,
    height: '100%',
    outlineStyle: 'none',
  },
  mapPlaceholder: {
    flex: 1,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    borderRadius: radii.xl,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  mapTitle: {
    fontSize: 17,
    fontFamily: fonts.extraBold,
    marginTop: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  mapSubtitle: {
    fontSize: 13.5,
    fontFamily: fonts.regular,
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 420,
  },
});
