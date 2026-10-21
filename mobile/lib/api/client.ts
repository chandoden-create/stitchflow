import axios from 'axios';
import { storage } from '@/lib/utils/storage';

export const CLOUD_API_URL = 'https://stitchflow-api-chandoden.onrender.com';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || CLOUD_API_URL;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  const customUrl = await storage.getItem('custom_api_url');
  if (customUrl) {
    config.baseURL = customUrl;
  }
  const token = await storage.getItem('auth_token');
  if (token && token !== 'local-boutique-session-token') {
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
