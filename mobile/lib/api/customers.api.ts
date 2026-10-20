import { apiClient } from './client';

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
    const { data } = await apiClient.get<CustomersListResponse>('/customers', { params });
    return data;
  },

  list: async (params?: { search?: string; page?: number; limit?: number }): Promise<CustomersListResponse> => {
    return customersApi.getAll(params);
  },

  getById: async (id: string): Promise<Customer> => {
    const { data } = await apiClient.get<Customer>(`/customers/${id}`);
    return data;
  },

  get: async (id: string): Promise<Customer> => {
    return customersApi.getById(id);
  },

  create: async (customerData: CreateCustomerData): Promise<Customer> => {
    const payload = {
      name: customerData.name,
      whatsappNumber: customerData.whatsappNumber,
      altPhone: customerData.altPhone || customerData.alternatePhone,
      notes: customerData.notes,
      consentGiven: customerData.consentGiven ?? customerData.whatsappConsent ?? true,
    };
    const { data } = await apiClient.post<Customer>('/customers', payload);
    return data;
  },

  update: async (id: string, updates: Partial<CreateCustomerData>): Promise<Customer> => {
    const { data } = await apiClient.put<Customer>(`/customers/${id}`, updates);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/customers/${id}`);
  },

  checkDuplicate: async (whatsappNumber: string): Promise<Customer | null> => {
    try {
      const res = await customersApi.getAll({ search: whatsappNumber, limit: 1 });
      const found = res.data?.find((c) => c.whatsappNumber === whatsappNumber);
      return found || null;
    } catch {
      return null;
    }
  },
};
