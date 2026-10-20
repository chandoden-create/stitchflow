import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';
import { StatusBadge } from '../ui/StatusBadge';
import { CurrencyText } from '../ui/CurrencyText';
import { formatDate } from '../../lib/utils/date';

interface RecentOrdersProps {
  orders: any[];
  onOrderPress: (id: string) => void;
  onViewAllPress: () => void;
}

export const RecentOrders: React.FC<RecentOrdersProps> = ({
  orders,
  onOrderPress,
  onViewAllPress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recently Updated Orders</Text>
        <TouchableOpacity onPress={onViewAllPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="receipt-outline" size={32} color={Colors.placeholder} />
          <Text style={styles.emptyText}>No orders received yet today</Text>
        </View>
      ) : (
        orders.map((order) => (
          <TouchableOpacity
            key={order.id}
            style={styles.orderRow}
            onPress={() => onOrderPress(order.id)}
            activeOpacity={0.7}
          >
            <View style={styles.orderInfo}>
              <View style={styles.orderNumberRow}>
                <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.customerName}>{order.customer?.name}</Text>
              </View>
              <Text style={styles.dateText}>
                {formatDate(order.createdAt)} • {order._count?.items || order.items?.length || 1} items
              </Text>
            </View>

            <View style={styles.orderRight}>
              <CurrencyText amount={order.finalTotal} style={styles.amount} />
              <StatusBadge status={order.status} size="sm" />
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: Spacing.lg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.headline,
    color: Colors.text,
  },
  viewAll: {
    ...Typography.subhead,
    color: Colors.primary,
    fontWeight: '600',
  },
  emptyCard: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  orderInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  orderNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderNumber: {
    ...Typography.subhead,
    fontWeight: '700',
    color: Colors.primary,
  },
  dot: {
    color: Colors.textSecondary,
  },
  customerName: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '600',
  },
  dateText: {
    ...Typography.caption2,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  orderRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amount: {
    ...Typography.subhead,
    fontWeight: '700',
    color: Colors.text,
  },
});
