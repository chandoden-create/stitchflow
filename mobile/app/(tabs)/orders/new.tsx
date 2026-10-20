import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../theme/colors';
import { Typography } from '../../../theme/typography';
import { Spacing } from '../../../theme/spacing';
import { customersApi } from '../../../lib/api/customers.api';
import { ordersApi } from '../../../lib/api/orders.api';
import { OrderItemCard } from '../../../components/orders/OrderItemCard';
import { OrderSummary } from '../../../components/orders/OrderSummary';
import { OrderItemForm, OrderItemFormData } from '../../../components/forms/OrderItemForm';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { CurrencyText } from '../../../components/ui/CurrencyText';

export default function NewOrderScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ customerId?: string }>();

  // State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    params.customerId || null,
  );
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [items, setItems] = useState<OrderItemFormData[]>([]);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [discount, setDiscount] = useState('');
  const [additionalCharges, setAdditionalCharges] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<any | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (params.customerId) {
      setSelectedCustomerId(params.customerId);
    }
  }, [params.customerId]);

  // Fetch customers for selector
  const { data: customersData } = useQuery({
    queryKey: ['customers-selector', customerSearch],
    queryFn: () => customersApi.getAll({ search: customerSearch || undefined, limit: 10 }),
  });

  // Selected customer details
  const { data: selectedCustomer } = useQuery({
    queryKey: ['customer-selected', selectedCustomerId],
    queryFn: () => customersApi.getById(selectedCustomerId!),
    enabled: !!selectedCustomerId,
  });

  // Automatically calculate live totals using decimal-safe logic
  const distinctItemsCount = items.length;
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = items.reduce((sum, item) => {
    return sum + item.quantity * (parseFloat(item.unitPrice) || 0);
  }, 0);

  const discountNum = parseFloat(discount) || 0;
  const additionalChargesNum = parseFloat(additionalCharges) || 0;
  const finalTotal = Math.max(0, subtotal - discountNum + additionalChargesNum);
  const advanceNum = parseFloat(advanceAmount) || 0;
  const balanceDue = Math.max(0, finalTotal - advanceNum);

  const handleAddItem = (item: OrderItemFormData) => {
    setItems((prev) => [...prev, item]);
    setIsAddItemOpen(false);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmitOrder = async () => {
    setValidationError(null);
    if (!selectedCustomerId) {
      setValidationError('Please select or register a customer for this order.');
      return;
    }

    if (items.length === 0) {
      setValidationError('Please add at least one garment item to the order.');
      return;
    }

    if (advanceNum > finalTotal) {
      setValidationError('Advance payment cannot exceed the final order total.');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderPayload = {
        customerId: selectedCustomerId,
        items: items.map((it, idx) => ({
          garmentType: it.garmentType as any,
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          notes: it.notes,
          photoUri: it.photoUri,
          localPhotoUri: it.photoUri,
          sortOrder: idx,
        })),
        discount: discountNum > 0 ? discountNum.toFixed(2) : undefined,
        additionalCharges: additionalChargesNum > 0 ? additionalChargesNum.toFixed(2) : undefined,
        advanceAmount: advanceNum > 0 ? advanceNum.toFixed(2) : undefined,
        notes: notes.trim() || undefined,
      };

      const result = await ordersApi.create(orderPayload);
      queryClient.invalidateQueries({ queryKey: ['orders-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['customers-list'] });
      queryClient.invalidateQueries({ queryKey: ['customer-detail', selectedCustomerId] });
      setSubmittedOrder(result);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to submit order';
      setValidationError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ORDER CONFIRMATION VIEW
  if (submittedOrder) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.confirmationContent}>
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark-done" size={48} color={Colors.white} />
          </View>

          <Text style={styles.confTitle}>Order Registered Successfully!</Text>
          <Text style={styles.confSubtitle}>
            Order #{submittedOrder.orderNumber} has been recorded in the database.
          </Text>

          {/* Details Card */}
          <View style={styles.confCard}>
            <View style={styles.confRow}>
              <Text style={styles.confLabel}>Customer</Text>
              <Text style={styles.confValue}>{submittedOrder.customer?.name}</Text>
            </View>

            <View style={styles.confRow}>
              <Text style={styles.confLabel}>WhatsApp Number</Text>
              <Text style={styles.confValue}>{submittedOrder.customer?.whatsappNumber}</Text>
            </View>

            <View style={styles.confDivider} />

            <View style={styles.confRow}>
              <Text style={styles.confLabel}>Garment Items</Text>
              <Text style={styles.confValue}>{submittedOrder.items?.length || items.length} items</Text>
            </View>

            <View style={styles.confRow}>
              <Text style={styles.confLabel}>Total Bill</Text>
              <CurrencyText amount={submittedOrder.finalTotal} style={styles.confTotal} />
            </View>

            <View style={styles.confRow}>
              <Text style={styles.confLabel}>Advance Paid</Text>
              <CurrencyText amount={submittedOrder.advanceAmount} style={styles.confValue} />
            </View>

            <View style={styles.confRow}>
              <Text style={styles.confLabel}>Balance Due</Text>
              <CurrencyText
                amount={submittedOrder.balanceDue}
                style={[styles.confValue, { color: Number(submittedOrder.balanceDue) > 0 ? Colors.error : Colors.success }]}
              />
            </View>

            {/* WhatsApp notification status banner */}
            <View style={styles.waStatusBanner}>
              <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
              <View style={styles.waStatusInfo}>
                <Text style={styles.waStatusTitle}>WhatsApp Notification</Text>
                <Text style={styles.waStatusSubtitle}>
                  Order confirmation queued for {submittedOrder.customer?.whatsappNumber}
                </Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.confActions}>
            {submittedOrder.customer?.whatsappNumber ? (
              <Button
                label="Send Order Receipt on WhatsApp"
                variant="primary"
                onPress={() => {
                  const clean = submittedOrder.customer.whatsappNumber.replace(/[^0-9]/g, '');
                  const msg = `Namaste ${submittedOrder.customer.name}! 🙏\nYour stitching order *${submittedOrder.orderNumber}* is registered at Bhagyashri Tailoring.\n\n• Total Amount: ₹${submittedOrder.finalTotal}\n• Advance Paid: ₹${submittedOrder.advanceAmount}\n• Balance Due: ₹${submittedOrder.balanceDue}\n\nThank you! 🪡✨`;
                  Linking.openURL(`https://wa.me/${clean}?text=${encodeURIComponent(msg)}`);
                }}
                style={{ marginBottom: Spacing.sm, backgroundColor: '#25D366' }}
              />
            ) : null}
            <Button
              label="View Order Details"
              variant="primary"
              onPress={() => router.replace(`/(tabs)/orders/${submittedOrder.id}` as any)}
            />
            <Button
              label="Back to Dashboard"
              variant="outline"
              onPress={() => router.replace('/(tabs)')}
              style={{ marginTop: Spacing.sm }}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

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
            <Text style={styles.headerTitle}>Create New Order</Text>
          </View>

          {validationError ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                backgroundColor: '#FFF2F2',
                borderColor: Colors.error,
                borderWidth: 1,
                padding: Spacing.md,
                borderRadius: 14,
                marginBottom: Spacing.md,
              }}
            >
              <Ionicons name="alert-circle" size={20} color={Colors.error} />
              <Text style={{ ...Typography.subhead, color: Colors.error, flex: 1, fontWeight: '600' }}>
                {validationError}
              </Text>
            </View>
          ) : null}

          {/* Step 1: Customer Selection */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>1. Customer</Text>

            {selectedCustomer ? (
              <View style={styles.selectedCustomerCard}>
                <View style={styles.selectedCustomerInfo}>
                  <Text style={styles.selectedCustomerName}>{selectedCustomer.name}</Text>
                  <Text style={styles.selectedCustomerPhone}>{selectedCustomer.whatsappNumber}</Text>
                </View>
                <TouchableOpacity
                  style={styles.changeCustomerBtn}
                  onPress={() => {
                    setSelectedCustomerId(null);
                    setIsCustomerDropdownOpen(true);
                  }}
                >
                  <Text style={styles.changeCustomerText}>Change</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Input
                  placeholder="Type customer name or WhatsApp number..."
                  value={customerSearch}
                  onChangeText={(text) => {
                    setCustomerSearch(text);
                    setIsCustomerDropdownOpen(true);
                  }}
                  onFocus={() => setIsCustomerDropdownOpen(true)}
                />

                {isCustomerDropdownOpen && (
                  <View style={styles.dropdown}>
                    <TouchableOpacity
                      style={styles.newCustomerOption}
                      onPress={() => router.push('/(tabs)/customers/new')}
                    >
                      <Ionicons name="person-add-outline" size={18} color={Colors.primary} />
                      <Text style={styles.newCustomerOptionText}>+ Register New Customer</Text>
                    </TouchableOpacity>

                    {(customersData?.data || []).map((c: any) => (
                      <TouchableOpacity
                        key={c.id}
                        style={styles.customerOption}
                        onPress={() => {
                          setSelectedCustomerId(c.id);
                          setIsCustomerDropdownOpen(false);
                          setCustomerSearch('');
                        }}
                      >
                        <Text style={styles.optionName}>{c.name}</Text>
                        <Text style={styles.optionPhone}>{c.whatsappNumber}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Step 2: Garment Items */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>2. Garments & Fabrics</Text>
              <Text style={styles.itemCountBadge}>
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </Text>
            </View>

            {items.map((item, index) => (
              <OrderItemCard
                key={index}
                item={item}
                index={index}
                onDelete={() => handleRemoveItem(index)}
              />
            ))}

            {isAddItemOpen ? (
              <OrderItemForm
                onSave={handleAddItem}
                onCancel={() => setIsAddItemOpen(false)}
              />
            ) : (
              <TouchableOpacity
                style={styles.addItemBtn}
                onPress={() => setIsAddItemOpen(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle" size={20} color={Colors.primary} />
                <Text style={styles.addItemBtnText}>+ Add Garment Item & Photo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Step 3: Billing Adjustments & Advance */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>3. Billing & Advance</Text>

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Input
                  label="Discount (₹)"
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={discount}
                  onChangeText={setDiscount}
                />
              </View>
              <View style={styles.flex1}>
                <Input
                  label="Additional Charges (₹)"
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={additionalCharges}
                  onChangeText={setAdditionalCharges}
                />
              </View>
            </View>

            <Input
              label="Advance Payment Received (₹)"
              placeholder="0.00"
              keyboardType="numeric"
              value={advanceAmount}
              onChangeText={setAdvanceAmount}
              hint="Recorded immediately in payment ledger"
            />

            <Input
              label="Order Notes (Optional)"
              placeholder="e.g. Urgent order for wedding on Saturday"
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          {/* Live Order Summary */}
          <OrderSummary
            distinctItemsCount={distinctItemsCount}
            totalQuantity={totalQuantity}
            subtotal={subtotal.toFixed(2)}
            discount={discountNum.toFixed(2)}
            additionalCharges={additionalChargesNum.toFixed(2)}
            finalTotal={finalTotal.toFixed(2)}
            advanceAmount={advanceNum.toFixed(2)}
            balanceDue={balanceDue.toFixed(2)}
          />

          {/* Submit Button */}
          <Button
            label={`Submit Order (${items.length} items • ₹${finalTotal.toFixed(2)})`}
            variant="primary"
            onPress={handleSubmitOrder}
            loading={isSubmitting}
            disabled={items.length === 0 || !selectedCustomerId}
            style={styles.submitOrderBtn}
          />
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
    paddingBottom: Spacing.xxl + 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
    paddingTop: Spacing.xs,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  headerTitle: {
    ...Typography.title2,
    fontWeight: '800',
    color: Colors.text,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.headline,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  itemCountBadge: {
    ...Typography.caption1,
    color: Colors.primary,
    fontWeight: '700',
    backgroundColor: '#F3E8EC',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  selectedCustomerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FBF8F5',
    padding: Spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedCustomerInfo: {
    flex: 1,
  },
  selectedCustomerName: {
    ...Typography.subhead,
    fontWeight: '700',
    color: Colors.text,
  },
  selectedCustomerPhone: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  changeCustomerBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  changeCustomerText: {
    ...Typography.caption1,
    color: Colors.primary,
    fontWeight: '600',
  },
  dropdown: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
    overflow: 'hidden',
  },
  newCustomerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Spacing.md,
    backgroundColor: '#FAF5F7',
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  newCustomerOptionText: {
    ...Typography.subhead,
    fontWeight: '700',
    color: Colors.primary,
  },
  customerOption: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  optionName: {
    ...Typography.subhead,
    fontWeight: '600',
    color: Colors.text,
  },
  optionPhone: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#FDF8F0',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFE5D2',
    marginTop: Spacing.xs,
  },
  addItemBtnText: {
    ...Typography.subhead,
    color: Colors.primary,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  flex1: {
    flex: 1,
  },
  submitOrderBtn: {
    marginTop: Spacing.xs,
  },
  // Confirmation Styles
  confirmationContent: {
    padding: Spacing.xl,
    alignItems: 'center',
    paddingTop: Spacing.xxl,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  confTitle: {
    ...Typography.title2,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
  },
  confSubtitle: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.xl,
  },
  confCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
    marginBottom: Spacing.xl,
  },
  confRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  confLabel: {
    ...Typography.subhead,
    color: Colors.textSecondary,
  },
  confValue: {
    ...Typography.subhead,
    fontWeight: '600',
    color: Colors.text,
  },
  confDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.md,
  },
  confTotal: {
    ...Typography.headline,
    fontWeight: '800',
    color: Colors.primary,
  },
  waStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0F9F3',
    padding: Spacing.md,
    borderRadius: 14,
    marginTop: Spacing.md,
  },
  waStatusInfo: {
    flex: 1,
  },
  waStatusTitle: {
    ...Typography.caption1,
    fontWeight: '700',
    color: '#128C7E',
  },
  waStatusSubtitle: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  confActions: {
    width: '100%',
  },
});
