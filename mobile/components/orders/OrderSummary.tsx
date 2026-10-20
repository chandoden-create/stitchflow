import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';
import { CurrencyText } from '../ui/CurrencyText';

interface OrderSummaryProps {
  distinctItemsCount: number;
  totalQuantity: number;
  subtotal: number | string;
  discount?: number | string;
  additionalCharges?: number | string;
  finalTotal: number | string;
  advanceAmount?: number | string;
  balanceDue: number | string;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  distinctItemsCount,
  totalQuantity,
  subtotal,
  discount = 0,
  additionalCharges = 0,
  finalTotal,
  advanceAmount = 0,
  balanceDue,
}) => {
  const hasDiscount = Number(discount) > 0;
  const hasAdditional = Number(additionalCharges) > 0;
  const hasAdvance = Number(advanceAmount) > 0;
  const hasBalance = Number(balanceDue) > 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order Summary</Text>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          {distinctItemsCount} distinct {distinctItemsCount === 1 ? 'item' : 'items'}
        </Text>
        <Text style={styles.dot}>•</Text>
        <Text style={styles.metaText}>
          {totalQuantity} total {totalQuantity === 1 ? 'garment' : 'garments'}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <Text style={styles.rowLabel}>Subtotal</Text>
        <CurrencyText amount={subtotal} style={styles.rowValue} />
      </View>

      {hasDiscount ? (
        <View style={styles.row}>
          <Text style={[styles.rowLabel, styles.discountLabel]}>Discount</Text>
          <Text style={styles.discountValue}>
            - <CurrencyText amount={discount} />
          </Text>
        </View>
      ) : null}

      {hasAdditional ? (
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Additional Charges</Text>
          <Text style={styles.rowValue}>
            + <CurrencyText amount={additionalCharges} />
          </Text>
        </View>
      ) : null}

      <View style={styles.thickDivider} />

      <View style={styles.row}>
        <Text style={styles.totalLabel}>Final Total</Text>
        <CurrencyText amount={finalTotal} style={styles.totalValue} />
      </View>

      {hasAdvance ? (
        <View style={styles.row}>
          <Text style={styles.advanceLabel}>Advance Paid</Text>
          <CurrencyText amount={advanceAmount} style={styles.advanceValue} />
        </View>
      ) : null}

      <View style={styles.balanceContainer}>
        <Text style={styles.balanceLabel}>Balance Due</Text>
        <CurrencyText
          amount={balanceDue}
          style={[
            styles.balanceValue,
            { color: hasBalance ? Colors.error : Colors.success },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
    marginVertical: Spacing.md,
  },
  title: {
    ...Typography.headline,
    color: Colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  metaText: {
    ...Typography.caption1,
    color: Colors.textSecondary,
  },
  dot: {
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.md,
  },
  thickDivider: {
    height: 1.5,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  rowLabel: {
    ...Typography.subhead,
    color: Colors.textSecondary,
  },
  rowValue: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '600',
  },
  discountLabel: {
    color: Colors.success,
  },
  discountValue: {
    ...Typography.subhead,
    color: Colors.success,
    fontWeight: '600',
  },
  totalLabel: {
    ...Typography.headline,
    fontWeight: '700',
    color: Colors.text,
  },
  totalValue: {
    ...Typography.title3,
    fontWeight: '700',
    color: Colors.primary,
  },
  advanceLabel: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  advanceValue: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 4,
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAF7F2',
    padding: Spacing.md,
    borderRadius: 14,
    marginTop: Spacing.md,
  },
  balanceLabel: {
    ...Typography.headline,
    fontWeight: '700',
    color: Colors.text,
  },
  balanceValue: {
    ...Typography.headline,
    fontWeight: '800',
  },
});
