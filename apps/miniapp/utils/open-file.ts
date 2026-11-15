/**
 * 下载并用系统文档查看器打开文件（资料/文档课件共用）
 */
export function downloadAndOpen(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    wx.showLoading({ title: '加载中...', mask: true });
    wx.downloadFile({
      url,
      success: (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`下载失败 (${res.statusCode})`));
          return;
        }
        const ext = (url.split('?')[0].split('.').pop() || '').toLowerCase();
        const supported = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
        wx.openDocument({
          filePath: res.tempFilePath,
          fileType: (supported.includes(ext) ? ext : undefined) as any,
          showMenu: true,
          success: () => resolve(),
          fail: (err) => reject(err),
        });
      },
      fail: (err) => reject(err),
      complete: () => wx.hideLoading(),
    });
  });
}
