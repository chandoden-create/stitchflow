import { apiClient } from './client';
import type { Customer } from './customers.api';
import { localDb } from '@/lib/store/local-db';

export interface OrderItem {
  id?: string;
  garmentType: string;
  description: string;
  quantity: number;
  unitPrice: number | string;
  lineTotal?: number | string;
  notes?: string;
  photoUri?: string;
  localPhotoUri?: string;
  photos?: any[];
  sortOrder?: number;
}

export interface Payment {
  id: string;
  amount: number | string;
  paymentMethod: string;
  method?: string;
  transactionRef?: string;
  reference?: string;
  notes?: string;
  receivedAt: string;
}

export interface WhatsAppNotification {
  id: string;
  messageType: string;
  status: 'QUEUED' | 'SENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'MOCK_SENT';
  createdAt: string;
  sentAt?: string;
  deliveredAt?: string;
  errorMessage?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customer?: Customer;
  status: string;
  subtotal: number | string;
  discount: number | string;
  additionalCharges: number | string;
  finalTotal: number | string;
  advanceAmount: number | string;
  balanceDue: number | string;
  dueDate?: string;
  completedAt?: string;
  deliveredAt?: string;
  notes?: string;
  items: OrderItem[];
  payments: Payment[];
  statusHistory?: any[];
  whatsappMessages?: WhatsAppNotification[];
  _count?: {
    items: number;
    payments?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderData {
  customerId: string;
  items: Array<{
    garmentType: string;
    description: string;
    quantity: number;
    unitPrice: string | number;
    notes?: string;
    photoUri?: string;
    localPhotoUri?: string;
    photos?: any[];
    sortOrder?: number;
  }>;
  discount?: string | number;
  additionalCharges?: string | number;
  advanceAmount?: string | number;
  dueDate?: string;
  notes?: string;
}

export interface OrdersListResponse {
  data: Order[];
  orders?: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
  hasMore?: boolean;
}

export interface DashboardStats {
  totalCustomers: number;
  ordersReceivedToday: number;
  pendingOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  deliveredOrders: number;
  totalOutstanding: string;
  totalRevenue: string;
  recentOrders: Order[];
}

export const ordersApi = {
  getAll: async (params?: {
    status?: string;
    customerId?: string;
    search?: string;
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<OrdersListResponse> => {
    return localDb.listOrders(params);
  },

  list: async (params?: any): Promise<OrdersListResponse> => {
    return localDb.listOrders(params);
  },

  getById: async (id: string): Promise<Order> => {
    return localDb.getOrderById(id);
  },

  get: async (id: string): Promise<Order> => {
    return localDb.getOrderById(id);
  },

  create: async (orderData: CreateOrderData): Promise<Order> => {
    const created = await localDb.createOrder(orderData);
    apiClient.post<Order>('/orders', orderData, { timeout: 3500 }).catch(() => {});
    return created;
  },

  updateStatus: async (
    id: string,
    dto: { status: string; notes?: string },
  ): Promise<Order> => {
    const updated = await localDb.updateOrderStatus(id, dto);
    apiClient.put<Order>(`/orders/${id}/status`, dto, { timeout: 3500 }).catch(() => {});
    return updated;
  },

  addPayment: async (
    id: string,
    dto: {
      amount: string;
      paymentMethod: string;
      transactionRef?: string;
      notes?: string;
      receivedAt?: string;
    },
  ): Promise<Order> => {
    const updated = await localDb.addPayment(id, dto);
    apiClient.post<Order>(`/orders/${id}/payments`, dto, { timeout: 3500 }).catch(() => {});
    return updated;
  },

  recordPayment: async (id: string, payment: any): Promise<Order> => {
    return ordersApi.addPayment(id, payment);
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    return localDb.getDashboardStats();
  },

  retryWhatsApp: async (orderId: string, messageId: string): Promise<any> => {
    await localDb.retryWhatsAppMessage(messageId);
    apiClient.post(`/whatsapp/retry/${messageId}`, {}, { timeout: 2500 }).catch(() => {});
    return { success: true };
  },
};
