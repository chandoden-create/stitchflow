import React from 'react';
import { View, Text, StyleSheet, Image, ViewStyle } from 'react-native';
import { Colors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { BorderRadius } from '@/theme/spacing';

interface AvatarProps {
  name: string;
  size?: number;
  imageUrl?: string;
  style?: ViewStyle;
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [
    '#6B2D3E', '#8B3D52', '#C9A96E', '#5C7A6B', '#7B6EA0',
    '#4A7C8A', '#8A6A4A', '#6A8A4A',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({ name, size = 40, imageUrl, style }: AvatarProps) {
  const initials = getInitials(name);
  const bgColor = getAvatarColor(name);
  const fontSize = size * 0.38;

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[{ width: size, height: size, borderRadius: size / 2 }, style as any]}
      />
    );
  }

  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor },
        style,
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: Colors.white,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
