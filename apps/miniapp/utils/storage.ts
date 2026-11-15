const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_INFO: 'user_info',
} as const;

/**
 * 本地存储工具
 */
export const storage = {
  // Token 相关
  getAccessToken(): string | null {
    return wx.getStorageSync(STORAGE_KEYS.ACCESS_TOKEN) || null;
  },

  setAccessToken(token: string): void {
    wx.setStorageSync(STORAGE_KEYS.ACCESS_TOKEN, token);
  },

  getRefreshToken(): string | null {
    return wx.getStorageSync(STORAGE_KEYS.REFRESH_TOKEN) || null;
  },

  setRefreshToken(token: string): void {
    wx.setStorageSync(STORAGE_KEYS.REFRESH_TOKEN, token);
  },

  // 用户信息
  getUserInfo<T = any>(): T | null {
    const data = wx.getStorageSync(STORAGE_KEYS.USER_INFO);
    return data ? JSON.parse(data) : null;
  },

  setUserInfo<T = any>(info: T): void {
    wx.setStorageSync(STORAGE_KEYS.USER_INFO, JSON.stringify(info));
  },

  // 清除登录状态
  clearAuth(): void {
    wx.removeStorageSync(STORAGE_KEYS.ACCESS_TOKEN);
    wx.removeStorageSync(STORAGE_KEYS.REFRESH_TOKEN);
    wx.removeStorageSync(STORAGE_KEYS.USER_INFO);
  },

  // 检查是否已登录
  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  },
};
