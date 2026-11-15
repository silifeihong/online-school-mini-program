import * as authService from '../../services/auth';

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).+$/;

Page({
  data: {
    email: '',
    code: '',
    newPassword: '',
    confirmPassword: '',
    countdown: 0,
    isLoading: false,
    canSubmit: false,
  },

  onLoad(options: Record<string, string | undefined>) {
    const email = options.email ? decodeURIComponent(options.email) : '';
    if (!email) {
      // 未携带已确认的邮箱，回到确认账号页
      wx.redirectTo({ url: '/pages/account-confirm/index' });
      return;
    }
    this.setData({ email });
  },

  onUnload() {
    this.clearCountdown();
  },

  /**
   * 验证码输入
   */
  onCodeInput(e: WechatMiniprogram.Input) {
    const code = e.detail.value;
    this.setData({ code, canSubmit: this.validateForm({ code }) });
  },

  /**
   * 新密码（非受控输入下 bindinput 可安全读取实时值，按钮即时高亮）
   */
  onNewPasswordInput(e: WechatMiniprogram.Input) {
    const newPassword = e.detail.value;
    this.setData({ newPassword, canSubmit: this.validateForm({ newPassword }) });
  },

  /**
   * 确认密码
   */
  onConfirmPasswordInput(e: WechatMiniprogram.Input) {
    const confirmPassword = e.detail.value;
    this.setData({ confirmPassword, canSubmit: this.validateForm({ confirmPassword }) });
  },

  /**
   * 表单校验（override 传入本次输入的最新值：setData 尚未生效，this.data 还是旧值）
   */
  validateForm(
    override: Partial<{ code: string; newPassword: string; confirmPassword: string }> = {},
  ): boolean {
    const { code, newPassword, confirmPassword } = { ...this.data, ...override };
    return (
      code.length === 6 &&
      newPassword.length >= 8 &&
      newPassword.length <= 20 &&
      PASSWORD_REGEX.test(newPassword) &&
      confirmPassword === newPassword
    );
  },

  /**
   * 发送重置验证码（走忘记密码专用接口，要求邮箱已注册）
   */
  async handleSendCode() {
    const { email, countdown } = this.data;
    if (countdown > 0) return;

    try {
      await authService.forgotPasswordSendCode(email);
      wx.showToast({ title: '验证码已发送', icon: 'success' });
      this.startCountdown();
    } catch (error) {
      console.error('Send code failed:', error);
    }
  },

  startCountdown() {
    this.clearCountdown();
    this.setData({ countdown: 60 });
    (this as any).countdownTimer = setInterval(() => {
      const countdown = this.data.countdown - 1;
      if (countdown <= 0) {
        this.clearCountdown();
      } else {
        this.setData({ countdown });
      }
    }, 1000);
  },

  clearCountdown() {
    if ((this as any).countdownTimer) {
      clearInterval((this as any).countdownTimer);
      (this as any).countdownTimer = null;
    }
    this.setData({ countdown: 0 });
  },

  /**
   * 提交重置
   */
  async handleSubmit() {
    const { email, code, newPassword, confirmPassword, isLoading } = this.data;
    if (isLoading) return;

    if (code.length !== 6) {
      wx.showToast({ title: '请输入6位验证码', icon: 'none' });
      return;
    }
    if (newPassword.length < 8 || newPassword.length > 20 || !PASSWORD_REGEX.test(newPassword)) {
      wx.showToast({ title: '密码为8-20位，需包含字母和数字', icon: 'none' });
      return;
    }
    if (confirmPassword !== newPassword) {
      wx.showToast({ title: '两次输入的密码不一致', icon: 'none' });
      return;
    }

    this.setData({ isLoading: true });
    try {
      await authService.forgotPasswordReset(email, code, newPassword);
      wx.showToast({ title: '密码重置成功', icon: 'success' });
      setTimeout(() => {
        wx.redirectTo({ url: '/pages/login/index' });
      }, 1000);
    } catch (error) {
      console.error('Reset password failed:', error);
    } finally {
      this.setData({ isLoading: false });
    }
  },

  goBack() {
    wx.redirectTo({ url: '/pages/login/index' });
  },
});
