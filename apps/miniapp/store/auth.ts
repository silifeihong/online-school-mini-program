import { observable, action, computed } from 'mobx-miniprogram';
import { storage } from '../utils/storage';
import * as authService from '../services/auth';
import type { LoginResponse } from '../services/auth';

// MobX-miniprogram 使用函数式 API
const authStore = observable({
  isLoggedIn: false,
  userInfo: null as LoginResponse['user'] | null,
  accessToken: null as string | null,

  // Computed
  get isProfileCompleted() {
    return this.userInfo?.is_profile_completed ?? false;
  },

  // Actions
  setLoginInfo: action(function (this: any, data: LoginResponse) {
    this.accessToken = data.access_token;
    this.userInfo = data.user;
    this.isLoggedIn = true;

    storage.setAccessToken(data.access_token);
    storage.setRefreshToken(data.refresh_token);
    storage.setUserInfo(data.user);
  }),

  setUserInfo: action(function (this: any, info: LoginResponse['user']) {
    this.userInfo = info;
    storage.setUserInfo(info);
  }),

  logout: action(function (this: any) {
    this.isLoggedIn = false;
    this.userInfo = null;
    this.accessToken = null;
    storage.clearAuth();
  }),

  checkLoginStatus: action(function (this: any) {
    const token = storage.getAccessToken();
    const userInfo = storage.getUserInfo<LoginResponse['user']>();

    if (token && userInfo) {
      this.accessToken = token;
      this.userInfo = userInfo;
      this.isLoggedIn = true;
    }
  }),
});

export { authStore };
