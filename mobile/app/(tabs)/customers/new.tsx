import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../theme/colors';
import { Typography } from '../../../theme/typography';
import { Spacing } from '../../../theme/spacing';
import { customersApi, type Customer } from '../../../lib/api/customers.api';
import {
  CustomerForm,
  CustomerFormValues,
} from '../../../components/forms/CustomerForm';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';

export default function NewCustomerScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [savedCustomer, setSavedCustomer] = useState<Customer | null>(null);

  const createMutation = useMutation({
    mutationFn: (values: CustomerFormValues) =>
      customersApi.create({
        name: values.name,
        whatsappNumber: values.whatsappNumber,
        altPhone: values.altPhone || undefined,
        notes: values.notes || undefined,
        consentGiven: values.consentGiven,
      }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['customers-list'] });
      queryClient.invalidateQueries({ queryKey: ['customers-selector'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setSavedCustomer(created);
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Could not create customer';
      setDuplicateError(msg);
    },
  });

  const handleSubmit = (values: CustomerFormValues) => {
    setDuplicateError(null);
    createMutation.mutate(values);
  };

  if (savedCustomer) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.successContainer}>
          <Card style={styles.successCard}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
            </View>
            <Text style={styles.successTitle}>Customer Saved!</Text>
            <Text style={styles.successName}>{savedCustomer.name}</Text>
            <Text style={styles.successPhone}>{savedCustomer.whatsappNumber}</Text>
            {savedCustomer.notes ? (
              <View style={styles.notesPreview}>
                <Text style={styles.notesPreviewLabel}>Measurements & Notes:</Text>
                <Text style={styles.notesPreviewText}>{savedCustomer.notes}</Text>
              </View>
            ) : null}

            <View style={styles.successActions}>
              <Button
                label="Create Stitching Order Now"
                variant="primary"
                size="lg"
                onPress={() => {
                  const id = savedCustomer.id;
                  setSavedCustomer(null);
                  router.replace(`/(tabs)/orders/new?customerId=${id}` as any);
                }}
              />
              <Button
                label="View Customer Profile"
                variant="outline"
                size="md"
                onPress={() => {
                  const id = savedCustomer.id;
                  setSavedCustomer(null);
                  router.replace(`/(tabs)/customers/${id}` as any);
                }}
              />
              <Button
                label="Back to Customers List"
                variant="ghost"
                size="md"
                onPress={() => {
                  setSavedCustomer(null);
                  router.replace('/(tabs)/customers' as any);
                }}
              />
            </View>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Customer</Text>
        <View style={{ width: 40 }} />
      </View>

      <CustomerForm
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending}
        submitLabel="Save Customer"
        duplicateError={duplicateError}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    backgroundColor: Colors.surface,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.headline,
    color: Colors.text,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  successCard: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#E8F8EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  successTitle: {
    ...Typography.title2,
    fontWeight: '800',
    color: Colors.text,
  },
  successName: {
    ...Typography.title3,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
  successPhone: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  notesPreview: {
    width: '100%',
    backgroundColor: '#FAF7F2',
    padding: Spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  notesPreviewLabel: {
    ...Typography.caption1,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  notesPreviewText: {
    ...Typography.subhead,
    color: Colors.text,
  },
  successActions: {
    width: '100%',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
});
