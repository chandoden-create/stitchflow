import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/theme/colors';
import { BorderRadius, Spacing } from '@/theme/spacing';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = BorderRadius.sm, style }: SkeletonProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width: width as number, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

interface CardSkeletonProps {
  style?: ViewStyle;
}

export function CardSkeleton({ style }: CardSkeletonProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.row}>
        <Skeleton width={44} height={44} borderRadius={22} />
        <View style={styles.flex}>
          <Skeleton height={14} width="60%" style={styles.mb1} />
          <Skeleton height={12} width="40%" />
        </View>
      </View>
      <Skeleton height={12} style={styles.mt2} />
      <Skeleton height={12} width="80%" style={styles.mt1} />
    </View>
  );
}

export function LoadingSkeleton({ width, height, borderRadius, style }: SkeletonProps = {}) {
  if (width !== undefined || height !== undefined) {
    return <Skeleton width={width} height={height} borderRadius={borderRadius} style={style} />;
  }
  return (
    <View style={styles.container}>
      {[0, 1, 2, 3].map((i) => (
        <CardSkeleton key={i} style={styles.cardSpacing} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.border,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardSpacing: {
    marginBottom: Spacing[3],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  flex: {
    flex: 1,
  },
  mb1: { marginBottom: Spacing[2] },
  mt1: { marginTop: Spacing[1] },
  mt2: { marginTop: Spacing[3] },
  container: { padding: Spacing[4] },
});
