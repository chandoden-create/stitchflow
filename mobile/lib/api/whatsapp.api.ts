import { apiClient } from './client';

export interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  verifyToken: string;
  sandboxMode: boolean;
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
  phoneNumber?: string;
}

export const whatsappApi = {
  updateConfig: async (config: Partial<WhatsAppConfig>): Promise<void> => {
    await apiClient.put('/whatsapp/config', config);
  },

  testConnection: async (): Promise<TestConnectionResult> => {
    const { data } = await apiClient.post<TestConnectionResult>('/whatsapp/test');
    return data;
  },

  sendManual: async (orderId: string, messageType: string): Promise<void> => {
    await apiClient.post(`/whatsapp/send`, { orderId, messageType });
  },

  retryMessage: async (messageId: string): Promise<any> => {
    const { data } = await apiClient.post(`/whatsapp/messages/${messageId}/retry`);
    return data;
  },
};
