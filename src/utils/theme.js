// Shared design tokens: type scale, spacing, radii and shadows.
// Colors live in colors.js since they're theme-dependent; everything here is theme-agnostic.

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extraBold: 'Inter_800ExtraBold',
};

export const type = {
  display: { fontSize: 30, fontFamily: fonts.extraBold, letterSpacing: -0.4 },
  h1: { fontSize: 22, fontFamily: fonts.extraBold, letterSpacing: -0.3 },
  h2: { fontSize: 17, fontFamily: fonts.bold, letterSpacing: -0.1 },
  body: { fontSize: 14, fontFamily: fonts.regular },
  bodyMedium: { fontSize: 14, fontFamily: fonts.medium },
  small: { fontSize: 12.5, fontFamily: fonts.regular },
  caption: { fontSize: 11, fontFamily: fonts.bold, letterSpacing: 0.8, textTransform: 'uppercase' },
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 40 };

// Constant UTech brand colors for chrome that stays navy regardless of the light/dark toggle
// (the sidebar, hero panels) — as distinct from theme tokens in colors.js, which do flip.
export const brand = {
  navy: '#0E004E',
  navy2: '#2B1D8A',
  gold: '#FFD201',
  goldTint: 'rgba(255, 210, 1, 0.14)',
  onNavySecondary: '#B9B3E3',
  onNavyBorder: 'rgba(255, 255, 255, 0.14)',
};

export const radii = { sm: 8, md: 10, lg: 14, xl: 18, pill: 999 };

export const shadow = {
  card: {
    shadowColor: '#0E004E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  raised: {
    shadowColor: '#0E004E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 6,
  },
};
