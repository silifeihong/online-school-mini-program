import { authStore } from '../../store/auth';
import * as authService from '../../services/auth';

Page({
  data: {
    email: '',
    password: '',
    passwordVisible: false,
    isLoading: false,
    canSubmit: false,
  },

  onLoad() {},

  /**
   * 邮箱输入
   */
  onEmailInput(e: WechatMiniprogram.Input) {
    const email = e.detail.value;
    this.setData({ email, canSubmit: this.validateForm(email, this.data.password) });
  },

  /**
   * 密码输入（非受控输入下 bindinput 可安全读取实时值，按钮即时高亮）
   */
  onPasswordInput(e: WechatMiniprogram.Input) {
    const password = e.detail.value;
    this.setData({ password, canSubmit: this.validateForm(this.data.email, password) });
  },

  /**
   * 切换密码明文/密文展示
   */
  togglePasswordVisible() {
    this.setData({ passwordVisible: !this.data.passwordVisible });
  },

  /**
   * 验证表单
   */
  validateForm(email: string, password: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && password.length >= 8;
  },

  /**
   * 账号密码登录
   */
  async handleLogin() {
    const { email, password, isLoading, canSubmit } = this.data;
    if (isLoading || !canSubmit) return;

    this.setData({ isLoading: true });

    try {
      const result = await authService.login({ email, password });
      authStore.setLoginInfo(result);

      wx.showToast({ title: '登录成功', icon: 'success' });

      setTimeout(() => {
        if (result.user.is_profile_completed) {
          wx.switchTab({ url: '/pages/home/index' });
        } else {
          wx.redirectTo({ url: '/pages/profile-setup/index' });
        }
      }, 500);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      this.setData({ isLoading: false });
    }
  },

  /**
   * 微信一键登录
   */
  async handleWechatLogin() {
    if (this.data.isLoading) return;
    this.setData({ isLoading: true });

    try {
      // 获取微信 code
      const loginResult = await new Promise<any>((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject,
        });
      });

      if (!loginResult.code) {
        throw new Error('获取微信 code 失败');
      }

      const result = await authService.wechatLogin(loginResult.code) as any;

      // 检查是否需要绑定邮箱
      if (result.needBindEmail) {
        // 需要绑定邮箱：透传服务端下发的 openid（wx code 一次性，绑定页不可重新换取）
        wx.redirectTo({
          url: `/pages/bind-email/index?wx_openid=${encodeURIComponent(result.wx_openid)}`,
        });
      } else {
        // 已绑定邮箱，直接登录
        authStore.setLoginInfo(result);
        if (!result.user.is_profile_completed) {
          wx.redirectTo({ url: '/pages/profile-setup/index' });
        } else {
          wx.switchTab({ url: '/pages/home/index' });
        }
      }
    } catch (error) {
      console.error('Wechat login failed:', error);
      wx.showToast({ title: '微信登录失败', icon: 'none' });
    } finally {
      this.setData({ isLoading: false });
    }
  },

  /**
   * 跳转注册
   */
  goRegister() {
    wx.redirectTo({ url: '/pages/register/index' });
  },

  /**
   * 跳转忘记密码
   */
  goForgotPassword() {
    wx.redirectTo({ url: '/pages/account-confirm/index' });
  },
});
