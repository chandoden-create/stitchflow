import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { BorderRadius, Spacing } from '@/theme/spacing';

type BadgeVariant = 'default' | 'primary' | 'gold' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  style?: ViewStyle;
  dot?: boolean;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
  default: { bg: Colors.border, text: Colors.textSecondary, dot: Colors.textSecondary },
  primary: { bg: '#F3E8EB', text: Colors.primary, dot: Colors.primary },
  gold: { bg: '#FDF8ED', text: Colors.gold, dot: Colors.gold },
  success: { bg: '#E8F5E9', text: Colors.success, dot: Colors.success },
  warning: { bg: '#FFF3E0', text: Colors.warning, dot: Colors.warning },
  error: { bg: '#FFE8E7', text: Colors.error, dot: Colors.error },
  info: { bg: '#E8F1FF', text: Colors.info, dot: Colors.info },
  neutral: { bg: '#F2F2F7', text: '#8E8E93', dot: '#8E8E93' },
};

export function Badge({ label, variant = 'default', size = 'md', style, dot = false }: BadgeProps) {
  const colors = variantColors[variant];
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors.bg },
        size === 'sm' && styles.badgeSm,
        style,
      ]}
    >
      {dot && <View style={[styles.dot, { backgroundColor: colors.dot }]} />}
      <Text style={[styles.text, { color: colors.text }, size === 'sm' && styles.textSm]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: Spacing[1],
  },
  text: {
    ...Typography.captionMedium,
  },
  textSm: {
    ...Typography.micro,
    fontWeight: '600',
  },
});
