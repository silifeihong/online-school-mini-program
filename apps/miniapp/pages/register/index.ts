import { authStore } from '../../store/auth';
import * as authService from '../../services/auth';

Page({
  data: {
    email: '',
    code: '',
    password: '',
    confirmPassword: '',
    countdown: 0,
    isLoading: false,
    canSubmit: false,
    canSendCode: false,
  },

  countdownTimer: null as any,

  onLoad() {},

  onUnload() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
  },

  /**
   * 邮箱输入
   */
  onEmailInput(e: WechatMiniprogram.Input) {
    const email = e.detail.value;
    const canSendCode = this.validateEmail(email) && this.data.countdown === 0;
    this.setData({ email, canSendCode, canSubmit: this.validateForm({ email }) });
  },

  /**
   * 验证码输入
   */
  onCodeInput(e: WechatMiniprogram.Input) {
    const code = e.detail.value;
    this.setData({ code, canSubmit: this.validateForm({ code }) });
  },

  /**
   * 密码输入
   */
  onPasswordInput(e: WechatMiniprogram.Input) {
    const password = e.detail.value;
    this.setData({ password, canSubmit: this.validateForm({ password }) });
  },

  /**
   * 确认密码输入
   */
  onConfirmPasswordInput(e: WechatMiniprogram.Input) {
    const confirmPassword = e.detail.value;
    this.setData({ confirmPassword, canSubmit: this.validateForm({ confirmPassword }) });
  },

  /**
   * 验证邮箱
   */
  validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  /**
   * 验证表单（override 传入本次输入的最新值：setData 尚未生效，this.data 还是旧值）
   */
  validateForm(
    override: Partial<{ email: string; code: string; password: string; confirmPassword: string }> = {},
  ): boolean {
    const { email, code, password, confirmPassword } = { ...this.data, ...override };
    return (
      this.validateEmail(email) &&
      code.length === 6 &&
      password.length >= 8 &&
      password === confirmPassword
    );
  },

  /**
   * 发送验证码
   */
  async handleSendCode() {
    const { email, countdown } = this.data;
    if (countdown > 0) return;

    try {
      await authService.sendEmailCode(email);
      wx.showToast({ title: '验证码已发送', icon: 'success' });
      this.startCountdown();
    } catch (error) {
      console.error('Send code failed:', error);
    }
  },

  /**
   * 开始倒计时
   */
  startCountdown() {
    this.setData({ countdown: 60, canSendCode: false });

    this.countdownTimer = setInterval(() => {
      const countdown = this.data.countdown - 1;
      if (countdown <= 0) {
        clearInterval(this.countdownTimer);
        this.setData({ countdown: 0, canSendCode: this.validateEmail(this.data.email) });
      } else {
        this.setData({ countdown });
      }
    }, 1000);
  },

  /**
   * 注册
   */
  async handleRegister() {
    const { email, code, password, isLoading, canSubmit } = this.data;
    if (isLoading || !canSubmit) return;

    this.setData({ isLoading: true });

    try {
      // 注册不再自动关联微信：关联需用户后续走微信一键登录 → 绑定邮箱流程
      const result = await authService.register({ email, password, code });
      authStore.setLoginInfo(result);

      wx.showToast({ title: '注册成功', icon: 'success' });

      setTimeout(() => {
        wx.redirectTo({ url: '/pages/profile-setup/index' });
      }, 500);
    } catch (error) {
      console.error('Register failed:', error);
    } finally {
      this.setData({ isLoading: false });
    }
  },

  /**
   * 跳转登录
   */
  goLogin() {
    wx.redirectTo({ url: '/pages/login/index' });
  },
});
