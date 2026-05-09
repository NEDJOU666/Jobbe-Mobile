import { create } from 'zustand';
import { authApi } from '@/services/api';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  isEmailVerified?: boolean;
  [key: string]: any;
}

interface AuthStore {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  isLoggedIn: boolean;

  // Actions
  signup: (name: string, email: string, password: string, newsletter?: boolean) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  verifyEmail: (otp: string) => Promise<void>;
  sendVerificationOtp: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<void>;
  hydrate: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: false,
  error: null,
  isLoggedIn: false,

  signup: async (name, email, password, newsletter) => {
    set({ isLoading: true, error: null });
    try {
      await authApi.signup(name, email, password, newsletter);
      const user = await authApi.getStoredUser();
      set({ user, isLoggedIn: true, isLoading: false });
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Signup failed';
      set({ error: errorMsg, isLoading: false });
      throw err;
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      await authApi.login(email, password);
      const user = await authApi.getStoredUser();
      set({ user, isLoggedIn: true, isLoading: false });
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Login failed';
      set({ error: errorMsg, isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authApi.logout();
      set({ user: null, isLoggedIn: false, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
    }
  },

  sendVerificationOtp: async () => {
    set({ isLoading: true, error: null });
    try {
      await authApi.sendVerificationOtp();
      set({ isLoading: false });
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to send OTP';
      set({ error: errorMsg, isLoading: false });
      throw err;
    }
  },

  verifyEmail: async (otp) => {
    set({ isLoading: true, error: null });
    try {
      await authApi.verifyEmail(otp);
      const user = await authApi.getStoredUser();
      set({ user: { ...user, isEmailVerified: true }, isLoading: false });
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Verification failed';
      set({ error: errorMsg, isLoading: false });
      throw err;
    }
  },

  forgotPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      await authApi.forgotPassword(email);
      set({ isLoading: false });
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to send reset link';
      set({ error: errorMsg, isLoading: false });
      throw err;
    }
  },

  resetPassword: async (email, otp, newPassword) => {
    set({ isLoading: true, error: null });
    try {
      await authApi.resetPassword(email, otp, newPassword);
      set({ isLoading: false });
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Password reset failed';
      set({ error: errorMsg, isLoading: false });
      throw err;
    }
  },

  hydrate: async () => {
    set({ isLoading: true });
    try {
      const user = await authApi.getStoredUser();
      if (user) {
        set({ user, isLoggedIn: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (err) {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
