import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
import { ordersApi } from '../../lib/api/orders.api';
import { useAuthStore } from '../../lib/store/auth.store';
import { StatCard } from '../../components/dashboard/StatCard';
import { QuickAction } from '../../components/dashboard/QuickAction';
import { RecentOrders } from '../../components/dashboard/RecentOrders';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { CurrencyText } from '../../components/ui/CurrencyText';

export default function DashboardScreen() {
  const router = useRouter();
  const { designer } = useAuthStore();

  const {
    data: stats,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => ordersApi.getDashboardStats(),
  });

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const designerName = designer?.name?.split(' ')[0] || 'Designer';
  const businessName = designer?.businessName || 'Boutique Studio';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Top App Bar & Profile Greeting */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>Namaste, {designerName} ☀️</Text>
            <Text style={styles.businessTitle}>{businessName}</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsIconBtn}
            onPress={() => router.push('/(tabs)/settings')}
          >
            <Ionicons name="cog-outline" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Quick Actions Grid */}
        <Text style={styles.sectionHeader}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          <QuickAction
            label="Add Customer"
            icon="person-add"
            onPress={() => router.push('/(tabs)/customers/new')}
          />
          <QuickAction
            label="New Order"
            icon="add-circle"
            accent
            onPress={() => router.push('/(tabs)/orders/new')}
          />
          <QuickAction
            label="Search"
            icon="search"
            onPress={() => router.push('/(tabs)/customers')}
          />
          <QuickAction
            label="All Orders"
            icon="receipt"
            onPress={() => router.push('/(tabs)/orders')}
          />
        </View>

        {/* Business Overview Stats */}
        <View style={styles.statsHeaderRow}>
          <Text style={styles.sectionHeader}>Today's Overview</Text>
          {stats?.totalOutstanding ? (
            <View style={styles.dueBadge}>
              <Text style={styles.dueBadgeText}>Outstanding: </Text>
              <CurrencyText amount={stats.totalOutstanding} style={styles.dueBadgeAmount} />
            </View>
          ) : null}
        </View>

        {isLoading ? (
          <View style={styles.skeletonContainer}>
            <LoadingSkeleton width="100%" height={80} borderRadius={16} />
            <LoadingSkeleton width="100%" height={80} borderRadius={16} />
          </View>
        ) : (
          <View style={styles.statsGrid}>
            <StatCard
              label="Today's Orders"
              value={stats?.ordersReceivedToday ?? 0}
              subtitle="Received today"
              accentColor={Colors.primary}
              onPress={() => router.push('/(tabs)/orders')}
            />
            <StatCard
              label="In Progress"
              value={stats?.inProgressOrders ?? 0}
              subtitle="Stitching / alterations"
              accentColor={Colors.warning}
              onPress={() => router.push('/(tabs)/orders')}
            />
            <StatCard
              label="Ready for Pickup"
              value={stats?.completedOrders ?? 0}
              subtitle="Awaiting customer"
              accentColor={Colors.gold}
              onPress={() => router.push('/(tabs)/orders')}
            />
            <StatCard
              label="Total Customers"
              value={stats?.totalCustomers ?? 0}
              subtitle="Registered profiles"
              accentColor={Colors.info}
              onPress={() => router.push('/(tabs)/customers')}
            />
          </View>
        )}

        {/* Recently Updated Orders */}
        <RecentOrders
          orders={stats?.recentOrders || []}
          onOrderPress={(id) => router.push(`/(tabs)/orders/${id}` as any)}
          onViewAllPress={() => router.push('/(tabs)/orders')}
        />
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
    paddingBottom: Spacing.xxl + 10,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingTop: Spacing.xs,
  },
  greeting: {
    ...Typography.title2,
    fontWeight: '800',
    color: Colors.text,
  },
  businessTitle: {
    ...Typography.subhead,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  settingsIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: {
    ...Typography.headline,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  statsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  dueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF2F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dueBadgeText: {
    ...Typography.caption2,
    color: Colors.error,
    fontWeight: '600',
  },
  dueBadgeAmount: {
    ...Typography.caption2,
    color: Colors.error,
    fontWeight: '800',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  skeletonContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
});
