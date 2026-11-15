import { authStore } from './store/auth';

App({
  globalData: {},

  onLaunch() {
    console.log('App launched');
    // Try to auto login with stored token
    authStore.checkLoginStatus();
  },

  onShow() {
    console.log('App shown');
  },

  onHide() {
    console.log('App hidden');
  },
});
