import { authStore } from '../../store/auth';

Page({
  data: {
    isLoading: true,
  },

  onLoad() {
    this.checkAuthAndRedirect();
  },

  /**
   * 检查登录状态并跳转
   */
  checkAuthAndRedirect() {
    authStore.checkLoginStatus();

    setTimeout(() => {
      if (authStore.isLoggedIn && !authStore.isProfileCompleted) {
        wx.redirectTo({ url: '/pages/profile-setup/index' });
      } else {
        // 首页列表游客可见：未登录也直接进首页，需鉴权的页面（详情/我的等）各自拦截
        wx.switchTab({ url: '/pages/home/index' });
      }
    }, 1500);
  },
});
