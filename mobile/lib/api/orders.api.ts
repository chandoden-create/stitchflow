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
    try {
      const { data } = await apiClient.get<any>('/orders', {
        params,
        timeout: 6000,
      });

      const list = data?.data || (Array.isArray(data) ? data : []);
      if (Array.isArray(list) && list.length > 0) {
        await localDb.syncCloudOrders(list);
      }
    } catch {
      // Backend offline or waking up; proceed with local data
    }
    return localDb.listOrders(params);
  },

  list: async (params?: any): Promise<OrdersListResponse> => {
    return ordersApi.getAll(params);
  },

  getById: async (id: string): Promise<Order> => {
    try {
      const { data } = await apiClient.get<Order>(`/orders/${id}`, { timeout: 5000 });
      if (data && data.id) {
        await localDb.syncCloudOrders([data]);
      }
    } catch {
      // Fallback
    }
    return localDb.getOrderById(id);
  },

  get: async (id: string): Promise<Order> => {
    return ordersApi.getById(id);
  },

  create: async (orderData: CreateOrderData): Promise<Order> => {
    const items = (orderData.items || []).map((it, idx) => {
      const rawPrice = parseFloat(String(it.unitPrice).replace(/[^0-9.]/g, '') || '0');
      return {
        garmentType: it.garmentType || 'BLOUSE_STITCHING',
        description: (it.description || 'Custom Garment').trim(),
        quantity: Math.max(1, Number(it.quantity) || 1),
        unitPrice: rawPrice.toFixed(2),
        notes: it.notes?.trim() || undefined,
        sortOrder: it.sortOrder ?? idx,
      };
    });

    const payload: any = {
      customerId: orderData.customerId,
      items,
    };

    if (orderData.discount !== undefined && orderData.discount !== '') {
      const d = parseFloat(String(orderData.discount).replace(/[^0-9.]/g, '') || '0');
      if (d > 0) payload.discount = d.toFixed(2);
    }
    if (orderData.additionalCharges !== undefined && orderData.additionalCharges !== '') {
      const ac = parseFloat(String(orderData.additionalCharges).replace(/[^0-9.]/g, '') || '0');
      if (ac > 0) payload.additionalCharges = ac.toFixed(2);
    }
    if (orderData.advanceAmount !== undefined && orderData.advanceAmount !== '') {
      const adv = parseFloat(String(orderData.advanceAmount).replace(/[^0-9.]/g, '') || '0');
      if (adv > 0) payload.advanceAmount = adv.toFixed(2);
    }
    if (orderData.dueDate) {
      try {
        payload.dueDate = new Date(orderData.dueDate).toISOString();
      } catch {
        // Ignore date parse error
      }
    }
    if (orderData.notes?.trim()) {
      payload.notes = orderData.notes.trim();
    }

    try {
      const { data } = await apiClient.post<Order>('/orders', payload, { timeout: 9000 });
      if (data && data.id) {
        await localDb.syncCloudOrders([data]);
        return await localDb.getOrderById(data.id);
      }
    } catch (err) {
      console.warn('Backend order creation failed, falling back to localDb:', err);
    }

    return await localDb.createOrder(orderData);
  },

  updateStatus: async (
    id: string,
    dto: { status: string; notes?: string }
  ): Promise<Order> => {
    try {
      const { data } = await apiClient.put<Order>(`/orders/${id}/status`, dto, { timeout: 6000 });
      if (data && data.id) {
        await localDb.syncCloudOrders([data]);
        return await localDb.getOrderById(data.id);
      }
    } catch {
      // Fallback
    }
    return await localDb.updateOrderStatus(id, dto);
  },

  addPayment: async (
    id: string,
    dto: {
      amount: string | number;
      paymentMethod: string;
      transactionRef?: string;
      notes?: string;
      receivedAt?: string;
    }
  ): Promise<Order> => {
    const rawAmt = parseFloat(String(dto.amount).replace(/[^0-9.]/g, '') || '0');
    const payload = {
      amount: rawAmt.toFixed(2),
      paymentMethod: dto.paymentMethod || 'CASH',
      transactionRef: dto.transactionRef || undefined,
      notes: dto.notes || undefined,
      receivedAt: dto.receivedAt || new Date().toISOString(),
    };

    try {
      const { data } = await apiClient.post<Order>(`/orders/${id}/payments`, payload, {
        timeout: 6000,
      });
      if (data && data.id) {
        await localDb.syncCloudOrders([data]);
        return await localDb.getOrderById(data.id);
      }
    } catch {
      // Fallback
    }
    return await localDb.addPayment(id, dto);
  },

  recordPayment: async (id: string, payment: any): Promise<Order> => {
    return ordersApi.addPayment(id, payment);
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      const { data } = await apiClient.get<DashboardStats>('/orders/dashboard', { timeout: 5000 });
      if (data && data.totalCustomers !== undefined) {
        return data;
      }
    } catch {
      // Fallback
    }
    return localDb.getDashboardStats();
  },

  retryWhatsApp: async (_orderId: string, messageId: string): Promise<any> => {
    await localDb.retryWhatsAppMessage(messageId);
    apiClient.post(`/whatsapp/retry/${messageId}`, {}, { timeout: 3000 }).catch(() => {});
    return { success: true };
  },
};
