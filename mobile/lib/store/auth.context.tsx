import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { storage } from '@/lib/utils/storage';
import type { DesignerProfile } from '@/lib/api/auth.api';
import { authApi } from '@/lib/api/auth.api';
import { localDb } from '@/lib/store/local-db';

export interface AuthState {
  token: string | null;
  designer: DesignerProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthContextValue extends AuthState {
  signIn: (token: string, designer: DesignerProfile) => Promise<void>;
  signOut: () => Promise<void>;
  updateDesigner: (designer: DesignerProfile) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: 'local-boutique-session-token',
    designer: null,
    isLoading: true,
    isAuthenticated: true,
  });

  useEffect(() => {
    loadStoredAuth();
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

      const token = storedToken || 'local-boutique-session-token';
      if (!storedToken) {
        await storage.setItem('auth_token', token);
      }

      setState({
        token,
        designer,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch {
      const fallback = await localDb.getDesigner();
      setState({
        token: 'local-boutique-session-token',
        designer: fallback,
        isLoading: false,
        isAuthenticated: true,
      });
    }
  };

  const signIn = useCallback(async (token: string, designer: DesignerProfile) => {
    await storage.setItem('auth_token', token);
    const merged = await localDb.updateDesigner(designer);
    await storage.setItem('designer_profile', JSON.stringify(merged));
    setState({ token, designer: merged, isLoading: false, isAuthenticated: true });
  }, []);

  const signOut = useCallback(async () => {
    await authApi.logout();
    await storage.deleteItem('auth_token');
    const designer = await localDb.getDesigner();
    setState({ token: null, designer, isLoading: false, isAuthenticated: false });
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
    <AuthContext.Provider value={{ ...state, signIn, signOut, updateDesigner, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthStore() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthStore must be used within AuthProvider');
  return ctx;
}
