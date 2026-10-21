import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { storage } from '@/lib/utils/storage';
import type { DesignerProfile } from '@/lib/api/auth.api';
import { authApi } from '@/lib/api/auth.api';
import { localDb, DEFAULT_DESIGNER } from '@/lib/store/local-db';
import { customersApi } from '@/lib/api/customers.api';
import { ordersApi } from '@/lib/api/orders.api';

export interface AuthState {
  token: string | null;
  designer: DesignerProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  cloudSynced: boolean;
}

export interface AuthContextValue extends AuthState {
  signIn: (token: string, designer: DesignerProfile) => Promise<void>;
  signOut: () => Promise<void>;
  updateDesigner: (designer: DesignerProfile) => void;
  refreshProfile: () => Promise<void>;
  syncWithCloud: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    designer: DEFAULT_DESIGNER,
    isLoading: false,
    isAuthenticated: true,
    cloudSynced: false,
  });

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const syncWithCloud = useCallback(async () => {
    try {
      const authResult = await authApi.ensureBackendAuth();
      if (authResult?.token) {
        setState((prev) => ({
          ...prev,
          token: authResult.token,
          designer: authResult.designer,
          isAuthenticated: true,
          cloudSynced: true,
        }));

        // Restore / pull all cloud data from PostgreSQL
        await Promise.allSettled([
          customersApi.getAll(),
          ordersApi.getAll(),
        ]);
      }
    } catch {
      // Offline or backend unavailable
    }
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedProfileJson] = await Promise.all([
        storage.getItem('auth_token'),
        storage.getItem('designer_profile'),
      ]);

      const localDesigner = await localDb.getDesigner();
      let designer: DesignerProfile = localDesigner;

      if (storedProfileJson) {
        try {
          const parsed = JSON.parse(storedProfileJson) as DesignerProfile;
          designer = { ...localDesigner, ...parsed };
          await localDb.updateDesigner(designer);
        } catch {
          designer = localDesigner;
        }
      } else {
        await storage.setItem('designer_profile', JSON.stringify(designer));
      }

      setState({
        token: storedToken,
        designer,
        isLoading: false,
        isAuthenticated: true,
        cloudSynced: false,
      });

      // Seamlessly verify cloud auth & sync cloud database in background
      syncWithCloud();
    } catch {
      const fallback = await localDb.getDesigner();
      setState({
        token: null,
        designer: fallback,
        isLoading: false,
        isAuthenticated: true,
        cloudSynced: false,
      });
      syncWithCloud();
    }
  };

  const signIn = useCallback(async (token: string, designer: DesignerProfile) => {
    await storage.setItem('auth_token', token);
    const merged = await localDb.updateDesigner(designer);
    await storage.setItem('designer_profile', JSON.stringify(merged));
    setState({ token, designer: merged, isLoading: false, isAuthenticated: true, cloudSynced: true });
    // Pull full data from cloud
    try {
      await Promise.allSettled([
        customersApi.getAll(),
        ordersApi.getAll(),
      ]);
    } catch {}
  }, []);

  const signOut = useCallback(async () => {
    await authApi.logout();
    await storage.deleteItem('auth_token');
    const designer = await localDb.getDesigner();
    setState({ token: null, designer, isLoading: false, isAuthenticated: false, cloudSynced: false });
  }, []);

  const updateDesigner = useCallback((designer: DesignerProfile) => {
    localDb.updateDesigner(designer).catch(() => {});
    storage.setItem('designer_profile', JSON.stringify(designer)).catch(() => {});
    setState((prev) => ({ ...prev, designer }));
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const designer = await authApi.getProfile();
      await storage.setItem('designer_profile', JSON.stringify(designer));
      setState((prev) => ({ ...prev, designer }));
    } catch {
      // Fail silently
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signOut,
        updateDesigner,
        refreshProfile,
        syncWithCloud,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthStore() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthStore must be used within AuthProvider');
  return ctx;
}
