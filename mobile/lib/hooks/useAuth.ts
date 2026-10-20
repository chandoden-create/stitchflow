import { useAuthStore } from '@/lib/store/auth.store';

export function useAuth() {
  return useAuthStore();
}
