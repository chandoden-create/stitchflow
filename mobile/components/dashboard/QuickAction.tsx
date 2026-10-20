import React from 'react';
import { Text, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';

interface QuickActionProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accent?: boolean;
}

export const QuickAction: React.FC<QuickActionProps> = ({
  label,
  icon,
  onPress,
  accent = false,
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, accent && styles.accentButton]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <View
        style={[
          styles.iconCircle,
          accent ? styles.accentIconCircle : styles.defaultIconCircle,
        ]}
      >
        <Ionicons
          name={icon}
          size={22}
          color={accent ? '#FDFAF6' : '#6B2D3E'}
        />
      </View>
      <Text
        style={[
          styles.label,
          accent ? styles.accentLabel : styles.defaultLabel,
        ]}
        numberOfLines={2}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flex: 1,
    minWidth: 80,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 110, 0.35)', // Champagne gold trim
    shadowColor: '#6B2D3E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  accentButton: {
    backgroundColor: '#6B2D3E', // Royal Burgundy
    borderColor: '#C9A96E', // Gold outline
    shadowColor: '#4A1525',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 5,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  defaultIconCircle: {
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 110, 0.3)',
  },
  accentIconCircle: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 110, 0.5)',
  },
  label: {
    ...Typography.caption1,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  defaultLabel: {
    color: '#1C1C1E',
  },
  accentLabel: {
    color: '#FDFAF6',
  },
});
