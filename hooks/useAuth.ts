import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export const useAuth = () => {
  const store = useAuthStore();

  useEffect(() => {
    // Hydrate on app startup
    store.hydrate();
  }, []);

  return {
    user: store.user,
    isLoggedIn: store.isLoggedIn,
    isLoading: store.isLoading,
    error: store.error,

    signup: store.signup,
    login: store.login,
    logout: store.logout,
    verifyEmail: store.verifyEmail,
    sendVerificationOtp: store.sendVerificationOtp,
    forgotPassword: store.forgotPassword,
    resetPassword: store.resetPassword,
    clearError: store.clearError,
  };
};
