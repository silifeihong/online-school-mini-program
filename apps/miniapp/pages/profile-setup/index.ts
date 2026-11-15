import { authStore } from '../../store/auth';
import * as userService from '../../services/user';
import * as profileOptionService from '../../services/profile-option';

Page({
  data: {
    // 选项列表（来源于管理后台维护的枚举值）
    gradeOptions: [] as string[],
    majorOptions: [] as string[],
    universityOptions: [] as string[],
    optionsLoading: true,
    optionsError: false,

    // 选中状态
    gradeIndex: -1,
    majorIndex: -1,
    universityIndex: -1,
    grade: '',
    major: '',
    university: '',
    nickname: '',

    isLoading: false,
    canSubmit: false,

    // edit 模式：从「我的-编辑个人信息」进入，可改昵称、隐藏跳过、保存后返回上页
    editMode: false,
  },

  onLoad(options?: Record<string, string | undefined>) {
    if (options?.mode === 'edit') {
      this.setData({ editMode: true });
      wx.setNavigationBarTitle({ title: '编辑个人信息' });
    }
    this.loadOptions();
  },

  /**
   * 加载已启用选项
   */
  async loadOptions() {
    this.setData({ optionsLoading: true, optionsError: false });
    try {
      const grouped = await profileOptionService.getEnabledOptions();
      this.setData({
        gradeOptions: (grouped.grade || []).map((o) => o.name),
        majorOptions: (grouped.major || []).map((o) => o.name),
        universityOptions: (grouped.university || []).map((o) => o.name),
        optionsLoading: false,
      });
      // 选项就绪后回填已有资料
      this.prefillFromProfile();
    } catch (error) {
      console.error('Load profile options failed:', error);
      this.setData({ optionsLoading: false, optionsError: true });
    }
  },

  /**
   * 回填已保存的个人资料（如之前跳过填写后又回来）
   * 注意：即使保存值已不在当前启用选项中（后台调整过选项列表），也要回填展示，
   * 否则用户看到的是空字段；picker 索引仅在命中选项时设置
   */
  async prefillFromProfile() {
    try {
      const profile = await userService.getProfile();
      const sp = profile.student_profile;
      const data: Record<string, any> = {};

      // 昵称来自用户表，无学员资料时也要回填
      if (profile.nickname) data.nickname = profile.nickname;

      if (sp) {
        if (sp.grade) {
          data.grade = sp.grade;
          const gradeIndex = this.data.gradeOptions.indexOf(sp.grade);
          if (gradeIndex >= 0) data.gradeIndex = gradeIndex;
        }
        if (sp.major) {
          data.major = sp.major;
          const majorIndex = this.data.majorOptions.indexOf(sp.major);
          if (majorIndex >= 0) data.majorIndex = majorIndex;
        }
        if (sp.university) {
          data.university = sp.university;
          const universityIndex = this.data.universityOptions.indexOf(sp.university);
          if (universityIndex >= 0) data.universityIndex = universityIndex;
        }
      }

      if (Object.keys(data).length > 0) {
        data.canSubmit = this.validateFormWith(data);
        this.setData(data);
      }
    } catch (error) {
      // 回填失败不阻塞填写流程
      console.warn('Prefill profile failed:', error);
    }
  },

  /**
   * 昵称输入
   */
  onNicknameInput(e: WechatMiniprogram.Input) {
    const nickname = e.detail.value;
    this.setData({ nickname, canSubmit: this.validateFormWith({ nickname }) });
  },

  /**
   * 年级选择
   */
  onGradeChange(e: any) {
    const index = Number(e.detail.value);
    const grade = this.data.gradeOptions[index] || '';
    this.setData({ gradeIndex: index, grade, canSubmit: this.validateFormWith({ grade }) });
  },

  /**
   * 专业选择
   */
  onMajorChange(e: any) {
    const index = Number(e.detail.value);
    const major = this.data.majorOptions[index] || '';
    this.setData({ majorIndex: index, major, canSubmit: this.validateFormWith({ major }) });
  },

  /**
   * 院校选择
   */
  onUniversityChange(e: any) {
    const index = Number(e.detail.value);
    const university = this.data.universityOptions[index] || '';
    this.setData({
      universityIndex: index,
      university,
      canSubmit: this.validateFormWith({ university }),
    });
  },

  /**
   * 验证表单
   */
  validateForm(): boolean {
    const { nickname, grade, major, university } = this.data;
    return (
      nickname.trim().length > 0 && grade.length > 0 && major.length > 0 && university.length > 0
    );
  },

  /**
   * 用待生效数据验证表单（回填/输入时使用）
   */
  validateFormWith(patch: Record<string, any>): boolean {
    const nickname = patch.nickname ?? this.data.nickname;
    const grade = patch.grade ?? this.data.grade;
    const major = patch.major ?? this.data.major;
    const university = patch.university ?? this.data.university;
    return (
      String(nickname).trim().length > 0 &&
      grade.length > 0 &&
      major.length > 0 &&
      university.length > 0
    );
  },

  /**
   * 提交个人信息（含昵称）
   */
  async handleSubmit() {
    const { grade, major, university, isLoading, canSubmit, editMode } = this.data;
    if (isLoading || !canSubmit) return;

    const nickname = this.data.nickname.trim();
    this.setData({ isLoading: true });

    try {
      await userService.updateProfile({ nickname, grade, major, university });

      // 更新本地状态
      const userInfo = authStore.userInfo;
      if (userInfo) {
        authStore.setUserInfo({ ...userInfo, nickname, is_profile_completed: true });
      }

      wx.showToast({ title: '保存成功', icon: 'success' });

      setTimeout(() => {
        if (editMode) {
          // 编辑模式：返回「我的」，onShow 会重新拉取最新资料
          wx.navigateBack();
        } else {
          wx.switchTab({ url: '/pages/home/index' });
        }
      }, 500);
    } catch (error) {
      console.error('Update profile failed:', error);
    } finally {
      this.setData({ isLoading: false });
    }
  },

  /**
   * 跳过
   */
  handleSkip() {
    wx.switchTab({ url: '/pages/home/index' });
  },
});
