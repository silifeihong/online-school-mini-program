import * as authService from '../../services/auth';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Page({
  data: {
    email: '',
    canNext: false,
    isLoading: false,
  },

  onLoad() {},

  /**
   * 邮箱输入（非受控，仅更新状态不回写 value，避免微信输入截断 bug）
   */
  onEmailInput(e: WechatMiniprogram.Input) {
    const email = (e.detail.value || '').trim();
    this.setData({ email, canNext: EMAIL_REGEX.test(email) });
  },

  onEmailBlur(e: WechatMiniprogram.Input) {
    const email = (e.detail.value || '').trim();
    this.setData({ email, canNext: EMAIL_REGEX.test(email) });
  },

  /**
   * 下一步：校验邮箱格式 → 查询是否已注册 → 分流
   */
  async handleNext() {
    const { email, canNext, isLoading } = this.data;
    if (isLoading) return;

    if (!canNext) {
      wx.showToast({ title: '请输入正确的邮箱格式', icon: 'none' });
      return;
    }

    this.setData({ isLoading: true });
    try {
      const result = await authService.checkEmail(email);
      if (result.registered) {
        // 已注册 → 忘记密码页
        wx.redirectTo({
          url: `/pages/forgot-password/index?email=${encodeURIComponent(email)}`,
        });
      } else {
        // 未注册 → 提示后跳转注册页
        wx.showToast({ title: '账号尚未注册', icon: 'none', duration: 1200 });
        setTimeout(() => {
          wx.redirectTo({ url: '/pages/register/index' });
        }, 1200);
      }
    } catch (error) {
      console.error('Check email failed:', error);
    } finally {
      this.setData({ isLoading: false });
    }
  },

  goBack() {
    wx.redirectTo({ url: '/pages/login/index' });
  },
});
