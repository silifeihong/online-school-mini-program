import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/stores/auth';
import router from '@/router';

// 创建 axios 实例
const service: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    if (authStore.accessToken) {
      config.headers.Authorization = `Bearer ${authStore.accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const { code, message, data } = response.data;

    // 业务成功
    if (code === 0) {
      return data;
    }

    // Token 过期
    if (code === 10201 || code === 10202) {
      const authStore = useAuthStore();
      authStore.logout();
      router.push({ name: 'Login' });
      ElMessage.error('登录已过期，请重新登录');
      return Promise.reject(new Error(message));
    }

    // 业务错误
    ElMessage.error(message || '请求失败');
    return Promise.reject(new Error(message));
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 401) {
        const authStore = useAuthStore();
        authStore.logout();
        router.push({ name: 'Login' });
        ElMessage.error('登录已过期，请重新登录');
      } else if (status === 403) {
        ElMessage.error('没有权限执行此操作');
      } else if (status === 404) {
        ElMessage.error('请求的资源不存在');
      } else if (status === 500) {
        ElMessage.error('服务器错误');
      } else {
        ElMessage.error(data?.message || '请求失败');
      }
    } else {
      ElMessage.error('网络连接失败');
    }

    return Promise.reject(error);
  }
);

// 封装请求方法
const request = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    service.get(url, config) as Promise<T>,

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    service.post(url, data, config) as Promise<T>,

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    service.put(url, data, config) as Promise<T>,

  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    service.delete(url, config) as Promise<T>,
};

export default request;
