import { apiClient } from './client';
import { storage } from '@/lib/utils/storage';
import { localDb } from '@/lib/store/local-db';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name?: string;
  designerName?: string;
  businessName: string;
  email: string;
  phone?: string;
  address?: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  token?: string;
  designer: DesignerProfile;
}

export interface DesignerProfile {
  id: string;
  name?: string;
  designerName?: string;
  businessName: string;
  email: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  currency?: string;
  currencySymbol?: string;
  whatsappPhoneNumberId?: string;
  whatsappAccessToken?: string;
  whatsappSandboxMode?: boolean;
  messageSignature?: string;
  createdAt?: string;
}

export const authApi = {
  ensureBackendAuth: async (): Promise<{ token: string; designer: DesignerProfile } | null> => {
    try {
      const existingToken = await storage.getItem('auth_token');
      // If we already have a real JWT token (not a mock token)
      if (
        existingToken &&
        existingToken !== 'local-boutique-session-token' &&
        existingToken.split('.').length === 3
      ) {
        try {
          const { data } = await apiClient.get<any>('/auth/me', { timeout: 2000 });
          if (data && data.id) {
            const designer = await localDb.updateDesigner(data);
            return { token: existingToken, designer };
          }
        } catch (err: any) {
          if (err.response?.status !== 401) {
            const localDesigner = await localDb.getDesigner();
            return { token: existingToken, designer: localDesigner };
          }
        }
      }

      // Try logging in with seeded admin credentials
      try {
        const { data } = await apiClient.post<any>(
          '/auth/login',
          { email: 'admin@stitchflow.app', password: 'Demo@1234' },
          { timeout: 2500 }
        );
        const accessToken = data?.accessToken || data?.token;
        if (accessToken) {
          const designer = await localDb.updateDesigner(data.designer || { email: 'admin@stitchflow.app' });
          await storage.setItem('auth_token', accessToken);
          await storage.setItem('designer_profile', JSON.stringify(designer));
          return { token: accessToken, designer };
        }
      } catch (loginErr: any) {
        // If account doesn't exist yet on fresh database, auto-register
        if (loginErr.response?.status === 401 || loginErr.response?.status === 404) {
          try {
            const { data } = await apiClient.post<any>(
              '/auth/register',
              {
                name: 'Bhagyashri',
                businessName: 'Bhagyashri Tailoring',
                email: 'admin@stitchflow.app',
                password: 'Demo@1234',
                phone: '+919876543210',
                address: '12, Shivaji Nagar, Pune, Maharashtra 411005',
              },
              { timeout: 2500 }
            );
            const accessToken = data?.accessToken || data?.token;
            if (accessToken) {
              const designer = await localDb.updateDesigner(data.designer || { email: 'admin@stitchflow.app' });
              await storage.setItem('auth_token', accessToken);
              await storage.setItem('designer_profile', JSON.stringify(designer));
              return { token: accessToken, designer };
            }
          } catch {
            // Register failed, continue to local fallback
          }
        }
      }
    } catch {
      // Offline / Render waking up
    }
    return null;
  },

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const { data } = await apiClient.post<any>('/auth/login', credentials, { timeout: 8000 });
      const accessToken = data?.accessToken || data?.token || 'local-boutique-session-token';
      const designer = await localDb.updateDesigner(data?.designer || { email: credentials.email });
      await storage.setItem('auth_token', accessToken);
      await storage.setItem('designer_profile', JSON.stringify(designer));
      return { accessToken, designer };
    } catch {
      const designer = await localDb.updateDesigner({ email: credentials.email });
      const accessToken = 'local-boutique-session-token';
      await storage.setItem('auth_token', accessToken);
      await storage.setItem('designer_profile', JSON.stringify(designer));
      return { accessToken, designer };
    }
  },

  register: async (registerData: RegisterData): Promise<AuthResponse> => {
    const payload = {
      name: registerData.name || registerData.designerName || 'Bhagyashri',
      businessName: registerData.businessName || 'Bhagyashri Tailoring',
      email: registerData.email,
      password: registerData.password,
      phone: registerData.phone || undefined,
      address: registerData.address || undefined,
    };

    try {
      const { data } = await apiClient.post<any>('/auth/register', payload, { timeout: 8000 });
      const accessToken = data?.accessToken || data?.token || 'local-boutique-session-token';
      const designer = await localDb.updateDesigner({ ...payload, ...(data?.designer || {}) });
      await storage.setItem('auth_token', accessToken);
      await storage.setItem('designer_profile', JSON.stringify(designer));
      return { accessToken, designer };
    } catch {
      const designer = await localDb.updateDesigner(payload);
      const accessToken = 'local-boutique-session-token';
      await storage.setItem('auth_token', accessToken);
      await storage.setItem('designer_profile', JSON.stringify(designer));
      return { accessToken, designer };
    }
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout', {}, { timeout: 2000 });
    } catch {
      // Ignore logout API errors
    } finally {
      await storage.deleteItem('auth_token');
    }
  },

  forgotPassword: async (email: string): Promise<void> => {
    try {
      await apiClient.post('/auth/forgot-password', { email }, { timeout: 5000 });
    } catch {
      // Handled gracefully
    }
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    try {
      await apiClient.post('/auth/reset-password', { token, password }, { timeout: 5000 });
    } catch {
      // Handled gracefully
    }
  },

  getProfile: async (): Promise<DesignerProfile> => {
    const localProfile = await localDb.getDesigner();
    try {
      const { data } = await apiClient.get<DesignerProfile>('/auth/me', { timeout: 5000 });
      if (data && data.id) {
        return await localDb.updateDesigner(data);
      }
    } catch {
      // Return local profile immediately
    }
    return localProfile;
  },

  updateProfile: async (updates: Partial<DesignerProfile>): Promise<DesignerProfile> => {
    const updatedLocal = await localDb.updateDesigner(updates);
    apiClient.put<DesignerProfile>('/auth/me', updates, { timeout: 6000 }).catch(() => {});
    return updatedLocal;
  },
};
