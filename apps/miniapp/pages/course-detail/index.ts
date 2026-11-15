import { getCourseDetail, getPlayUrl, CourseDetail, CourseChapter } from '../../services/course';
import { storage } from '../../utils/storage';
import { downloadAndOpen } from '../../utils/open-file';
import { requireLogin } from '../../utils/auth-guard';

interface ChapterVM {
  id: number;
  index: string;
  title: string;
  content_type: 'video' | 'document';
  state: 'trial' | 'unlocked' | 'locked';
}

Page({
  data: {
    courseId: 0,
    course: null as CourseDetail | null,
    chapters: [] as ChapterVM[],
    metaText: '',
    priceText: '',
    // 底部动作栏三态：buy=付费未购 / learn=已购或免费 / off=不可用
    actionMode: 'buy' as 'buy' | 'learn',
    actionText: '',
    showPurchase: false,
    salesWechat: '',
    loaded: false,
  },

  onLoad(options: Record<string, string | undefined>) {
    const courseId = Number(options.id || 0);
    if (!courseId) {
      wx.showToast({ title: '课程不存在', icon: 'none' });
      return;
    }
    this.setData({ courseId });
    // 详情页需登录：未登录时提示并自动跳转登录页
    if (!requireLogin()) return;
    this.loadDetail();
  },

  async loadDetail() {
    try {
      const course = await getCourseDetail(this.data.courseId);
      this.applyDetail(course);
    } catch (err: any) {
      // 16001/16002：课程不存在或已下架，提示后返回
      wx.showModal({
        title: '提示',
        content: err?.message || '课程不存在或已下架',
        showCancel: false,
        success: () => wx.navigateBack(),
      });
    }
  },

  applyDetail(course: CourseDetail) {
    const chapters: ChapterVM[] = course.chapters.map((ch, i) => ({
      id: ch.id,
      index: String(i + 1).padStart(2, '0'),
      title: ch.title,
      content_type: ch.content_type,
      state: ch.state,
    }));
    const metaParts = [course.teacher || '名师', `${course.chapter_count} 课时`].filter(Boolean);
    const isFree = course.payment_type === 'free';
    const priceText = isFree ? '免费' : `¥${Number(course.price)}`;

    let actionText: string;
    if (course.enrolled) {
      actionText = '开始学习';
    } else if (isFree) {
      actionText = '免费 · 开始学习';
    } else {
      actionText = '立即购买';
    }

    this.setData({
      course,
      chapters,
      metaText: metaParts.join(' · '),
      priceText,
      actionMode: course.enrolled || isFree ? 'learn' : 'buy',
      actionText,
      salesWechat: course.sales_wechat || '',
      loaded: true,
    });
  },

  /**
   * 底部主按钮
   */
  onActionTap() {
    if (this.data.actionMode === 'learn') {
      const first = this.data.chapters.find((c) => c.state !== 'locked') || this.data.chapters[0];
      if (first) {
        this.openChapter(first);
      }
      return;
    }
    // 付费未购 → 微信名片弹窗
    if (!this.data.salesWechat) {
      wx.showToast({ title: '销售微信号尚未配置，请联系管理员', icon: 'none' });
      return;
    }
    this.setData({ showPurchase: true });
  },

  /**
   * 目录章节点击
   */
  onChapterTap(e: WechatMiniprogram.TouchEvent) {
    const chapterId = Number(e.currentTarget.dataset.id);
    const chapter = this.data.chapters.find((c) => c.id === chapterId);
    if (!chapter) return;

    if (chapter.state === 'locked') {
      if (!storage.isLoggedIn()) {
        wx.showModal({
          title: '提示',
          content: '登录后即可购买并学习本课程',
          confirmText: '去登录',
          success: ({ confirm }) => {
            if (confirm) wx.navigateTo({ url: '/pages/login/index' });
          },
        });
      } else {
        this.onActionTap();
      }
      return;
    }
    this.openChapter(chapter);
  },

  /**
   * 打开章节：视频进播放页；文档直接取地址下载打开
   */
  async openChapter(chapter: ChapterVM) {
    if (chapter.content_type === 'document') {
      try {
        const { url } = await getPlayUrl(this.data.courseId, chapter.id);
        await downloadAndOpen(url);
      } catch {
        wx.showToast({ title: '打开文档失败', icon: 'none' });
      }
      return;
    }
    wx.navigateTo({
      url: `/pages/course-player/index?courseId=${this.data.courseId}&chapterId=${chapter.id}`,
    });
  },

  onCopyWechat() {
    wx.setClipboardData({
      data: this.data.salesWechat,
      success: () => wx.showToast({ title: '微信号已复制', icon: 'success' }),
    });
  },

  onClosePurchase() {
    this.setData({ showPurchase: false });
  },

  noop() {
    // 阻止弹窗内容区点击冒泡到遮罩
  },
});
