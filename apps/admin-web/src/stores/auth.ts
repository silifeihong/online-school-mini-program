import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as authApi from '@/api/auth';

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(localStorage.getItem('access_token'));
  const refreshToken = ref<string | null>(localStorage.getItem('refresh_token'));
  const adminInfo = ref<any>(null);

  const isLoggedIn = computed(() => !!accessToken.value);

  function setTokens(access: string, refresh: string) {
    accessToken.value = access;
    refreshToken.value = refresh;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  }

  function setAdminInfo(info: any) {
    adminInfo.value = info;
  }

  function logout() {
    accessToken.value = null;
    refreshToken.value = null;
    adminInfo.value = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  async function login(username: string, password: string) {
    const result = await authApi.login({ username, password });
    setTokens(result.access_token, result.refresh_token);
    setAdminInfo(result.admin);
    return result;
  }

  return {
    accessToken,
    refreshToken,
    adminInfo,
    isLoggedIn,
    setTokens,
    setAdminInfo,
    logout,
    login,
  };
});
