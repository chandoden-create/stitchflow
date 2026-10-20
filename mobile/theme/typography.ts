import { Platform } from 'react-native';

export const FontFamily = {
  regular: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
  medium: Platform.select({ ios: 'System', android: 'Roboto-Medium', default: 'System' }),
  semibold: Platform.select({ ios: 'System', android: 'Roboto-Medium', default: 'System' }),
  bold: Platform.select({ ios: 'System', android: 'Roboto-Bold', default: 'System' }),
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 40,
} as const;

export const LineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;

export const Typography = {
  h1: { fontSize: FontSize['3xl'], fontWeight: '700' as const, lineHeight: 36 },
  h2: { fontSize: FontSize['2xl'], fontWeight: '700' as const, lineHeight: 32 },
  h3: { fontSize: FontSize.xl, fontWeight: '600' as const, lineHeight: 28 },
  h4: { fontSize: FontSize.lg, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontSize: FontSize.base, fontWeight: '400' as const, lineHeight: 22 },
  bodyMedium: { fontSize: FontSize.base, fontWeight: '500' as const, lineHeight: 22 },
  bodySemibold: { fontSize: FontSize.base, fontWeight: '600' as const, lineHeight: 22 },
  caption: { fontSize: FontSize.sm, fontWeight: '400' as const, lineHeight: 18 },
  captionMedium: { fontSize: FontSize.sm, fontWeight: '500' as const, lineHeight: 18 },
  label: { fontSize: FontSize.sm, fontWeight: '600' as const, lineHeight: 16 },
  micro: { fontSize: FontSize.xs, fontWeight: '400' as const, lineHeight: 14 },
  button: { fontSize: FontSize.base, fontWeight: '600' as const, lineHeight: 22 },
  buttonSm: { fontSize: FontSize.sm, fontWeight: '600' as const, lineHeight: 18 },

  // iOS-style typography aliases
  title1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
  title2: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
  title3: { fontSize: 20, fontWeight: '600' as const, lineHeight: 25 },
  headline: { fontSize: 17, fontWeight: '600' as const, lineHeight: 22 },
  subhead: { fontSize: 15, fontWeight: '400' as const, lineHeight: 20 },
  caption1: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  caption2: { fontSize: 11, fontWeight: '400' as const, lineHeight: 14 },
} as const;
