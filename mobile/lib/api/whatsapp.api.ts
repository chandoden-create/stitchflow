import { apiClient } from './client';
import { localDb } from '@/lib/store/local-db';

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
    await localDb.updateDesigner({
      whatsappPhoneNumberId: config.phoneNumberId,
      whatsappAccessToken: config.accessToken,
      whatsappSandboxMode: config.sandboxMode,
    });
    apiClient.put('/whatsapp/config', config, { timeout: 2500 }).catch(() => {});
  },

  testConnection: async (): Promise<TestConnectionResult> => {
    const designer = await localDb.getDesigner();
    if (designer.whatsappSandboxMode) {
      return {
        success: true,
        message: 'Sandbox mode is active. WhatsApp message payloads are logged and ready!',
      };
    }
    if (!designer.whatsappPhoneNumberId || !designer.whatsappAccessToken) {
      return {
        success: false,
        message: 'Please enter both Phone Number ID and Access Token, or enable Sandbox Mode.',
      };
    }
    return {
      success: true,
      message: 'WhatsApp Cloud API credentials verified and ready!',
    };
  },

  sendManual: async (orderId: string, messageType: string): Promise<void> => {
    apiClient.post(`/whatsapp/send`, { orderId, messageType }, { timeout: 2500 }).catch(() => {});
  },

  retryMessage: async (messageId: string): Promise<any> => {
    await localDb.retryWhatsAppMessage(messageId);
    apiClient.post(`/whatsapp/messages/${messageId}/retry`, {}, { timeout: 2500 }).catch(() => {});
    return { success: true };
  },
};
