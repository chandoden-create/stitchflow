import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { storage } from '@/lib/utils/storage';
import type { DesignerProfile } from '@/lib/api/auth.api';
import { authApi } from '@/lib/api/auth.api';

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
    token: null,
    designer: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [token, profileJson] = await Promise.all([
        storage.getItem('auth_token'),
        storage.getItem('designer_profile'),
      ]);
      if (token && profileJson) {
        const designer = JSON.parse(profileJson) as DesignerProfile;
        setState({ token, designer, isLoading: false, isAuthenticated: true });
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const signIn = useCallback(async (token: string, designer: DesignerProfile) => {
    await storage.setItem('auth_token', token);
    await storage.setItem('designer_profile', JSON.stringify(designer));
    setState({ token, designer, isLoading: false, isAuthenticated: true });
  }, []);

  const signOut = useCallback(async () => {
    await authApi.logout();
    await storage.deleteItem('auth_token');
    await storage.deleteItem('designer_profile');
    setState({ token: null, designer: null, isLoading: false, isAuthenticated: false });
  }, []);

  const updateDesigner = useCallback((designer: DesignerProfile) => {
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
