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
  /**
   * Return cached data immediately in 0ms, and sync cloud updates silently in background.
   */
  getAll: async (params?: { search?: string; page?: number; limit?: number }): Promise<CustomersListResponse> => {
    // 1. Instant local read (0ms)
    const localResult = await localDb.listCustomers(params);

    // 2. Trigger asynchronous background cloud sync (non-blocking)
    const queryParams: any = {};
    if (params?.search) queryParams.search = params.search;
    if (params?.page) queryParams.page = params.page;
    if (params?.limit) queryParams.limit = params.limit;

    apiClient
      .get<any>('/customers', {
        params: queryParams,
        timeout: 2500,
      })
      .then(async ({ data }) => {
        const list = data?.data || (Array.isArray(data) ? data : []);
        if (Array.isArray(list) && list.length > 0) {
          await localDb.syncCloudCustomers(list);
        }
      })
      .catch(() => {});

    return localResult;
  },

  list: async (params?: { search?: string; page?: number; limit?: number }): Promise<CustomersListResponse> => {
    return customersApi.getAll(params);
  },

  /**
   * Explicit cloud sync (used by pull-to-refresh & manual sync button)
   */
  syncFromCloud: async (): Promise<CustomersListResponse> => {
    try {
      const { data } = await apiClient.get<any>('/customers', { timeout: 3500 });
      const list = data?.data || (Array.isArray(data) ? data : []);
      if (Array.isArray(list) && list.length > 0) {
        await localDb.syncCloudCustomers(list);
      }
    } catch {
      // Backend waking up or offline
    }
    return localDb.listCustomers();
  },

  getById: async (id: string): Promise<Customer> => {
    const localCustomer = await localDb.getCustomerById(id).catch(() => null);

    apiClient
      .get<Customer>(`/customers/${id}`, { timeout: 2500 })
      .then(async ({ data }) => {
        if (data && data.id) {
          await localDb.syncCloudCustomers([data]);
        }
      })
      .catch(() => {});

    if (localCustomer) return localCustomer;

    // If not found locally, await cloud fetch
    try {
      const { data } = await apiClient.get<Customer>(`/customers/${id}`, { timeout: 3000 });
      if (data && data.id) {
        await localDb.syncCloudCustomers([data]);
        return await localDb.getCustomerById(data.id);
      }
    } catch {}

    return localDb.getCustomerById(id);
  },

  get: async (id: string): Promise<Customer> => {
    return customersApi.getById(id);
  },

  create: async (customerData: CreateCustomerData): Promise<Customer> => {
    const cleanPhone = normalizeIndianPhone(customerData.whatsappNumber);
    const consentStatus =
      customerData.consentGiven ?? customerData.whatsappConsent ?? true ? 'GIVEN' : 'PENDING';

    // 1. Save immediately to localDb for 0ms instant UI response!
    const localSaved = await localDb.createCustomer(customerData);

    // 2. Dispatch to cloud database in background
    const payload: any = {
      name: customerData.name.trim(),
      whatsappNumber: cleanPhone,
      consentStatus,
    };
    const alt = (customerData.altPhone || customerData.alternatePhone || '').trim();
    if (alt) payload.altPhone = normalizeIndianPhone(alt);
    if (customerData.notes?.trim()) payload.notes = customerData.notes.trim();

    apiClient
      .post<Customer>('/customers', payload, { timeout: 3500 })
      .then(async ({ data }) => {
        if (data && data.id) {
          await localDb.syncCloudCustomers([data]);
        }
      })
      .catch((err) => {
        console.warn('Background cloud customer sync queued:', err?.message);
      });

    return localSaved;
  },

  update: async (id: string, updates: Partial<CreateCustomerData>): Promise<Customer> => {
    const localUpdated = await localDb.updateCustomer(id, updates);

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

    apiClient
      .put<Customer>(`/customers/${id}`, payload, { timeout: 3000 })
      .then(async ({ data }) => {
        if (data && data.id) {
          await localDb.syncCloudCustomers([data]);
        }
      })
      .catch(() => {});

    return localUpdated;
  },

  delete: async (id: string): Promise<void> => {
    await localDb.deleteCustomer(id);
    apiClient.delete(`/customers/${id}`, { timeout: 2500 }).catch(() => {});
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
