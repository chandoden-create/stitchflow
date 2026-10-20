import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

const customerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  whatsappNumber: z
    .string()
    .min(10, 'Enter a valid 10-digit mobile number')
    .regex(/^(\+91|91)?[6-9]\d{9}$/, 'Please enter a valid Indian mobile number'),
  altPhone: z.string().optional(),
  notes: z.string().max(500).optional(),
  consentGiven: z.boolean(),
});

export type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  initialValues?: Partial<CustomerFormData>;
  onSubmit: (data: CustomerFormData) => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  initialValues,
  onSubmit,
  isLoading = false,
  submitLabel = 'Save Customer',
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: initialValues?.name || '',
      whatsappNumber: initialValues?.whatsappNumber || '',
      altPhone: initialValues?.altPhone || '',
      notes: initialValues?.notes || '',
      consentGiven: initialValues?.consentGiven ?? true,
    },
  });

  return (
    <View style={styles.form}>
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Customer Full Name *"
            placeholder="e.g. Priya Sharma"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.name?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="whatsappNumber"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="WhatsApp Mobile Number *"
            placeholder="e.g. 9876543210"
            keyboardType="phone-pad"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.whatsappNumber?.message}
            hint="Used to identify returning customers & send order updates"
          />
        )}
      />

      <Controller
        control={control}
        name="altPhone"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Alternate Phone Number (Optional)"
            placeholder="e.g. 9123456780"
            keyboardType="phone-pad"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.altPhone?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="notes"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Customer Notes & Preferences"
            placeholder="e.g. Prefers boat-neck blouses, deep back cut"
            multiline
            numberOfLines={3}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.notes?.message}
          />
        )}
      />

      {/* WhatsApp Consent Row */}
      <Controller
        control={control}
        name="consentGiven"
        render={({ field: { onChange, value } }) => (
          <View style={styles.consentCard}>
            <View style={styles.consentInfo}>
              <View style={styles.consentTitleRow}>
                <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                <Text style={styles.consentTitle}>WhatsApp Notification Consent</Text>
              </View>
              <Text style={styles.consentDesc}>
                Customer agreed to receive order receipts, completion notices, and delivery updates via WhatsApp.
              </Text>
            </View>
            <Switch
              value={value}
              onValueChange={onChange}
              trackColor={{ false: Colors.border, true: '#25D366' }}
              thumbColor={Colors.white}
            />
          </View>
        )}
      />

      <Button
        label={submitLabel}
        onPress={handleSubmit(onSubmit)}
        loading={isLoading}
        style={styles.submitBtn}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  form: {
    gap: Spacing.sm,
  },
  consentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAF8',
    borderRadius: 14,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2F0E5',
    marginVertical: Spacing.sm,
  },
  consentInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  consentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  consentTitle: {
    ...Typography.subhead,
    fontWeight: '700',
    color: Colors.text,
  },
  consentDesc: {
    ...Typography.caption2,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  submitBtn: {
    marginTop: Spacing.md,
  },
});
