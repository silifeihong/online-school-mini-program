import { storage } from './storage';
import { BASE_URL } from '../config';

interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: Record<string, any>;
  header?: Record<string, string>;
  showLoading?: boolean;
  showError?: boolean;
  /** 内部标记：已经过 token 刷新重试，避免鉴权失败时无限循环 */
  retried?: boolean;
}

interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

// 请求队列，用于并发控制
let isRefreshing = false;
let requestQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];
let isRedirectingToLogin = false;

// 鉴权失败错误码：10002 未授权（受保护接口 token 缺失/失效）、11003/11004 refresh token 过期/无效
// 注意：登录失败是 11002 INVALID_CREDENTIALS，不在此列，不会误触发跳转
const AUTH_ERROR_CODES = [10002, 11003, 11004];

/**
 * 登录态失效统一处理：toast 提示后自动 reLaunch 到登录页（防重复触发）
 */
function redirectToLogin(message: string) {
  if (isRedirectingToLogin) return;
  isRedirectingToLogin = true;
  storage.clearAuth();
  wx.showToast({ title: message, icon: 'none' });
  setTimeout(() => {
    wx.reLaunch({
      url: '/pages/login/index',
      complete: () => {
        isRedirectingToLogin = false;
      },
    });
  }, 800);
}

/**
 * 刷新 Token
 */
async function refreshToken(): Promise<string> {
  const refreshToken = storage.getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token');
  }

  const response = await new Promise<ApiResponse>((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}/auth/refresh-token`,
      method: 'POST',
      data: { refresh_token: refreshToken },
      success: (res) => resolve(res.data as ApiResponse),
      fail: reject,
    });
  });

  if (response.code !== 0) {
    throw new Error(response.message);
  }

  const { access_token, refresh_token } = response.data;
  storage.setAccessToken(access_token);
  storage.setRefreshToken(refresh_token);

  return access_token;
}

/**
 * 处理 Token 过期
 */
async function handleTokenExpired(): Promise<string> {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      requestQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;

  try {
    const newToken = await refreshToken();

    // 处理队列中的请求
    requestQueue.forEach((cb) => cb.resolve(newToken));
    requestQueue = [];

    return newToken;
  } catch (error) {
    // Token 刷新失败（或无 refresh token）：清除登录状态，提示后自动跳转登录页；
    // 同时 reject 队列中等待的请求，避免它们永久悬挂
    requestQueue.forEach((cb) => cb.reject(error));
    requestQueue = [];
    redirectToLogin('登录已失效，请重新登录');
    throw error;
  } finally {
    isRefreshing = false;
  }
}

/**
 * 通用请求方法
 */
export function request<T = any>(options: RequestOptions): Promise<T> {
  const {
    url,
    method = 'GET',
    data,
    header = {},
    showLoading = false,
    showError = true,
  } = options;

  // wx.request 会把 GET data 中 undefined/null 序列化成字符串 "undefined"/"null" 拼进 query，
  // 后端会收到 keyword=undefined 之类的脏参数并当作真实筛选条件，这里统一剔除空值
  let cleanData = data;
  if (method === 'GET' && data && typeof data === 'object' && !Array.isArray(data)) {
    const cleaned: Record<string, unknown> = {};
    Object.keys(data as Record<string, unknown>).forEach((key) => {
      const v = (data as Record<string, unknown>)[key];
      if (v !== undefined && v !== null && v !== '') {
        cleaned[key] = v;
      }
    });
    cleanData = cleaned;
  }

  return new Promise((resolve, reject) => {
    if (showLoading) {
      wx.showLoading({ title: '加载中...', mask: true });
    }

    const token = storage.getAccessToken();
    if (token) {
      header['Authorization'] = `Bearer ${token}`;
    }

    wx.request({
      url: `${BASE_URL}${url}`,
      method,
      data: cleanData,
      header: {
        'Content-Type': 'application/json',
        ...header,
      },
      success: async (res) => {
        const response = res.data as ApiResponse<T>;

        // 鉴权失败（token 过期/无效/未授权）：先静默刷新重试，失败则提示并跳转登录页
        if (AUTH_ERROR_CODES.includes(response.code)) {
          if (options.retried) {
            // 刷新后重试仍失败，不再循环
            redirectToLogin('登录已失效，请重新登录');
            reject(new Error(response.message));
            return;
          }
          try {
            const newToken = await handleTokenExpired();
            // 重试原请求
            header['Authorization'] = `Bearer ${newToken}`;
            const retryResponse = await request<T>({ ...options, header, retried: true });
            resolve(retryResponse);
          } catch (error) {
            reject(error);
          }
          return;
        }

        // 业务错误
        if (response.code !== 0) {
          if (showError) {
            wx.showToast({
              title: response.message || '请求失败',
              icon: 'none',
            });
          }
          reject(new Error(response.message));
          return;
        }

        resolve(response.data);
      },
      fail: (err) => {
        if (showError) {
          wx.showToast({
            title: '网络请求失败',
            icon: 'none',
          });
        }
        reject(err);
      },
      complete: () => {
        if (showLoading) {
          wx.hideLoading();
        }
      },
    });
  });
}

/**
 * 文件上传（wx.uploadFile multipart）：自动携带 token，
 * 鉴权失败时静默刷新重试一次，仍失败则提示并跳转登录页
 */
export function uploadFile<T = any>(options: {
  url: string;
  filePath: string;
  name?: string;
  formData?: Record<string, string>;
}): Promise<T> {
  const { url, filePath, name = 'file', formData } = options;

  const doUpload = (token: string | null, retried: boolean): Promise<T> =>
    new Promise((resolve, reject) => {
      wx.uploadFile({
        url: `${BASE_URL}${url}`,
        filePath,
        name,
        formData,
        header: token ? { Authorization: `Bearer ${token}` } : {},
        success: async (res) => {
          let response: ApiResponse<T>;
          try {
            response = JSON.parse(res.data) as ApiResponse<T>;
          } catch {
            wx.showToast({ title: '上传失败', icon: 'none' });
            reject(new Error('上传响应解析失败'));
            return;
          }
          // 鉴权失败：刷新重试一次
          if (AUTH_ERROR_CODES.includes(response.code)) {
            if (retried) {
              redirectToLogin('登录已失效，请重新登录');
              reject(new Error(response.message));
              return;
            }
            try {
              const newToken = await handleTokenExpired();
              resolve(await doUpload(newToken, true));
            } catch (error) {
              reject(error);
            }
            return;
          }
          if (response.code !== 0) {
            wx.showToast({ title: response.message || '上传失败', icon: 'none' });
            reject(new Error(response.message));
            return;
          }
          resolve(response.data);
        },
        fail: () => {
          wx.showToast({ title: '上传失败，请检查网络', icon: 'none' });
          reject(new Error('uploadFile fail'));
        },
      });
    });

  return doUpload(storage.getAccessToken(), false);
}

// 便捷方法
export const http = {
  get: <T = any>(url: string, data?: Record<string, any>) =>
    request<T>({ url, method: 'GET', data }),

  post: <T = any>(url: string, data?: Record<string, any>) =>
    request<T>({ url, method: 'POST', data }),

  put: <T = any>(url: string, data?: Record<string, any>) =>
    request<T>({ url, method: 'PUT', data }),

  delete: <T = any>(url: string, data?: Record<string, any>) =>
    request<T>({ url, method: 'DELETE', data }),
};
