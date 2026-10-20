import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../theme/colors';
import { Typography } from '../../../theme/typography';
import { Spacing } from '../../../theme/spacing';
import { ordersApi } from '../../../lib/api/orders.api';
import { whatsappApi } from '../../../lib/api/whatsapp.api';
import { StatusTimeline } from '../../../components/orders/StatusTimeline';
import { OrderItemCard } from '../../../components/orders/OrderItemCard';
import { WhatsAppMessageStatus } from '../../../components/orders/WhatsAppMessageStatus';
import { PaymentForm, PaymentFormData } from '../../../components/forms/PaymentForm';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { CurrencyText } from '../../../components/ui/CurrencyText';
import { LoadingSkeleton } from '../../../components/ui/LoadingSkeleton';
import { Button } from '../../../components/ui/Button';
import { formatDate } from '../../../lib/utils/date';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDeliveryConfirmOpen, setIsDeliveryConfirmOpen] = useState(false);
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Fetch Order
  const {
    data: order,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['order-detail', id],
    queryFn: () => ordersApi.getById(id!),
    enabled: !!id,
  });

  // Mutation: Status Transition
  const statusMutation = useMutation({
    mutationFn: ({ status, notes }: { status: any; notes?: string }) =>
      ordersApi.updateStatus(id!, { status, notes }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['order-detail', id], updated);
      queryClient.invalidateQueries({ queryKey: ['orders-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['customers-list'] });
      queryClient.invalidateQueries({ queryKey: ['customer-detail'] });
      setFeedbackBanner({
        type: 'success',
        message: `Order #${updated.orderNumber} marked as ${updated.status}!`,
      });
    },
    onError: (err: any) => {
      setFeedbackBanner({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to update order status',
      });
    },
  });

  // Mutation: Add Payment
  const paymentMutation = useMutation({
    mutationFn: (data: PaymentFormData) => ordersApi.addPayment(id!, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['order-detail', id], updated);
      queryClient.invalidateQueries({ queryKey: ['orders-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['customers-list'] });
      queryClient.invalidateQueries({ queryKey: ['customer-detail'] });
      setIsPaymentModalOpen(false);
      setFeedbackBanner({
        type: 'success',
        message: `Payment recorded for Order #${updated.orderNumber}! Remaining balance: ₹${updated.balanceDue}`,
      });
    },
    onError: (err: any) => {
      setFeedbackBanner({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to record payment',
      });
    },
  });

  // Retry WhatsApp message
  const handleRetryWhatsApp = async (messageId: string) => {
    try {
      await whatsappApi.retryMessage(messageId);
      refetch();
      setFeedbackBanner({
        type: 'success',
        message: 'WhatsApp notification resent successfully!',
      });
    } catch (err: any) {
      setFeedbackBanner({
        type: 'error',
        message: err.message || 'Retry failed',
      });
    }
  };

  const handleCustomerCall = () => {
    if (order?.customer?.whatsappNumber) {
      Linking.openURL(`tel:${order.customer.whatsappNumber}`);
    }
  };

  const handleCustomerWhatsApp = async () => {
    if (!order?.customer?.whatsappNumber) return;
    const clean = order.customer.whatsappNumber.replace(/[^0-9]/g, '');
    let statusText = `is currently *${order.status}*`;
    if (order.status === 'COMPLETED') {
      statusText = `is *READY FOR PICKUP* 🎉`;
    } else if (order.status === 'DELIVERED') {
      statusText = `has been *DELIVERED* ✅`;
    }
    const text = `Namaste ${order.customer.name}! 🙏\nYour stitching order *${order.orderNumber}* at Bhagyashri Tailoring ${statusText}.\n\n• Total Bill: ₹${order.finalTotal}\n• Balance Due: ₹${order.balanceDue}\n\nThank you! 🪡✨`;
    const url = `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
    await Linking.openURL(url);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingWrapper}>
          <LoadingSkeleton width="100%" height={100} borderRadius={20} />
          <LoadingSkeleton width="100%" height={160} borderRadius={20} />
          <LoadingSkeleton width="100%" height={200} borderRadius={20} />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Order not found.</Text>
          <Button label="Back to Orders" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const isReceived = order.status === 'RECEIVED';
  const isInProgress = order.status === 'IN_PROGRESS';
  const isCompleted = order.status === 'COMPLETED';
  const isDelivered = order.status === 'DELIVERED';
  const hasOutstanding = Number(order.balanceDue) > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.orderNumber}>{order.orderNumber}</Text>
            <Text style={styles.createdDate}>{formatDate(order.createdAt)}</Text>
          </View>
        </View>

        {feedbackBanner ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              padding: Spacing.md,
              borderRadius: 16,
              marginBottom: Spacing.md,
              backgroundColor: feedbackBanner.type === 'success' ? '#E8F8EE' : '#FFF2F2',
              borderWidth: 1,
              borderColor: feedbackBanner.type === 'success' ? '#A3E4B7' : '#F5B7B1',
            }}
          >
            <Ionicons
              name={feedbackBanner.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
              size={20}
              color={feedbackBanner.type === 'success' ? Colors.success : Colors.error}
            />
            <Text
              style={{
                ...Typography.subhead,
                fontWeight: '600',
                flex: 1,
                color: feedbackBanner.type === 'success' ? '#1E7E34' : Colors.error,
              }}
            >
              {feedbackBanner.message}
            </Text>
          </View>
        ) : null}

        {/* Customer Info Card */}
        <View style={styles.customerCard}>
          <View style={styles.customerTop}>
            <View style={styles.customerInfo}>
              <Text style={styles.customerLabel}>Customer</Text>
              <Text style={styles.customerName}>{order.customer?.name}</Text>
              <Text style={styles.customerPhone}>{order.customer?.whatsappNumber}</Text>
            </View>

            <View style={styles.contactActions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.callBtn]}
                onPress={handleCustomerCall}
              >
                <Ionicons name="call" size={16} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.waBtn]}
                onPress={handleCustomerWhatsApp}
              >
                <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Status Lifecycle Timeline */}
        <StatusTimeline
          currentStatus={order.status}
          createdAt={order.createdAt}
          completedAt={order.completedAt}
          deliveredAt={order.deliveredAt}
        />

        {/* Primary Lifecycle Action Button */}
        <View style={styles.actionSection}>
          {isReceived && (
            <Button
              label="Start Work (Mark In Progress)"
              variant="primary"
              onPress={() =>
                statusMutation.mutate({
                  status: 'IN_PROGRESS',
                  notes: 'Stitching work started by designer',
                })
              }
              loading={statusMutation.isPending}
            />
          )}

          {isInProgress && (
            <Button
              label="Ready for Pickup (Complete Order)"
              variant="primary"
              onPress={() =>
                statusMutation.mutate({
                  status: 'COMPLETED',
                  notes: 'Garments stitched and ready for pickup',
                })
              }
              loading={statusMutation.isPending}
            />
          )}

          {isCompleted && (
            <Button
              label="Mark as Delivered to Customer"
              variant="primary"
              onPress={() => setIsDeliveryConfirmOpen(true)}
              loading={statusMutation.isPending}
            />
          )}

          {isDelivered && (
            <View style={styles.deliveredBadge}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
              <Text style={styles.deliveredText}>
                Delivered on {formatDate(order.deliveredAt || order.updatedAt)}
              </Text>
            </View>
          )}
        </View>

        {/* Garment Items Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Garments in this Order ({order.items?.length || 0})</Text>
        </View>

        {(order.items || []).map((item: any) => (
          <OrderItemCard key={item.id} item={item} />
        ))}

        {/* Billing & Payment Ledger Card */}
        <View style={styles.billingCard}>
          <Text style={styles.cardTitle}>Bill & Payments</Text>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Subtotal</Text>
            <CurrencyText amount={order.subtotal} style={styles.billValue} />
          </View>

          {Number(order.discount) > 0 ? (
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: Colors.success }]}>Discount</Text>
              <Text style={[styles.billValue, { color: Colors.success }]}>
                - <CurrencyText amount={order.discount} />
              </Text>
            </View>
          ) : null}

          {Number(order.additionalCharges) > 0 ? (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Additional Charges</Text>
              <Text style={styles.billValue}>
                + <CurrencyText amount={order.additionalCharges} />
              </Text>
            </View>
          ) : null}

          <View style={styles.billDivider} />

          <View style={styles.billRow}>
            <Text style={styles.finalTotalLabel}>Final Total</Text>
            <CurrencyText amount={order.finalTotal} style={styles.finalTotalValue} />
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Total Payments Received</Text>
            <CurrencyText
              amount={
                (order.payments || []).reduce(
                  (sum: number, p: any) => sum + Number(p.amount),
                  0,
                )
              }
              style={[styles.billValue, { color: Colors.success }]}
            />
          </View>

          {/* Balance Due Banner */}
          <View style={styles.balanceDueBanner}>
            <Text style={styles.balanceDueLabel}>Remaining Balance Due</Text>
            <CurrencyText
              amount={order.balanceDue}
              style={[
                styles.balanceDueValue,
                { color: hasOutstanding ? Colors.error : Colors.success },
              ]}
            />
          </View>

          {/* Record Payment Button */}
          {hasOutstanding && (
            <Button
              label="+ Record Payment at Shop"
              variant="outline"
              onPress={() => setIsPaymentModalOpen(true)}
              style={styles.addPaymentBtn}
            />
          )}

          {/* Payment History Log */}
          {(order.payments || []).length > 0 && (
            <View style={styles.paymentHistoryWrapper}>
              <Text style={styles.historyTitle}>Payment History</Text>
              {order.payments.map((p: any) => (
                <View key={p.id} style={styles.paymentRow}>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentMethodText}>
                      {p.paymentMethod} {p.transactionRef ? `(${p.transactionRef})` : ''}
                    </Text>
                    <Text style={styles.paymentDateText}>{formatDate(p.receivedAt)}</Text>
                  </View>
                  <CurrencyText amount={p.amount} style={styles.paymentAmountText} />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* WhatsApp Notification Timeline */}
        <WhatsAppMessageStatus
          messages={order.whatsappMessages || []}
          onRetry={handleRetryWhatsApp}
        />
      </ScrollView>

      {/* Record Payment Modal */}
      <Modal
        visible={isPaymentModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPaymentModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <PaymentForm
            balanceDue={order.balanceDue}
            onSubmit={(data) => paymentMutation.mutate(data)}
            onCancel={() => setIsPaymentModalOpen(false)}
            isLoading={paymentMutation.isPending}
          />
        </View>
      </Modal>

      {/* Delivery Confirmation Dialog */}
      <ConfirmDialog
        visible={isDeliveryConfirmOpen}
        title="Confirm Garment Delivery"
        message={`Customer ${order.customer?.name} is collecting order #${order.orderNumber}.\n\nTotal Bill: ₹${order.finalTotal}\nRemaining Balance: ₹${order.balanceDue}\n\nNote: If payment was received at the shop, record it before or after delivery.`}
        confirmLabel="Confirm Delivery"
        cancelLabel="Not Yet"
        onConfirm={() => {
          setIsDeliveryConfirmOpen(false);
          statusMutation.mutate({
            status: 'DELIVERED',
            notes: 'Garments delivered and collected by customer at boutique',
          });
        }}
        onCancel={() => setIsDeliveryConfirmOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl + 30,
  },
  loadingWrapper: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
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
  headerInfo: {
    flex: 1,
  },
  orderNumber: {
    ...Typography.title2,
    fontWeight: '800',
    color: Colors.text,
  },
  createdDate: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  customerCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  customerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerInfo: {
    flex: 1,
  },
  customerLabel: {
    ...Typography.caption2,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  customerName: {
    ...Typography.headline,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
  customerPhone: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  contactActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callBtn: {
    backgroundColor: '#F3E8EC',
  },
  waBtn: {
    backgroundColor: '#E8F8EE',
  },
  actionSection: {
    marginBottom: Spacing.md,
  },
  deliveredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    padding: Spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  deliveredText: {
    ...Typography.subhead,
    color: Colors.success,
    fontWeight: '700',
  },
  sectionHeader: {
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.headline,
    color: Colors.text,
  },
  billingCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    ...Typography.headline,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  billLabel: {
    ...Typography.subhead,
    color: Colors.textSecondary,
  },
  billValue: {
    ...Typography.subhead,
    fontWeight: '600',
    color: Colors.text,
  },
  billDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.sm,
  },
  finalTotalLabel: {
    ...Typography.headline,
    fontWeight: '700',
    color: Colors.text,
  },
  finalTotalValue: {
    ...Typography.title3,
    fontWeight: '800',
    color: Colors.primary,
  },
  balanceDueBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAF7F2',
    padding: Spacing.md,
    borderRadius: 12,
    marginTop: Spacing.md,
  },
  balanceDueLabel: {
    ...Typography.headline,
    fontWeight: '700',
    color: Colors.text,
  },
  balanceDueValue: {
    ...Typography.headline,
    fontWeight: '800',
  },
  addPaymentBtn: {
    marginTop: Spacing.md,
  },
  paymentHistoryWrapper: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  historyTitle: {
    ...Typography.caption1,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentMethodText: {
    ...Typography.caption1,
    fontWeight: '600',
    color: Colors.text,
  },
  paymentDateText: {
    ...Typography.caption2,
    color: Colors.textSecondary,
  },
  paymentAmountText: {
    ...Typography.subhead,
    fontWeight: '700',
    color: Colors.success,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
    padding: Spacing.md,
  },
});
