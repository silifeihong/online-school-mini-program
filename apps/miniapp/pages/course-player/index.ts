import { getCourseDetail, getPlayUrl, CourseDetail } from '../../services/course';
import { storage } from '../../utils/storage';
import { downloadAndOpen } from '../../utils/open-file';
import { requireLogin } from '../../utils/auth-guard';

interface ChapterVM {
  id: number;
  index: string;
  title: string;
  description: string | null;
  content_type: 'video' | 'document';
  state: 'trial' | 'unlocked' | 'locked';
}

Page({
  data: {
    courseId: 0,
    course: null as CourseDetail | null,
    chapters: [] as ChapterVM[],
    current: null as (ChapterVM & { stateText: string }) | null,
    videoSrc: '',
    loaded: false,
  },

  onLoad(options: Record<string, string | undefined>) {
    const courseId = Number(options.courseId || 0);
    const chapterId = Number(options.chapterId || 0);
    if (!courseId) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      return;
    }
    this.setData({ courseId });
    // 播放页需登录：未登录时提示并自动跳转登录页
    if (!requireLogin()) return;
    this.init(courseId, chapterId);
  },

  async init(courseId: number, chapterId: number) {
    try {
      const course = await getCourseDetail(courseId);
      const chapters: ChapterVM[] = course.chapters.map((ch, i) => ({
        id: ch.id,
        index: String(i + 1).padStart(2, '0'),
        title: ch.title,
        description: ch.description ?? null,
        content_type: ch.content_type,
        state: ch.state,
      }));
      this.setData({ course, chapters, loaded: true });

      const target =
        chapters.find((c) => c.id === chapterId) ||
        chapters.find((c) => c.state !== 'locked') ||
        chapters[0];
      if (target) {
        this.playChapter(target);
      }
    } catch (err: any) {
      wx.showModal({
        title: '提示',
        content: err?.message || '课程不存在或已下架',
        showCancel: false,
        success: () => wx.navigateBack(),
      });
    }
  },

  /**
   * 播放/打开章节：先经 play-url 鉴权签发地址
   */
  async playChapter(chapter: ChapterVM) {
    const stateText =
      chapter.state === 'trial' ? '试看' : chapter.state === 'unlocked' ? '已解锁' : '未解锁';
    this.setData({ current: { ...chapter, stateText }, videoSrc: '' });

    try {
      const { url } = await getPlayUrl(this.data.courseId, chapter.id);
      if (chapter.content_type === 'document') {
        await downloadAndOpen(url);
      } else {
        this.setData({ videoSrc: url });
      }
    } catch (err: any) {
      wx.showToast({ title: err?.message || '无法播放该章节', icon: 'none' });
    }
  },

  onChapterTap(e: WechatMiniprogram.TouchEvent) {
    const chapterId = Number(e.currentTarget.dataset.id);
    const chapter = this.data.chapters.find((c) => c.id === chapterId);
    if (!chapter || this.data.current?.id === chapterId) return;

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
        wx.showModal({
          title: '提示',
          content: '购买后即可学习全部章节',
          confirmText: '去购买',
          success: ({ confirm }) => {
            if (confirm) wx.navigateBack();
          },
        });
      }
      return;
    }
    this.playChapter(chapter);
  },
});
