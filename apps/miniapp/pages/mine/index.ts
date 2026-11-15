import { authStore } from '../../store/auth';
import * as userService from '../../services/user';
import { getMyCourses } from '../../services/course';
import { requireLogin } from '../../utils/auth-guard';

interface CourseVM {
  id: number;
  title: string;
  cover_url: string | null;
  phText: string;
  tagText: string;
  metaText: string;
}

Page({
  data: {
    userInfo: null as userService.UserProfile | null,
    gradeMajorText: '',
    universityText: '',
    courses: [] as CourseVM[],
    coursesLoading: false,
  },

  onShow() {
    // 「我的」需登录：未登录时提示并自动跳转登录页（onShow 覆盖首次进入与切 tab 返回）
    if (!requireLogin()) return;
    this.loadUserInfo();
    this.loadMyCourses();
  },

  /**
   * 加载用户信息（昵称 / 年级·专业 / 院校）
   */
  async loadUserInfo() {
    try {
      const profile = await userService.getProfile();
      const sp = profile.student_profile;
      this.setData({
        userInfo: profile,
        gradeMajorText: [sp?.grade, sp?.major].filter(Boolean).join(' · '),
        universityText: sp?.university || '',
      });
      authStore.setUserInfo({
        id: profile.id,
        email: profile.email,
        nickname: profile.nickname,
        is_profile_completed: profile.is_profile_completed,
      });
    } catch (error) {
      console.error('Load user info failed:', error);
    }
  },

  /**
   * 加载我的课程（已加入课程列表）
   */
  async loadMyCourses() {
    this.setData({ coursesLoading: true });
    try {
      const list = await getMyCourses();
      const courses: CourseVM[] = list.map((c) => ({
        id: c.id,
        title: c.title,
        cover_url: c.cover_url,
        phText: c.title.slice(0, 10),
        tagText: c.payment_type === 'free' ? '免费' : '已购',
        metaText: `共 ${c.chapter_count} 课时 · 继续学习 ›`,
      }));
      this.setData({ courses });
    } catch (error) {
      console.error('Load my courses failed:', error);
    } finally {
      this.setData({ coursesLoading: false });
    }
  },

  /**
   * 点击头像 → 头像上传页
   */
  onEditAvatar() {
    wx.navigateTo({ url: '/pages/avatar/index' });
  },

  /**
   * 编辑个人信息（复用资料设置页，edit 模式：可改昵称，保存后返回本页）
   */
  onEditProfile() {
    wx.navigateTo({ url: '/pages/profile-setup/index?mode=edit' });
  },

  onCourseTap(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/course-detail/index?id=${id}` });
  },

  onGoHome() {
    wx.switchTab({ url: '/pages/home/index' });
  },

  /**
   * 退出登录
   */
  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          authStore.logout();
          wx.reLaunch({ url: '/pages/login/index' });
        }
      },
    });
  },
});
