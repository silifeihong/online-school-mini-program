import { getMaterialDetail, getMaterialDownloadUrl } from '../../services/material';
import { MaterialItem } from '../../services/course';
import { storage } from '../../utils/storage';
import { downloadAndOpen } from '../../utils/open-file';

/** 图片类文件页内直接展示 / previewImage，其余走 downloadFile + openDocument */
const IMAGE_EXTS = ['jpg', 'jpeg', 'png'];

interface FileVM {
  idx: number;
  name: string;
  meta: string;
  ext: string;
  isImage: boolean;
}

/** rich-text 渲染预处理：给 img 注入自适应样式，防止超出屏幕宽度 */
function normalizeRichText(html: string | null | undefined): string {
  if (!html) return '';
  return html
    .replace(
      /<img([^>]*?)style\s*=\s*"([^"]*)"([^>]*)>/gi,
      (_m: string, attrs: string, style: string, rest: string) =>
        `<img${attrs}style="max-width:100%;height:auto;${style}"${rest}>`,
    )
    .replace(/<img(?![^>]*style=)([^>]*)>/gi, '<img style="max-width:100%;height:auto;"$1>');
}

Page({
  data: {
    materialId: 0,
    material: null as MaterialItem | null,
    loaded: false,
    /** 文件列表视图模型 */
    filesVM: [] as FileVM[],
    /** 仅一个图片文件：页内直接展示文件本体 */
    singleImage: false,
    /** 单图预览地址：登录后换成限时签名地址，未登录回落 file_url */
    previewSrc: '',
    /** 文件汇总 · 更新时间 */
    metaLine: '',
    /** 图文内容（富文本 HTML，rich-text 渲染；展示顺序高于文件） */
    contentHtml: '',
  },

  onLoad(options: Record<string, string | undefined>) {
    const materialId = Number(options.id || 0);
    if (!materialId) {
      wx.showToast({ title: '资料不存在', icon: 'none' });
      this.setData({ loaded: true });
      return;
    }
    this.setData({ materialId });
    this.loadDetail();
  },

  async loadDetail() {
    try {
      const material = await getMaterialDetail(this.data.materialId);
      const files = material.files || [];
      const filesVM: FileVM[] = files.map((f, idx) => {
        const name =
          f.file_name ||
          (f.file_url ? f.file_url.split('?')[0].split('/').pop() || '' : '');
        const ext = name.includes('.') ? (name.split('.').pop() || '').toUpperCase() : '';
        return {
          idx,
          name: name || '未命名文件',
          meta: f.file_meta || '',
          ext,
          isImage: IMAGE_EXTS.includes(ext.toLowerCase()),
        };
      });
      const summary =
        filesVM.length === 1
          ? filesVM[0].meta
          : filesVM.length > 1
            ? `${filesVM.length} 个文件`
            : '';
      const metaParts = [summary, this.formatDate(material.updated_at)].filter(Boolean);
      const singleImage = filesVM.length === 1 && filesVM[0].isImage;
      this.setData({
        material,
        filesVM,
        singleImage,
        previewSrc: singleImage ? files[0].file_url : '',
        metaLine: metaParts.join(' · '),
        contentHtml: normalizeRichText(material.content),
      });
      // 从列表进来直接查看资料：单文件自动打开，多文件点列表逐个查看
      if (filesVM.length > 0) {
        this.autoOpen();
      }
    } catch {
      // request 工具已 toast 错误信息（如资料已下架）
    } finally {
      this.setData({ loaded: true });
    }
  },

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} 更新`;
  },

  /**
   * 进入页面直接查看：仅单文件生效。
   * 图片页内直接展示（已登录则换成限时签名地址）；
   * 文档在无图文内容时自动打开系统文档查看器，有图文内容则停留详情页、点文件卡片再打开。
   */
  async autoOpen() {
    if (this.data.filesVM.length !== 1) return;
    if (this.data.singleImage) {
      if (!storage.isLoggedIn()) return; // 未登录保留 file_url 展示
      try {
        const { url } = await getMaterialDownloadUrl(this.data.materialId, 0);
        this.setData({ previewSrc: url });
      } catch {
        // 取签名地址失败时保留 file_url 兜底展示
      }
      return;
    }
    // 有图文内容：优先展示详情页内容，不自动拉起文件查看器
    if (this.data.contentHtml) return;
    if (!(await this.ensureLogin())) return;
    this.openFile(0);
  },

  /** 打开指定文件：取限时地址 → 图片 previewImage / 文档 downloadFile + openDocument */
  async openFile(index: number) {
    const vm = this.data.filesVM[index];
    if (!vm) return;
    let url = '';
    try {
      ({ url } = await getMaterialDownloadUrl(this.data.materialId, index));
    } catch {
      return; // request 工具已 toast
    }
    if (vm.isImage) {
      wx.previewImage({ urls: [url] });
      return;
    }
    try {
      await downloadAndOpen(url);
    } catch {
      wx.showToast({ title: '打开文件失败', icon: 'none' });
    }
  },

  /** 登录校验：未登录弹窗引导去登录，返回是否已登录 */
  async ensureLogin(): Promise<boolean> {
    if (storage.isLoggedIn()) return true;
    const { confirm } = await wx.showModal({
      title: '提示',
      content: '查看资料文件需要先登录',
      confirmText: '去登录',
    });
    if (confirm) {
      wx.navigateTo({ url: '/pages/login/index' });
    }
    return false;
  },

  /** 文件行 / 文档占位点击 → 打开对应文件 */
  async onFileTap(e: WechatMiniprogram.TouchEvent) {
    const index = Number(e.currentTarget.dataset.index || 0);
    if (!(await this.ensureLogin())) return;
    this.openFile(index);
  },

  /** 单图点击 → 全屏预览（页内已直接展示，无需再登录） */
  onPreviewImage() {
    const src = this.data.previewSrc;
    if (src) wx.previewImage({ urls: [src] });
  },
});
