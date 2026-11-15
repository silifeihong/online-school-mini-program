import { storage } from './storage';

// 防止 onLoad/onShow 或多页面并发触发导致重复弹窗、重复跳转
let navigating = false;

/**
 * 页面级登录校验（首页列表除外，其他页面进入前调用）：
 * 未登录时 toast 提示并自动跳转登录页。
 * 返回是否已登录，页面据此中止后续数据加载。
 *
 * token 失效场景由 utils/request.ts 统一处理（刷新失败 → 提示 → reLaunch 登录页）。
 */
export function requireLogin(reason = '请先登录'): boolean {
  if (storage.isLoggedIn()) return true;
  if (!navigating) {
    navigating = true;
    wx.showToast({ title: reason, icon: 'none' });
    setTimeout(() => {
      wx.navigateTo({
        url: '/pages/login/index',
        complete: () => {
          navigating = false;
        },
      });
    }, 800);
  }
  return false;
}
