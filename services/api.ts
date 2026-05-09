import axios, { AxiosInstance, AxiosError } from 'axios';
import { secureStorage } from '@/utils/secureStorage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

interface ApiResponse<T = any> {
  accessToken?: string;
  refreshToken?: string;
  user?: T;
  message?: string;
}

interface AuthUser {
  id: string;
  email: string;
  name: string;
  [key: string]: any;
}

let isRefreshing = false;
let failedQueue: Array<(token: string) => void> = [];

const processQueue = (token: string) => {
  failedQueue.forEach((prom) => prom(token));
  failedQueue = [];
};

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
});

// Request interceptor: Add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await secureStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Not a 401, pass through
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Already tried refreshing, don't retry
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // Already refreshing, queue the request
    if (isRefreshing) {
      return new Promise((resolve) => {
        failedQueue.push((token: string) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(api(originalRequest));
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await secureStorage.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
        headers: { Authorization: `Bearer ${refreshToken}` },
        withCredentials: true,
      });

      const { accessToken } = response.data;
      await secureStorage.setAccessToken(accessToken);

      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      processQueue(accessToken);

      return api(originalRequest);
    } catch (err) {
      // Refresh failed, clear tokens
      await secureStorage.clearAll();
      processQueue('');
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);

export const authApi = {
  async signup(name: string, email: string, password: string, newsletter?: boolean) {
    const res = await api.post<ApiResponse<AuthUser>>('/auth/signup', {
      name,
      email,
      password,
      newsletter,
    });
    await secureStorage.setAccessToken(res.data.accessToken!);
    if (res.data.refreshToken) await secureStorage.setRefreshToken(res.data.refreshToken);
    await secureStorage.setUser(res.data.user);
    return res.data;
  },

  async login(email: string, password: string) {
    const res = await api.post<ApiResponse<AuthUser>>('/auth/login', {
      email,
      password,
    });
    await secureStorage.setAccessToken(res.data.accessToken!);
    if (res.data.refreshToken) await secureStorage.setRefreshToken(res.data.refreshToken);
    await secureStorage.setUser(res.data.user);
    return res.data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      await secureStorage.clearAll();
    }
  },

  async sendVerificationOtp() {
    const res = await api.post<{ message: string }>('/auth/send-verification');
    return res.data;
  },

  async verifyEmail(otp: string) {
    const res = await api.post<{ message: string }>('/auth/verify-email', { otp });
    return res.data;
  },

  async forgotPassword(email: string) {
    const res = await api.post<{ message: string }>('/auth/forgot-password', { email });
    return res.data;
  },

  async resetPassword(email: string, otp: string, newPassword: string) {
    const res = await api.post<{ message: string }>('/auth/reset-password', {
      email,
      otp,
      newPassword,
    });
    return res.data;
  },

  async getMe() {
    const res = await api.get<AuthUser>('/auth/me');
    return res.data;
  },

  async getStoredUser() {
    return secureStorage.getUser();
  },

  async clearSession() {
    await secureStorage.clearAll();
  },
};
