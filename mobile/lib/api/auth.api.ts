import { apiClient } from './client';
import * as SecureStore from 'expo-secure-store';

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
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await apiClient.post<any>('/auth/login', credentials);
    const accessToken = data.accessToken || data.token;
    const designer = data.designer;
    if (accessToken) {
      await SecureStore.setItemAsync('auth_token', accessToken);
    }
    if (designer) {
      await SecureStore.setItemAsync('designer_profile', JSON.stringify(designer));
    }
    return { accessToken, designer };
  },

  register: async (registerData: RegisterData): Promise<AuthResponse> => {
    const payload = {
      name: registerData.name || registerData.designerName,
      businessName: registerData.businessName,
      email: registerData.email,
      phone: registerData.phone,
      address: registerData.address,
      password: registerData.password,
    };
    const { data } = await apiClient.post<any>('/auth/register', payload);
    const accessToken = data.accessToken || data.token;
    const designer = data.designer;
    if (accessToken) {
      await SecureStore.setItemAsync('auth_token', accessToken);
    }
    if (designer) {
      await SecureStore.setItemAsync('designer_profile', JSON.stringify(designer));
    }
    return { accessToken, designer };
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore logout API errors
    } finally {
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('designer_profile');
    }
  },

  forgotPassword: async (email: string): Promise<void> => {
    await apiClient.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    await apiClient.post('/auth/reset-password', { token, password });
  },

  getProfile: async (): Promise<DesignerProfile> => {
    const { data } = await apiClient.get<DesignerProfile>('/auth/me');
    return data;
  },

  updateProfile: async (updates: Partial<DesignerProfile>): Promise<DesignerProfile> => {
    const { data } = await apiClient.put<DesignerProfile>('/auth/me', updates);
    await SecureStore.setItemAsync('designer_profile', JSON.stringify(data));
    return data;
  },
};
