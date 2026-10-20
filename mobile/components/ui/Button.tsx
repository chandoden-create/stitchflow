import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
  View,
} from 'react-native';
import { Colors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { Spacing } from '@/theme/spacing';

type Variant = 'primary' | 'secondary' | 'gold' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  title?: string;
  label?: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  title,
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  fullWidth = false,
  disabled,
  ...props
}: ButtonProps) {
  const buttonText = title || label || '';
  const isDisabled = disabled || loading;

  const isPrimary = variant === 'primary';
  const isGold = variant === 'gold' || variant === 'secondary';
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';
  const isDanger = variant === 'danger';

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      disabled={isDisabled}
      style={[
        styles.base,
        isPrimary && styles.primaryContainer,
        isGold && styles.goldContainer,
        isOutline && styles.outlineContainer,
        isGhost && styles.ghostContainer,
        isDanger && styles.dangerContainer,
        size === 'sm' && styles.sizeSm,
        size === 'md' && styles.sizeMd,
        size === 'lg' && styles.sizeLg,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isOutline || isGhost ? Colors.primary : Colors.white}
        />
      ) : (
        <View style={styles.innerContent}>
          {leftIcon ? <View style={styles.iconWrapper}>{leftIcon}</View> : null}
          <Text
            style={[
              styles.baseText,
              isPrimary && styles.primaryText,
              isGold && styles.goldText,
              isOutline && styles.outlineText,
              isGhost && styles.ghostText,
              isDanger && styles.dangerText,
              size === 'sm' && styles.textSm,
              size === 'md' && styles.textMd,
              size === 'lg' && styles.textLg,
              textStyle,
            ]}
          >
            {buttonText}
          </Text>
          {rightIcon ? <View style={styles.iconWrapper}>{rightIcon}</View> : null}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24, // Luxury rounded pill
    flexDirection: 'row',
  },
  innerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    marginHorizontal: 5,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.55,
  },

  /* Containers */
  primaryContainer: {
    backgroundColor: '#6B2D3E', // Royal Burgundy
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 110, 0.45)', // Subtle luxury gold edge
    shadowColor: '#4A1525',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  goldContainer: {
    backgroundColor: '#C9A96E', // Champagne Gold
    borderWidth: 1,
    borderColor: '#E2CE9F',
    shadowColor: '#C9A96E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  outlineContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1.5,
    borderColor: '#6B2D3E',
  },
  ghostContainer: {
    backgroundColor: 'transparent',
  },
  dangerContainer: {
    backgroundColor: '#E03131',
    shadowColor: '#E03131',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },

  /* Sizes */
  sizeSm: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  sizeMd: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 26,
  },
  sizeLg: {
    paddingVertical: 17,
    paddingHorizontal: 30,
    borderRadius: 30,
  },

  /* Typography */
  baseText: {
    fontWeight: '600',
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  primaryText: {
    color: '#FDFAF6', // Ivory
  },
  goldText: {
    color: '#1C1C1E',
    fontWeight: '700',
  },
  outlineText: {
    color: '#6B2D3E',
  },
  ghostText: {
    color: '#6B2D3E',
  },
  dangerText: {
    color: '#FFFFFF',
  },
  textSm: {
    fontSize: 13,
  },
  textMd: {
    fontSize: 15,
  },
  textLg: {
    fontSize: 17,
  },
});
