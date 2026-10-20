import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../theme/colors';
import { Typography } from '../../../theme/typography';
import { Spacing } from '../../../theme/spacing';
import { CustomerForm, CustomerFormData } from '../../../components/forms/CustomerForm';
import { customersApi } from '../../../lib/api/customers.api';

export default function NewCustomerScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (data: CustomerFormData) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const customer = await customersApi.create({
        name: data.name,
        whatsappNumber: data.whatsappNumber,
        altPhone: data.altPhone || undefined,
        notes: data.notes || undefined,
        consentGiven: data.consentGiven,
      });

      Alert.alert(
        'Customer Registered',
        `${customer.name} has been added successfully. Would you like to create an order now?`,
        [
          {
            text: 'View Profile',
            onPress: () => router.replace(`/(tabs)/customers/${customer.id}` as any),
          },
          {
            text: 'Create Order',
            onPress: () => router.replace(`/(tabs)/orders/new?customerId=${customer.id}` as any),
            style: 'default',
          },
        ],
      );
    } catch (err: any) {
      const status = err.response?.status;
      const message = err.response?.data?.message || err.message || 'Failed to create customer';

      if (status === 409) {
        setErrorMessage(
          'A customer with this WhatsApp number already exists. Returning customers do not need duplicate registration.',
        );
      } else {
        setErrorMessage(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Register Customer</Text>
          </View>

          <Text style={styles.subtitle}>
            Register the customer using her WhatsApp number. Customers do not need to install the app.
          </Text>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={Colors.error} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <CustomerForm
              onSubmit={handleSubmit}
              isLoading={isLoading}
              submitLabel="Save Customer & Continue"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl + 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xs,
    paddingTop: Spacing.xs,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  title: {
    ...Typography.title2,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    paddingHorizontal: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF2F2',
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.md,
  },
  errorText: {
    ...Typography.caption1,
    color: Colors.error,
    flex: 1,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
});
