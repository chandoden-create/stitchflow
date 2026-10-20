import { apiClient } from './client';
import { localDb, normalizeIndianPhone } from '@/lib/store/local-db';

export interface Customer {
  id: string;
  name: string;
  whatsappNumber: string;
  altPhone?: string;
  alternatePhone?: string;
  notes?: string;
  consentStatus?: 'PENDING' | 'GIVEN' | 'REVOKED';
  whatsappConsent?: boolean;
  totalOrders?: number;
  activeOrders?: number;
  totalBilled?: number;
  totalPaid?: number;
  outstandingBalance?: number;
  orders?: any[];
  stats?: {
    totalOrders: number;
    totalBilled: string | number;
    totalPaid: string | number;
    outstanding: string | number;
  };
  _count?: {
    orders: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerData {
  name: string;
  whatsappNumber: string;
  altPhone?: string;
  alternatePhone?: string;
  notes?: string;
  consentGiven?: boolean;
  whatsappConsent?: boolean;
}

export interface CustomersListResponse {
  data: Customer[];
  customers?: Customer[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
  hasMore?: boolean;
}

export const customersApi = {
  getAll: async (params?: { search?: string; page?: number; limit?: number }): Promise<CustomersListResponse> => {
    return localDb.listCustomers(params);
  },

  list: async (params?: { search?: string; page?: number; limit?: number }): Promise<CustomersListResponse> => {
    return localDb.listCustomers(params);
  },

  getById: async (id: string): Promise<Customer> => {
    return localDb.getCustomerById(id);
  },

  get: async (id: string): Promise<Customer> => {
    return localDb.getCustomerById(id);
  },

  create: async (customerData: CreateCustomerData): Promise<Customer> => {
    const created = await localDb.createCustomer(customerData);
    // Sync to backend in background if available
    const payload = {
      name: customerData.name,
      whatsappNumber: created.whatsappNumber,
      altPhone: customerData.altPhone || customerData.alternatePhone,
      notes: customerData.notes,
      consentGiven: customerData.consentGiven ?? customerData.whatsappConsent ?? true,
    };
    apiClient.post<Customer>('/customers', payload, { timeout: 3500 }).catch(() => {});
    return created;
  },

  update: async (id: string, updates: Partial<CreateCustomerData>): Promise<Customer> => {
    const updated = await localDb.updateCustomer(id, updates);
    apiClient.put<Customer>(`/customers/${id}`, updates, { timeout: 3500 }).catch(() => {});
    return updated;
  },

  delete: async (id: string): Promise<void> => {
    await localDb.deleteCustomer(id);
    apiClient.delete(`/customers/${id}`, { timeout: 3500 }).catch(() => {});
  },

  checkDuplicate: async (whatsappNumber: string): Promise<Customer | null> => {
    try {
      const normalized = normalizeIndianPhone(whatsappNumber);
      const res = await localDb.listCustomers({ search: normalized, limit: 5 });
      const found = res.data?.find((c) => normalizeIndianPhone(c.whatsappNumber) === normalized);
      return found || null;
    } catch {
      return null;
    }
  },
};
