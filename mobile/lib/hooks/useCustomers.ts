import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi, CreateCustomerData } from '@/lib/api/customers.api';

export const CUSTOMER_KEYS = {
  all: ['customers'] as const,
  list: (search?: string) => ['customers', 'list', search ?? ''] as const,
  detail: (id: string) => ['customers', 'detail', id] as const,
};

export function useCustomersList(search?: string) {
  return useInfiniteQuery({
    queryKey: CUSTOMER_KEYS.list(search),
    queryFn: ({ pageParam = 1 }) =>
      customersApi.list({ search, page: pageParam as number, limit: 20 }),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: CUSTOMER_KEYS.detail(id),
    queryFn: () => customersApi.get(id),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCustomerData) => customersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.all });
    },
  });
}

export function useUpdateCustomer(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CreateCustomerData>) => customersApi.update(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(CUSTOMER_KEYS.detail(id), updated);
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.all });
    },
  });
}

export function useCheckDuplicate() {
  return useMutation({
    mutationFn: (whatsappNumber: string) => customersApi.checkDuplicate(whatsappNumber),
  });
}
