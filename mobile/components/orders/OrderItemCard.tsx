import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';
import { CurrencyText } from '../ui/CurrencyText';
import { getGarmentTypeConfig } from '../../lib/constants/garmentTypes';

interface OrderItemCardProps {
  item: {
    id?: string;
    garmentType: string;
    description: string;
    quantity: number;
    unitPrice: string | number;
    lineTotal?: string | number;
    notes?: string | null;
    photos?: Array<{ id: string; storageKey: string; uri?: string }>;
    localPhotoUri?: string;
  };
  onDelete?: () => void;
  onPhotoPress?: (uri: string) => void;
  index?: number;
}

export const OrderItemCard: React.FC<OrderItemCardProps> = ({
  item,
  onDelete,
  onPhotoPress,
  index,
}) => {
  const garmentConfig = getGarmentTypeConfig(item.garmentType);
  const photoUri =
    (item as any).photoUri ||
    item.localPhotoUri ||
    (item.photos?.[0] as any)?.presignedUrl ||
    (item.photos?.[0] as any)?.url ||
    item.photos?.[0]?.uri;
  const lineTotal = item.lineTotal ?? (Number(item.quantity) * Number(item.unitPrice));

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.typeBadge}>
          <Ionicons
            name={garmentConfig?.icon as any || 'shirt-outline'}
            size={16}
            color={Colors.primary}
          />
          <Text style={styles.typeLabel}>
            {garmentConfig?.label || item.garmentType}
          </Text>
        </View>

        {onDelete ? (
          <TouchableOpacity
            onPress={onDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={18} color={Colors.error} />
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={styles.description}>{item.description}</Text>

      {item.notes ? (
        <Text style={styles.notes}>Note: {item.notes}</Text>
      ) : null}

      {photoUri ? (
        <TouchableOpacity
          onPress={() => onPhotoPress?.(photoUri)}
          activeOpacity={0.8}
          style={styles.photoContainer}
        >
          <Image source={{ uri: photoUri }} style={styles.thumbnail} />
          <View style={styles.photoOverlay}>
            <Ionicons name="camera" size={14} color={Colors.white} />
            <Text style={styles.photoLabel}>Garment Photo</Text>
          </View>
        </TouchableOpacity>
      ) : null}

      <View style={styles.bottomRow}>
        <Text style={styles.qtyPriceText}>
          {item.quantity} × <CurrencyText amount={item.unitPrice} />
        </Text>
        <CurrencyText amount={lineTotal} style={styles.lineTotal} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3E8EC',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typeLabel: {
    ...Typography.caption1,
    fontWeight: '700',
    color: Colors.primary,
  },
  description: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text,
    marginVertical: 4,
  },
  notes: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  photoContainer: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    height: 100,
    width: '100%',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    resizeMode: 'cover',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  photoLabel: {
    ...Typography.caption2,
    color: Colors.white,
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  qtyPriceText: {
    ...Typography.caption1,
    color: Colors.textSecondary,
  },
  lineTotal: {
    ...Typography.subhead,
    fontWeight: '700',
    color: Colors.text,
  },
});
