import axios from 'axios';
import { storage } from '@/lib/utils/storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await storage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    // If backend wrapped response in { success: true, data: ... }, unwrap data
    if (response.data && response.data.success === true && response.data.data !== undefined) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      await storage.deleteItem('auth_token');
      await storage.deleteItem('designer_profile');
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data?.message === 'string') return data.message;
    if (typeof data?.error === 'string') return data.error;
    if (error.response?.status === 401) return 'Session expired. Please log in again.';
    if (error.response?.status === 404) return 'Resource not found.';
    if (error.response?.status === 422) return 'Validation failed. Please check your inputs.';
    if (error.response?.status && error.response.status >= 500) return 'Server error. Please try again later.';
    if (error.code === 'ECONNABORTED') return 'Request timed out. Please check your connection.';
    if (!error.response) return 'Network error. Please check your internet connection.';
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred.';
}
