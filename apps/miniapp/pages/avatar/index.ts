import { getProfile, uploadAvatar } from '../../services/user';

// 与后端 UPLOAD_KINDS.avatar 限制保持一致
const MAX_SIZE = 5 * 1024 * 1024;

Page({
  data: {
    currentAvatar: '',
    chosenPath: '',
    uploading: false,
  },

  onLoad() {
    this.loadCurrentAvatar();
  },

  /**
   * 读取当前头像作为默认展示
   */
  async loadCurrentAvatar() {
    try {
      const profile = await getProfile();
      this.setData({ currentAvatar: profile.avatar_url || '' });
    } catch (error) {
      console.warn('Load current avatar failed:', error);
    }
  },

  /**
   * 选择图片（相册 / 拍照）
   */
  onChooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const file = res.tempFiles[0];
        if (!file) return;
        if (file.size > MAX_SIZE) {
          wx.showToast({ title: '图片不能超过 5MB', icon: 'none' });
          return;
        }
        this.setData({ chosenPath: file.tempFilePath });
      },
    });
  },

  /**
   * 保存头像：上传成功后返回上一页（「我的」页 onShow 会重新拉取资料）
   */
  async onSave() {
    const { chosenPath, uploading } = this.data;
    if (!chosenPath || uploading) return;

    this.setData({ uploading: true });
    try {
      await uploadAvatar(chosenPath);
      wx.showToast({ title: '头像已更新', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 600);
    } catch (error) {
      // 失败提示已在 uploadFile 内统一 toast
      console.error('Upload avatar failed:', error);
    } finally {
      this.setData({ uploading: false });
    }
  },
});
