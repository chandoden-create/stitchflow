import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';
import { ordersApi } from '../../lib/api/orders.api';
import { OrderCard } from '../../components/orders/OrderCard';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

const STATUS_FILTERS = [
  { key: 'ALL', label: 'All Orders' },
  { key: 'RECEIVED', label: 'Received' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'COMPLETED', label: 'Pickup Ready' },
  { key: 'DELIVERED', label: 'Delivered' },
];

export default function OrdersScreen() {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['orders-list', selectedStatus, searchTerm],
    queryFn: () =>
      ordersApi.getAll({
        status: selectedStatus === 'ALL' ? undefined : (selectedStatus as any),
        search: searchTerm || undefined,
      }),
  });

  const orders = data?.data || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Orders</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/(tabs)/orders/new')}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color={Colors.white} />
            <Text style={styles.addBtnText}>New Order</Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchWrapper}>
          <Ionicons
            name="search-outline"
            size={18}
            color={Colors.placeholder}
            style={styles.searchIcon}
          />
          <Input
            placeholder="Search by order # (e.g. SF-1001) or customer..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            style={styles.searchInput}
          />
          {searchTerm ? (
            <TouchableOpacity
              onPress={() => setSearchTerm('')}
              style={styles.clearSearchBtn}
            >
              <Ionicons name="close-circle" size={18} color={Colors.placeholder} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Status Filter Horizontal Pills */}
        <View style={styles.filtersWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContainer}
          >
            {STATUS_FILTERS.map((filter) => {
              const isSelected = selectedStatus === filter.key;
              return (
                <TouchableOpacity
                  key={filter.key}
                  style={[styles.filterPill, isSelected && styles.selectedFilterPill]}
                  onPress={() => setSelectedStatus(filter.key)}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      isSelected && styles.selectedFilterPillText,
                    ]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Orders List */}
        {isLoading ? (
          <View style={styles.skeletonContainer}>
            <LoadingSkeleton width="100%" height={110} borderRadius={18} />
            <LoadingSkeleton width="100%" height={110} borderRadius={18} />
            <LoadingSkeleton width="100%" height={110} borderRadius={18} />
          </View>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor={Colors.primary}
              />
            }
            renderItem={({ item }) => (
              <OrderCard
                order={item}
                onPress={() => router.push(`/(tabs)/orders/${item.id}` as any)}
              />
            )}
            ListEmptyComponent={
              <EmptyState
                icon="receipt-outline"
                title="No Orders Found"
                description={
                  searchTerm || selectedStatus !== 'ALL'
                    ? 'No orders match your filter criteria.'
                    : 'Start by creating your first order for a customer.'
                }
                actionLabel={
                  searchTerm || selectedStatus !== 'ALL'
                    ? 'Reset Filters'
                    : 'Create New Order'
                }
                onAction={
                  searchTerm || selectedStatus !== 'ALL'
                    ? () => {
                        setSearchTerm('');
                        setSelectedStatus('ALL');
                      }
                    : () => router.push('/(tabs)/orders/new')
                }
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingTop: Spacing.xs,
  },
  title: {
    ...Typography.title2,
    fontWeight: '800',
    color: Colors.text,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: {
    ...Typography.subhead,
    color: Colors.white,
    fontWeight: '700',
  },
  searchWrapper: {
    position: 'relative',
    marginBottom: Spacing.xs,
  },
  searchIcon: {
    position: 'absolute',
    left: 14,
    top: 24,
    zIndex: 2,
  },
  searchInput: {
    paddingLeft: 42,
  },
  clearSearchBtn: {
    position: 'absolute',
    right: 14,
    top: 24,
    zIndex: 2,
  },
  filtersWrapper: {
    marginBottom: Spacing.md,
  },
  filtersContainer: {
    gap: Spacing.xs,
    paddingVertical: 4,
  },
  filterPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedFilterPill: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterPillText: {
    ...Typography.caption1,
    fontWeight: '600',
    color: Colors.text,
  },
  selectedFilterPillText: {
    color: Colors.white,
  },
  skeletonContainer: {
    gap: Spacing.md,
  },
  listContent: {
    paddingBottom: Spacing.xxl + 20,
  },
});
