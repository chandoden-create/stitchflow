import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';
import { StatusBadge } from '../ui/StatusBadge';
import { CurrencyText } from '../ui/CurrencyText';
import { formatDate } from '../../lib/utils/date';

interface OrderCardProps {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    finalTotal: string | number;
    balanceDue: string | number;
    createdAt: string;
    dueDate?: string | null;
    customer?: {
      name: string;
      whatsappNumber: string;
    };
    items?: any[];
    _count?: {
      items: number;
    };
  };
  onPress: () => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, onPress }) => {
  const itemCount = order._count?.items ?? order.items?.length ?? 0;
  const hasBalance = Number(order.balanceDue) > 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.topRow}>
        <View style={styles.numberBlock}>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          <Text style={styles.dateText}>{formatDate(order.createdAt)}</Text>
        </View>
        <StatusBadge status={order.status} size="sm" />
      </View>

      <View style={styles.middleRow}>
        <View style={styles.customerInfo}>
          <Ionicons name="person-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.customerName} numberOfLines={1}>
            {order.customer?.name || 'Customer'}
          </Text>
        </View>

        <View style={styles.itemsInfo}>
          <Ionicons name="shirt-outline" size={15} color={Colors.textSecondary} />
          <Text style={styles.itemText}>
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </Text>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <View>
          <Text style={styles.totalLabel}>Total Bill</Text>
          <CurrencyText amount={order.finalTotal} style={styles.totalAmount} />
        </View>

        <View style={styles.balanceContainer}>
          {hasBalance ? (
            <View style={styles.balanceBadge}>
              <Text style={styles.balanceLabel}>Balance Due: </Text>
              <CurrencyText amount={order.balanceDue} style={styles.balanceAmount} />
            </View>
          ) : (
            <View style={styles.paidBadge}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
              <Text style={styles.paidText}>Fully Paid</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 110, 0.3)', // Luxury gold edge
    shadowColor: '#6B2D3E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  numberBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  orderNumber: {
    ...Typography.subhead,
    fontWeight: '700',
    color: Colors.primary,
  },
  dateText: {
    ...Typography.caption2,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  middleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: Spacing.sm,
  },
  customerName: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '600',
  },
  itemsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemText: {
    ...Typography.caption1,
    color: Colors.textSecondary,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  totalLabel: {
    ...Typography.caption2,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  totalAmount: {
    ...Typography.headline,
    fontWeight: '700',
    color: Colors.text,
  },
  balanceContainer: {
    alignItems: 'flex-end',
  },
  balanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF2F2',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: 8,
  },
  balanceLabel: {
    ...Typography.caption2,
    color: Colors.error,
    fontWeight: '600',
  },
  balanceAmount: {
    ...Typography.caption1,
    color: Colors.error,
    fontWeight: '700',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: 8,
  },
  paidText: {
    ...Typography.caption2,
    color: Colors.success,
    fontWeight: '600',
  },
});
