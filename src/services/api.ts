import axios from 'axios';
import { useNotificationStore } from '@/stores/notification';
import { useAuthStore } from '@/stores/auth';
import { API_URLS, ROUTE_NAMES } from '@/constants';
import router from '@/router';

// ─── Axios Instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: '/', // Vite proxies /api → http://localhost:5000
  withCredentials: true, // Send httpOnly cookies automatically
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// ─── Refresh Lock ─────────────────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];

const processQueue = (error: unknown): void => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(undefined);
    }
  });
  failedQueue = [];
};

// ─── Response Interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };
    const notifStore = useNotificationStore();
    const authStore = useAuthStore();

    // ── 401: Try token refresh ───────────────────────────────────────────────
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes(API_URLS.REFRESH) &&
      !originalRequest.url?.includes(API_URLS.LOGIN) &&
      !originalRequest.url?.includes(API_URLS.ME)
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post(API_URLS.REFRESH); // Sets new cookies on backend
        processQueue(null);
        isRefreshing = false;
        return api(originalRequest); // Retry original request
      } catch (refreshError) {
        processQueue(refreshError);
        isRefreshing = false;

        // Refresh failed — force logout
        authStore.user = null;
        await router.push({ name: ROUTE_NAMES.LOGIN });
        notifStore.warning('Your session has expired. Please log in again.');
        return Promise.reject(refreshError);
      }
    }

    // ── Skip error toast for auth endpoints (views handle their own errors) ────
    const silentUrls = [
      API_URLS.LOGIN,
      API_URLS.REGISTER,
      API_URLS.FORGOT_PASSWORD,
      API_URLS.RESET_PASSWORD,
      API_URLS.VERIFY_EMAIL,
      API_URLS.ME,
      API_URLS.REFRESH,
    ];

    const isSilent = silentUrls.some((url) => originalRequest.url?.includes(url));

    if (!isSilent && error.response?.status !== 401) {
      const message =
        error.response?.data?.message ||
        (error.code === 'ECONNABORTED' ? 'Request timed out' : 'Something went wrong');

      notifStore.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;
