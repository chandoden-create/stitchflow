import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi, CreateOrderData } from '@/lib/api/orders.api';

export const ORDER_KEYS = {
  all: ['orders'] as const,
  list: (params?: Record<string, unknown>) => ['orders', 'list', params ?? {}] as const,
  detail: (id: string) => ['orders', 'detail', id] as const,
  dashboard: ['orders', 'dashboard'] as const,
};

export function useOrdersList(params?: { status?: string; customerId?: string; search?: string }) {
  return useInfiniteQuery({
    queryKey: ORDER_KEYS.list(params),
    queryFn: ({ pageParam = 1 }) =>
      ordersApi.list({ ...params, page: pageParam as number, limit: 20 }),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ORDER_KEYS.detail(id),
    queryFn: () => ordersApi.get(id),
    enabled: !!id,
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ORDER_KEYS.dashboard,
    queryFn: ordersApi.getDashboardStats,
    refetchInterval: 60000,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOrderData) => ordersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: string; note?: string }) =>
      ordersApi.updateStatus(id, { status, notes: note }),
    onSuccess: (updated) => {
      queryClient.setQueryData(ORDER_KEYS.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all });
    },
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payment,
    }: {
      id: string;
      payment: { amount: number; method: string; reference?: string; notes?: string };
    }) => ordersApi.recordPayment(id, payment),
    onSuccess: (updated) => {
      queryClient.setQueryData(ORDER_KEYS.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.dashboard });
    },
  });
}

export function useRetryWhatsApp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, notificationId }: { orderId: string; notificationId: string }) =>
      ordersApi.retryWhatsApp(orderId, notificationId),
    onSuccess: (_data, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.detail(orderId) });
    },
  });
}
