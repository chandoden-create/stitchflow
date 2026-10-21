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
    try {
      const queryParams: any = {};
      if (params?.search) queryParams.search = params.search;
      if (params?.page) queryParams.page = params.page;
      if (params?.limit) queryParams.limit = params.limit;

      const { data } = await apiClient.get<any>('/customers', {
        params: queryParams,
        timeout: 6000,
      });

      const list = data?.data || (Array.isArray(data) ? data : []);
      if (Array.isArray(list) && list.length > 0) {
        await localDb.syncCloudCustomers(list);
      }
    } catch {
      // Backend offline or waking up; proceed with local data
    }
    return localDb.listCustomers(params);
  },

  list: async (params?: { search?: string; page?: number; limit?: number }): Promise<CustomersListResponse> => {
    return customersApi.getAll(params);
  },

  getById: async (id: string): Promise<Customer> => {
    try {
      const { data } = await apiClient.get<Customer>(`/customers/${id}`, { timeout: 5000 });
      if (data && data.id) {
        await localDb.syncCloudCustomers([data]);
      }
    } catch {
      // Fallback to local
    }
    return localDb.getCustomerById(id);
  },

  get: async (id: string): Promise<Customer> => {
    return customersApi.getById(id);
  },

  create: async (customerData: CreateCustomerData): Promise<Customer> => {
    const cleanPhone = normalizeIndianPhone(customerData.whatsappNumber);
    const consentStatus =
      customerData.consentGiven ?? customerData.whatsappConsent ?? true ? 'GIVEN' : 'PENDING';

    const payload: any = {
      name: customerData.name.trim(),
      whatsappNumber: cleanPhone,
      consentStatus,
    };
    const alt = (customerData.altPhone || customerData.alternatePhone || '').trim();
    if (alt) payload.altPhone = normalizeIndianPhone(alt);
    if (customerData.notes?.trim()) payload.notes = customerData.notes.trim();

    try {
      const { data } = await apiClient.post<Customer>('/customers', payload, { timeout: 8000 });
      if (data && data.id) {
        await localDb.syncCloudCustomers([data]);
        return await localDb.getCustomerById(data.id);
      }
    } catch (err) {
      console.warn('Backend customer create failed, falling back to localDb:', err);
    }

    return await localDb.createCustomer(customerData);
  },

  update: async (id: string, updates: Partial<CreateCustomerData>): Promise<Customer> => {
    const payload: any = {};
    if (updates.name) payload.name = updates.name.trim();
    if (updates.whatsappNumber) payload.whatsappNumber = normalizeIndianPhone(updates.whatsappNumber);
    if (updates.altPhone || updates.alternatePhone) {
      payload.altPhone = normalizeIndianPhone(updates.altPhone || updates.alternatePhone || '');
    }
    if (updates.notes !== undefined) payload.notes = updates.notes;
    if (updates.consentGiven !== undefined || updates.whatsappConsent !== undefined) {
      payload.consentStatus = updates.consentGiven ?? updates.whatsappConsent ? 'GIVEN' : 'PENDING';
    }

    try {
      const { data } = await apiClient.put<Customer>(`/customers/${id}`, payload, { timeout: 6000 });
      if (data && data.id) {
        await localDb.syncCloudCustomers([data]);
        return await localDb.getCustomerById(data.id);
      }
    } catch {
      // Fallback
    }

    return await localDb.updateCustomer(id, updates);
  },

  delete: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/customers/${id}`, { timeout: 5000 });
    } catch {
      // Fallback
    }
    await localDb.deleteCustomer(id);
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
