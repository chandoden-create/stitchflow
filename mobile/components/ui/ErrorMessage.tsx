import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { BorderRadius, Spacing } from '@/theme/spacing';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  style?: ViewStyle;
  compact?: boolean;
}

export function ErrorMessage({ message, onRetry, style, compact = false }: ErrorMessageProps) {
  if (compact) {
    return (
      <View style={[styles.compactContainer, style]}>
        <Ionicons name="alert-circle" size={14} color={Colors.error} />
        <Text style={styles.compactText}>{message}</Text>
        {onRetry && (
          <TouchableOpacity onPress={onRetry}>
            <Text style={styles.retryTextCompact}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconWrapper}>
        <Ionicons name="alert-circle-outline" size={40} color={Colors.error} style={{ opacity: 0.7 }} />
      </View>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
          <Ionicons name="refresh-outline" size={16} color={Colors.primary} />
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: Spacing[6],
    flex: 1,
    justifyContent: 'center',
  },
  iconWrapper: {
    marginBottom: Spacing[3],
  },
  title: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: Spacing[2],
    textAlign: 'center',
  },
  message: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginTop: Spacing[4],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  retryText: {
    ...Typography.bodySemibold,
    color: Colors.primary,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: '#FFE8E7',
    borderRadius: BorderRadius.sm,
    padding: Spacing[2],
  },
  compactText: {
    ...Typography.caption,
    color: Colors.error,
    flex: 1,
  },
  retryTextCompact: {
    ...Typography.captionMedium,
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
});
