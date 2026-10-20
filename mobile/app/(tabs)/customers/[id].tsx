import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../theme/colors';
import { Typography } from '../../../theme/typography';
import { Spacing } from '../../../theme/spacing';
import { customersApi } from '../../../lib/api/customers.api';
import { CustomerStats } from '../../../components/customers/CustomerStats';
import { OrderCard } from '../../../components/orders/OrderCard';
import { Button } from '../../../components/ui/Button';
import { LoadingSkeleton } from '../../../components/ui/LoadingSkeleton';
import { Avatar } from '../../../components/ui/Avatar';

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'COMPLETED' | 'DELIVERED'>('ACTIVE');

  const {
    data: customer,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['customer-detail', id],
    queryFn: () => customersApi.getById(id!),
    enabled: !!id,
  });

  const handleWhatsApp = async () => {
    if (!customer?.whatsappNumber) return;
    const clean = customer.whatsappNumber.replace(/[^0-9]/g, '');
    const url = `whatsapp://send?phone=${clean}`;
    const can = await Linking.canOpenURL(url);
    if (can) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Notice', 'WhatsApp application is not installed on this device.');
    }
  };

  const handleCall = async () => {
    if (!customer?.whatsappNumber) return;
    await Linking.openURL(`tel:${customer.whatsappNumber}`);
  };

  const orders = customer?.orders || [];

  const filteredOrders = orders.filter((order: any) => {
    if (activeTab === 'ACTIVE') return order.status === 'RECEIVED' || order.status === 'IN_PROGRESS';
    if (activeTab === 'COMPLETED') return order.status === 'COMPLETED';
    if (activeTab === 'DELIVERED') return order.status === 'DELIVERED';
    return true;
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <LoadingSkeleton width="100%" height={140} borderRadius={20} />
          <LoadingSkeleton width="100%" height={100} borderRadius={20} />
        </View>
      </SafeAreaView>
    );
  }

  if (!customer) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>Customer profile not found.</Text>
          <Button label="Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const stats = customer.stats || {
    totalOrders: orders.length,
    totalBilled: orders.reduce((sum: number, o: any) => sum + Number(o.finalTotal), 0),
    totalPaid: orders.reduce(
      (sum: number, o: any) =>
        sum + (o.payments || []).reduce((psum: number, p: any) => psum + Number(p.amount), 0),
      0,
    ),
    outstanding: orders.reduce((sum: number, o: any) => sum + Number(o.balanceDue), 0),
  };

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
          <Text style={styles.headerTitle}>Customer Profile</Text>
        </View>

        {/* Profile Banner Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <Avatar name={customer.name} size={64} />
            <View style={styles.profileInfo}>
              <Text style={styles.customerName}>{customer.name}</Text>
              <Text style={styles.phoneText}>{customer.whatsappNumber}</Text>
              {customer.altPhone ? (
                <Text style={styles.altPhoneText}>Alt: {customer.altPhone}</Text>
              ) : null}
            </View>
          </View>

          {customer.notes ? (
            <View style={styles.notesBox}>
              <Ionicons name="document-text-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.notesText}>{customer.notes}</Text>
            </View>
          ) : null}

          {/* Contact actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.contactBtn, styles.callBtn]}
              onPress={handleCall}
            >
              <Ionicons name="call" size={18} color={Colors.primary} />
              <Text style={styles.callBtnText}>Call Customer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.contactBtn, styles.waBtn]}
              onPress={handleWhatsApp}
            >
              <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
              <Text style={styles.waBtnText}>WhatsApp Chat</Text>
            </TouchableOpacity>
          </View>

          {/* Prominent Create Order Button */}
          <Button
            label="+ Create New Order for this Customer"
            variant="primary"
            onPress={() =>
              router.push(`/(tabs)/orders/new?customerId=${customer.id}` as any)
            }
            style={styles.createOrderBtn}
          />
        </View>

        {/* Aggregate Customer Stats */}
        <CustomerStats stats={stats} />

        {/* Orders Filter Tabs */}
        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[styles.filterTab, activeTab === 'ACTIVE' && styles.activeFilterTab]}
            onPress={() => setActiveTab('ACTIVE')}
          >
            <Text
              style={[
                styles.filterTabText,
                activeTab === 'ACTIVE' && styles.activeFilterTabText,
              ]}
            >
              Active ({orders.filter((o: any) => o.status === 'RECEIVED' || o.status === 'IN_PROGRESS').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, activeTab === 'COMPLETED' && styles.activeFilterTab]}
            onPress={() => setActiveTab('COMPLETED')}
          >
            <Text
              style={[
                styles.filterTabText,
                activeTab === 'COMPLETED' && styles.activeFilterTabText,
              ]}
            >
              Pickup ({orders.filter((o: any) => o.status === 'COMPLETED').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, activeTab === 'DELIVERED' && styles.activeFilterTab]}
            onPress={() => setActiveTab('DELIVERED')}
          >
            <Text
              style={[
                styles.filterTabText,
                activeTab === 'DELIVERED' && styles.activeFilterTabText,
              ]}
            >
              Delivered ({orders.filter((o: any) => o.status === 'DELIVERED').length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyOrdersCard}>
            <Ionicons name="receipt-outline" size={32} color={Colors.placeholder} />
            <Text style={styles.emptyOrdersText}>No orders in this section</Text>
          </View>
        ) : (
          filteredOrders.map((order: any) => (
            <OrderCard
              key={order.id}
              order={order}
              onPress={() => router.push(`/(tabs)/orders/${order.id}` as any)}
            />
          ))
        )}
      </ScrollView>
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
    paddingBottom: Spacing.xxl + 20,
  },
  loadingContainer: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  notFoundText: {
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
  headerTitle: {
    ...Typography.title3,
    fontWeight: '800',
    color: Colors.text,
  },
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  customerName: {
    ...Typography.title3,
    fontWeight: '700',
    color: Colors.text,
  },
  phoneText: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  altPhoneText: {
    ...Typography.caption2,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  notesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FAF7F2',
    padding: Spacing.sm,
    borderRadius: 10,
    marginTop: Spacing.md,
  },
  notesText: {
    ...Typography.caption1,
    color: Colors.textSecondary,
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  callBtn: {
    backgroundColor: '#F3E8EC',
  },
  callBtnText: {
    ...Typography.caption1,
    fontWeight: '700',
    color: Colors.primary,
  },
  waBtn: {
    backgroundColor: '#E8F8EE',
  },
  waBtnText: {
    ...Typography.caption1,
    fontWeight: '700',
    color: '#128C7E',
  },
  createOrderBtn: {
    marginTop: Spacing.md,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.inputBackground,
    borderRadius: 14,
    padding: 4,
    marginBottom: Spacing.md,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeFilterTab: {
    backgroundColor: Colors.surface,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterTabText: {
    ...Typography.caption1,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeFilterTabText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  emptyOrdersCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyOrdersText: {
    ...Typography.caption1,
    color: Colors.textSecondary,
  },
});
