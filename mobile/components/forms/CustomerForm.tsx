import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { normalizeIndianPhone } from '../../lib/store/local-db';

const customerSchema = z.object({
  name: z.string().trim().min(2, 'Customer name must be at least 2 characters'),
  whatsappNumber: z
    .string()
    .trim()
    .refine(
      (val) => {
        const digits = val.replace(/[^0-9]/g, '');
        return digits.length >= 10 && digits.length <= 15;
      },
      { message: 'Enter a valid 10-digit WhatsApp mobile number' }
    ),
  altPhone: z.string().optional(),
  notes: z.string().optional(),
  consentGiven: z.boolean().default(true),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  initialValues?: Partial<CustomerFormValues>;
  onSubmit: (values: CustomerFormValues) => void;
  isLoading?: boolean;
  submitLabel?: string;
  duplicateError?: string | null;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  initialValues,
  onSubmit,
  isLoading = false,
  submitLabel = 'Save Customer',
  duplicateError,
}) => {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: initialValues?.name || '',
      whatsappNumber: initialValues?.whatsappNumber || '+91',
      altPhone: initialValues?.altPhone || '',
      notes: initialValues?.notes || '',
      consentGiven: initialValues?.consentGiven ?? true,
    },
  });

  const consentGiven = watch('consentGiven');

  const handleFormSubmit = (values: CustomerFormValues) => {
    const formattedPhone = normalizeIndianPhone(values.whatsappNumber);
    onSubmit({
      ...values,
      name: values.name.trim(),
      whatsappNumber: formattedPhone,
      altPhone: values.altPhone?.trim() || undefined,
      notes: values.notes?.trim() || undefined,
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {duplicateError ? (
        <View style={styles.duplicateBanner}>
          <Ionicons name="warning" size={20} color={Colors.warning} />
          <Text style={styles.duplicateText}>{duplicateError}</Text>
        </View>
      ) : null}

      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Customer Full Name *"
            placeholder="e.g. Priya Sharma"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.name?.message}
            leftIcon="person-outline"
          />
        )}
      />

      <Controller
        control={control}
        name="whatsappNumber"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="WhatsApp Number *"
            placeholder="+91 98765 43210"
            keyboardType="phone-pad"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.whatsappNumber?.message}
            hint="Used for automated order status & pickup notifications"
            leftIcon="logo-whatsapp"
          />
        )}
      />

      <Controller
        control={control}
        name="altPhone"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Alternate Phone Number (Optional)"
            placeholder="Secondary contact number"
            keyboardType="phone-pad"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.altPhone?.message}
            leftIcon="call-outline"
          />
        )}
      />

      <Controller
        control={control}
        name="notes"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Measurements & Styling Notes (Optional)"
            placeholder="e.g. Chest: 36, Waist: 30, Blouse Length: 14.5, Prefers deep neck with piping..."
            multiline
            numberOfLines={4}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
          />
        )}
      />

      {/* WhatsApp Consent Toggle */}
      <TouchableOpacity
        style={styles.consentRow}
        onPress={() => setValue('consentGiven', !consentGiven)}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, consentGiven && styles.checkboxChecked]}>
          {consentGiven ? (
            <Ionicons name="checkmark" size={16} color={Colors.white} />
          ) : null}
        </View>
        <View style={styles.consentTextContainer}>
          <Text style={styles.consentTitle}>
            Customer has given consent to receive WhatsApp notifications
          </Text>
          <Text style={styles.consentSubtitle}>
            Sends automatic receipts when order is registered, completed, and delivered.
          </Text>
        </View>
      </TouchableOpacity>

      <Button
        label={submitLabel}
        variant="primary"
        size="lg"
        onPress={handleSubmit(handleFormSubmit)}
        loading={isLoading}
        style={styles.submitButton}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  duplicateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#FFF8E6',
    borderWidth: 1,
    borderColor: Colors.warning,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  duplicateText: {
    ...Typography.subhead,
    color: '#995C00',
    flex: 1,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FAF7F2',
    padding: Spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
  },
  consentTextContainer: {
    flex: 1,
  },
  consentTitle: {
    ...Typography.subhead,
    fontWeight: '600',
    color: Colors.text,
  },
  consentSubtitle: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  submitButton: {
    marginTop: Spacing.sm,
  },
});
