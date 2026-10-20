import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';
import { CurrencyText } from '../ui/CurrencyText';

interface CustomerStatsProps {
  stats: {
    totalOrders: number;
    totalBilled: string | number;
    totalPaid: string | number;
    outstanding: string | number;
  };
}

export const CustomerStats: React.FC<CustomerStatsProps> = ({ stats }) => {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.item}>
          <Text style={styles.label}>Total Orders</Text>
          <Text style={styles.value}>{stats.totalOrders}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.item}>
          <Text style={styles.label}>Total Billed</Text>
          <CurrencyText amount={stats.totalBilled} style={styles.value} />
        </View>
      </View>

      <View style={styles.horizontalDivider} />

      <View style={styles.row}>
        <View style={styles.item}>
          <Text style={styles.label}>Total Paid</Text>
          <CurrencyText
            amount={stats.totalPaid}
            style={[styles.value, { color: Colors.success }]}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.item}>
          <Text style={styles.label}>Outstanding</Text>
          <CurrencyText
            amount={stats.outstanding}
            style={[
              styles.value,
              { color: Number(stats.outstanding) > 0 ? Colors.error : Colors.textSecondary },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  item: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: Spacing.md,
  },
  horizontalDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.md,
  },
  label: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  value: {
    ...Typography.headline,
    fontWeight: '700',
    color: Colors.text,
  },
});
