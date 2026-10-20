import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { CurrencyText } from '../ui/CurrencyText';

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash', icon: 'cash-outline' },
  { value: 'UPI', label: 'UPI / QR', icon: 'qr-code-outline' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: 'card-outline' },
  { value: 'OTHER', label: 'Other', icon: 'ellipsis-horizontal-circle-outline' },
];

export interface PaymentFormData {
  amount: string;
  paymentMethod: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'OTHER';
  transactionRef?: string;
  notes?: string;
}

interface PaymentFormProps {
  balanceDue: number | string;
  onSubmit: (data: PaymentFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  balanceDue,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const maxAmount = Number(balanceDue) || 0;
  const [amount, setAmount] = useState(maxAmount > 0 ? maxAmount.toFixed(2) : '');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'BANK_TRANSFER' | 'OTHER'>('UPI');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      setError('Please enter a valid payment amount');
      return;
    }
    if (amountNum > maxAmount) {
      setError(`Payment amount cannot exceed remaining balance of ₹${maxAmount.toFixed(2)}`);
      return;
    }

    setError(null);
    onSubmit({
      amount: amountNum.toFixed(2),
      paymentMethod,
      transactionRef: transactionRef.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Record Payment</Text>
        <TouchableOpacity onPress={onCancel}>
          <Ionicons name="close" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.balanceInfo}>
        <Text style={styles.balanceLabel}>Remaining Balance Due:</Text>
        <CurrencyText amount={balanceDue} style={styles.balanceAmount} />
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={16} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <Input
        label="Payment Amount (₹) *"
        placeholder="e.g. 500"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />

      {/* Payment Method Selector */}
      <Text style={styles.methodLabel}>Payment Method</Text>
      <View style={styles.methodGrid}>
        {PAYMENT_METHODS.map((method) => {
          const isSelected = paymentMethod === method.value;
          return (
            <TouchableOpacity
              key={method.value}
              style={[styles.methodCard, isSelected && styles.selectedMethodCard]}
              onPress={() => setPaymentMethod(method.value as any)}
            >
              <Ionicons
                name={method.icon as any}
                size={20}
                color={isSelected ? Colors.white : Colors.primary}
              />
              <Text
                style={[
                  styles.methodText,
                  isSelected && styles.selectedMethodText,
                ]}
              >
                {method.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {paymentMethod === 'UPI' || paymentMethod === 'BANK_TRANSFER' ? (
        <Input
          label="Transaction Reference / UPI Ref (Optional)"
          placeholder="e.g. UPI-12345678"
          value={transactionRef}
          onChangeText={setTransactionRef}
        />
      ) : null}

      <Input
        label="Payment Notes (Optional)"
        placeholder="e.g. Received via GPay at shop"
        value={notes}
        onChangeText={setNotes}
      />

      <View style={styles.btnRow}>
        <Button
          label="Cancel"
          variant="outline"
          onPress={onCancel}
          style={styles.cancelBtn}
          disabled={isLoading}
        />
        <Button
          label="Record Payment"
          variant="primary"
          onPress={handleSubmit}
          loading={isLoading}
          style={styles.submitBtn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
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
  balanceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAF7F2',
    padding: Spacing.md,
    borderRadius: 14,
    marginBottom: Spacing.md,
  },
  balanceLabel: {
    ...Typography.subhead,
    color: Colors.textSecondary,
  },
  balanceAmount: {
    ...Typography.headline,
    fontWeight: '700',
    color: Colors.error,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF2F2',
    padding: Spacing.sm,
    borderRadius: 10,
    marginBottom: Spacing.sm,
  },
  errorText: {
    ...Typography.caption1,
    color: Colors.error,
    flex: 1,
  },
  methodLabel: {
    ...Typography.subhead,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  methodGrid: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  methodCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: 4,
    borderRadius: 12,
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  selectedMethodCard: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  methodText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
  },
  selectedMethodText: {
    color: Colors.white,
  },
  btnRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  cancelBtn: {
    flex: 1,
  },
  submitBtn: {
    flex: 1.5,
  },
});
