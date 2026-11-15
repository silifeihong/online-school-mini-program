import { getFeed, FeedItem } from '../../services/course';

type TabValue = 'all' | 'course' | 'material';

interface DisplayItem {
  kind: 'course' | 'material';
  key: string;
  id: number;
  title: string;
  cover_url: string | null;
  phText: string;
  meta: string;
  priceText?: string;
}

function toDisplayItem(item: FeedItem): DisplayItem {
  if (item.kind === 'course') {
    const c = item.data;
    const metaParts = [c.teacher || '名师', `${c.chapter_count} 课时`, c.subtitle].filter(
      Boolean,
    );
    return {
      kind: 'course',
      key: `course-${c.id}`,
      id: c.id,
      title: c.title,
      cover_url: c.cover_url,
      phText: c.title.slice(0, 10),
      meta: metaParts.join(' · '),
      priceText: c.payment_type === 'free' ? '免费' : `¥${Number(c.price)}`,
    };
  }
  const m = item.data;
  // 文件信息汇总：单文件显示其信息，多文件显示个数
  const fileCount = m.files ? m.files.length : 0;
  const filesSummary =
    fileCount === 1 ? m.files![0].file_meta : fileCount > 1 ? `${fileCount} 个文件` : '';
  const metaParts = [filesSummary, m.description].filter(Boolean);
  return {
    kind: 'material',
    key: `material-${m.id}`,
    id: m.id,
    title: m.title,
    cover_url: m.cover_url,
    phText: m.title.slice(0, 10),
    meta: metaParts.join(' · ') || '学习资料',
  };
}

Page({
  data: {
    tabs: [
      { label: '全部', value: 'all' },
      { label: '课程', value: 'course' },
      { label: '资料', value: 'material' },
    ] as Array<{ label: string; value: TabValue }>,
    activeTab: 'all' as TabValue,
    keyword: '',
    items: [] as DisplayItem[],
    page: 1,
    total_pages: 1,
    loading: false,
    finished: false,
  },

  searchTimer: 0 as unknown as number,
  shownOnce: false,

  onLoad() {
    this.loadFeed(true);
  },

  onShow() {
    // 首次 onShow 紧随 onLoad 触发，跳过避免重复请求；
    // 之后回到首页（切 tab / 返回 / 小程序回前台）时刷新，保证后台新上架的课程及时可见
    if (!this.shownOnce) {
      this.shownOnce = true;
      return;
    }
    this.loadFeed(true);
  },

  async loadFeed(reset = false) {
    if (this.data.loading) return;
    const page = reset ? 1 : this.data.page + 1;
    this.setData({ loading: true });
    try {
      const res = await getFeed({
        keyword: this.data.keyword || undefined,
        type: this.data.activeTab,
        page,
        limit: 10,
      });
      const mapped = res.list.map(toDisplayItem);
      this.setData({
        items: reset ? mapped : this.data.items.concat(mapped),
        page: res.pagination.page,
        total_pages: res.pagination.total_pages,
        finished: res.pagination.page >= res.pagination.total_pages,
      });
    } catch {
      // request 工具已 toast 错误信息
    } finally {
      this.setData({ loading: false });
    }
  },

  onTabTap(e: WechatMiniprogram.TouchEvent) {
    const value = e.currentTarget.dataset.value as TabValue;
    if (value === this.data.activeTab) return;
    this.setData({ activeTab: value, items: [], finished: false });
    this.loadFeed(true);
  },

  onSearchInput(e: WechatMiniprogram.Input) {
    const keyword = e.detail.value;
    this.setData({ keyword });
    // 400ms 防抖搜索
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.setData({ items: [], finished: false });
      this.loadFeed(true);
    }, 400) as unknown as number;
  },

  onSearchConfirm() {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.setData({ items: [], finished: false });
    this.loadFeed(true);
  },

  onClearKeyword() {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.setData({ keyword: '', items: [], finished: false });
    this.loadFeed(true);
  },

  onReachBottom() {
    if (!this.data.finished && !this.data.loading) {
      this.loadFeed();
    }
  },

  async onPullDownRefresh() {
    await this.loadFeed(true);
    wx.stopPullDownRefresh();
  },

  onCourseTap(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/course-detail/index?id=${id}` });
  },

  /**
   * 资料卡点击 → 资料详情页（查看文件在详情页内完成）
   */
  onMaterialTap(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/material-detail/index?id=${id}` });
  },
});
