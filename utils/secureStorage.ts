import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'jobfinder_access_token';
const REFRESH_TOKEN_KEY = 'jobfinder_refresh_token';
const USER_KEY = 'jobfinder_user';

export const secureStorage = {
  async setAccessToken(token: string) {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (err) {
      console.error('Failed to save access token', err);
    }
  },

  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setRefreshToken(token: string) {
    try {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    } catch (err) {
      console.error('Failed to save refresh token', err);
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setUser(user: any) {
    try {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    } catch (err) {
      console.error('Failed to save user', err);
    }
  },

  async getUser(): Promise<any | null> {
    try {
      const user = await SecureStore.getItemAsync(USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  async clearAll() {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(TOKEN_KEY),
        SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
        SecureStore.deleteItemAsync(USER_KEY),
      ]);
    } catch (err) {
      console.error('Failed to clear secure storage', err);
    }
  },
};
