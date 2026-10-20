import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  accentColor?: string;
  onPress?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtitle,
  accentColor = '#6B2D3E',
  onPress,
}) => {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.82 : 1}
    >
      <View style={[styles.accentLine, { backgroundColor: accentColor }]} />
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, { color: accentColor }]}>{value}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 110, 0.25)', // Subtle gold border
    shadowColor: '#6B2D3E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: Spacing.md,
  },
  accentLine: {
    height: 4,
    width: '100%',
  },
  content: {
    padding: 16,
  },
  label: {
    ...Typography.caption1,
    color: '#8A7A7E',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontSize: 11,
  },
  value: {
    ...Typography.title2,
    fontWeight: '800',
    marginTop: 6,
    fontSize: 24,
  },
  subtitle: {
    ...Typography.caption2,
    color: '#8A7A7E',
    marginTop: 4,
  },
});
