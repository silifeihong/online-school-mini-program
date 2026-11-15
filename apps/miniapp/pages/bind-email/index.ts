import * as authService from '../../services/auth';
import { authStore } from '../../store/auth';

Page({
  data: {
    wxOpenid: '',
    email: '',
    code: '',
    password: '',
    /** create=邮箱未注册，需设置密码新建账号；link=邮箱已注册未绑微信，验证后直接关联 */
    mode: '' as '' | 'create' | 'link',
    countdown: 0,
    isLoading: false,
    canSubmit: false,
    canSendCode: false,
  },

  onLoad(options: Record<string, string | undefined>) {
    const wxOpenid = options.wx_openid ? decodeURIComponent(options.wx_openid) : '';
    if (!wxOpenid) {
      wx.showToast({ title: '登录状态已失效，请重新微信登录', icon: 'none' });
      setTimeout(() => {
        wx.redirectTo({ url: '/pages/login/index' });
      }, 1200);
      return;
    }
    this.setData({ wxOpenid });
  },

  onEmailInput(e: WechatMiniprogram.Input) {
    const email = e.detail.value;
    const canSendCode = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && this.data.countdown === 0;
    // 邮箱变化后之前的判定失效，重置模式
    this.setData({ email, canSendCode, mode: '' });
  },

  onCodeInput(e: WechatMiniprogram.Input) {
    const code = e.detail.value;
    this.setData({ code });
  },

  onPasswordInput(e: WechatMiniprogram.Input) {
    const password = e.detail.value;
    this.setData({ password });
  },

  /**
   * 验证表单（关联模式无需密码）
   */
  validateForm(override: Partial<{ code: string; password: string; mode: string }> = {}): boolean {
    const { code, password, mode } = { ...this.data, ...override };
    if (code.length !== 6) return false;
    return mode === 'link' || password.length >= 8;
  },

  /**
   * 获取验证码：先由后端判定邮箱状态
   * 已注册且已关联微信 → 后端报错「该邮箱已关联微信」；
   * 已注册未关联 → link 模式（隐藏密码框）；未注册 → create 模式（展示设置密码）
   */
  async handleSendCode() {
    const { email, countdown } = this.data;
    if (countdown > 0) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      wx.showToast({ title: '请输入正确的邮箱', icon: 'none' });
      return;
    }

    try {
      const result = await authService.sendWechatBindCode(email);
      this.setData({ mode: result.registered ? 'link' : 'create' });
      wx.showToast({ title: '验证码已发送', icon: 'success' });
      this.startCountdown();
    } catch (error) {
      console.error('Send bind code failed:', error);
    }
  },

  startCountdown() {
    this.setData({ countdown: 60, canSendCode: false });
    const timer = setInterval(() => {
      const countdown = this.data.countdown - 1;
      if (countdown <= 0) {
        clearInterval(timer);
        this.setData({ countdown: 0, canSendCode: this.validateEmailOnly() });
      } else {
        this.setData({ countdown });
      }
    }, 1000);
  },

  validateEmailOnly(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.data.email);
  },

  async handleBind() {
    const { wxOpenid, email, code, password, mode, isLoading } = this.data;
    if (isLoading) return;

    if (!wxOpenid) {
      wx.showToast({ title: '登录状态已失效，请重新微信登录', icon: 'none' });
      setTimeout(() => {
        wx.redirectTo({ url: '/pages/login/index' });
      }, 1200);
      return;
    }
    if (!mode) {
      wx.showToast({ title: '请先获取验证码', icon: 'none' });
      return;
    }
    if (!this.validateForm()) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }
    if (mode === 'create' && !/^(?=.*[A-Za-z])(?=.*\d).{8,20}$/.test(password)) {
      wx.showToast({ title: '密码需8-20位且包含字母和数字', icon: 'none' });
      return;
    }

    this.setData({ isLoading: true });
    try {
      const result = await authService.wechatBindEmail({
        wx_openid: wxOpenid,
        email,
        code,
        password: mode === 'create' ? password : undefined,
      });
      authStore.setLoginInfo(result);

      wx.showToast({ title: '绑定成功', icon: 'success' });
      setTimeout(() => {
        if (result.user.is_profile_completed) {
          wx.switchTab({ url: '/pages/home/index' });
        } else {
          wx.redirectTo({ url: '/pages/profile-setup/index' });
        }
      }, 500);
    } catch (error) {
      console.error('Bind email failed:', error);
    } finally {
      this.setData({ isLoading: false });
    }
  },
});
