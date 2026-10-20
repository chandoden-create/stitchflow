import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';
import { customersApi } from '../../lib/api/customers.api';
import { CustomerCard } from '../../components/customers/CustomerCard';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export default function CustomersScreen() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['customers-list', searchTerm],
    queryFn: () => customersApi.getAll({ search: searchTerm || undefined }),
  });

  const customers = data?.data || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Customers</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/(tabs)/customers/new')}
            activeOpacity={0.8}
          >
            <Ionicons name="person-add" size={18} color={Colors.white} />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <Ionicons
            name="search-outline"
            size={20}
            color={Colors.placeholder}
            style={styles.searchIcon}
          />
          <Input
            placeholder="Search by customer name or WhatsApp number..."
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

        {/* List of Customers */}
        {isLoading ? (
          <View style={styles.skeletonContainer}>
            <LoadingSkeleton width="100%" height={90} borderRadius={18} />
            <LoadingSkeleton width="100%" height={90} borderRadius={18} />
            <LoadingSkeleton width="100%" height={90} borderRadius={18} />
          </View>
        ) : (
          <FlatList
            data={customers}
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
              <CustomerCard
                id={item.id}
                name={item.name}
                whatsappNumber={item.whatsappNumber}
                activeOrdersCount={item._count?.orders ?? 0}
                outstandingBalance={item.outstandingBalance ?? 0}
                onPress={() => router.push(`/(tabs)/customers/${item.id}` as any)}
              />
            )}
            ListEmptyComponent={
              <EmptyState
                icon="people-outline"
                title="No Customers Found"
                description={
                  searchTerm
                    ? `No customers matched "${searchTerm}".`
                    : 'Register your first customer to start tracking orders and measurements.'
                }
                actionLabel={searchTerm ? 'Clear Search' : 'Add First Customer'}
                onAction={
                  searchTerm
                    ? () => setSearchTerm('')
                    : () => router.push('/(tabs)/customers/new')
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
    gap: 6,
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
    marginBottom: Spacing.sm,
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
  skeletonContainer: {
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  listContent: {
    paddingBottom: Spacing.xxl + 20,
  },
});
