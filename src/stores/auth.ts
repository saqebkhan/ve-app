import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { User } from "@/types";
import { useNotificationStore } from "./notification";
import { useThemeStore } from "./theme";
import api from "@/services/api";
import { API_URLS, ROUTE_NAMES } from "@/constants";
import router from "@/router";

export const useAuthStore = defineStore("auth", () => {
  // ─── State ───────────────────────────────────────────────────────────────────
  const user = ref<User | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const initialized = ref(false);

  // ─── Getters ─────────────────────────────────────────────────────────────────
  const isAuthenticated = computed(() => !!user.value);
  const isEmailVerified = computed(() => !!user.value?.isEmailVerified);
  const userInitials = computed(() => {
    if (!user.value?.name) return "?";
    return user.value.name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  });

  // ─── Actions ──────────────────────────────────────────────────────────────────
  const setError = (msg: string | null) => {
    error.value = msg;
  };

  const clearError = () => {
    error.value = null;
  };

  // Allow views to set error directly (for client-side validation)
  const setClientError = (msg: string) => {
    error.value = msg;
  };

  // Mark as initialized without calling API
  const markInitialized = (): void => {
    initialized.value = true;
  };

  // Initialize — try to restore session from cookie
  const initialize = async (): Promise<void> => {
    if (initialized.value) return;
    try {
      const { data } = await api.get<{ success: boolean; data: User }>(
        API_URLS.ME
      );
      if (data.success) user.value = data.data;
    } catch {
      // Not authenticated — silently fail
      user.value = null;
    } finally {
      initialized.value = true;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    loading.value = true;
    clearError();
    try {
      const { data } = await api.post<{
        success: boolean;
        data: User;
        message: string;
      }>(API_URLS.LOGIN, { email, password });
      user.value = data.data;
      useNotificationStore().success(
        "Welcome back!",
        `Hello, ${data.data.name} 👋`
      );
      return true;
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Login failed";
      setError(msg);
      useNotificationStore().error(msg);
      return false;
    } finally {
      loading.value = false;
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    shopName?: string
  ): Promise<boolean> => {
    loading.value = true;
    clearError();
    try {
      await api.post(API_URLS.REGISTER, { name, email, password, shopName });
      return true;
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Registration failed";
      setError(msg);
      return false;
    } finally {
      loading.value = false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await api.post(API_URLS.LOGOUT);
    } catch {
      // Still clear state even if API call fails
    } finally {
      user.value = null;
      initialized.value = true;
      // Reset sidebar collapse on logout
      useThemeStore().isSidebarCollapsed = false;
      await router.push({ name: ROUTE_NAMES.LOGIN });
      useNotificationStore().info("You have been logged out.");
    }
  };

  const fetchMe = async (): Promise<void> => {
    try {
      const { data } = await api.get<{ success: boolean; data: User }>(
        API_URLS.ME
      );
      if (data.success) user.value = data.data;
    } catch {
      user.value = null;
    }
  };

  const forgotPassword = async (email: string): Promise<boolean> => {
    loading.value = true;
    clearError();
    try {
      await api.post(API_URLS.FORGOT_PASSWORD, { email });
      return true;
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Request failed";
      setError(msg);
      return false;
    } finally {
      loading.value = false;
    }
  };

  const resetPassword = async (
    token: string,
    password: string,
    confirmPassword: string
  ): Promise<boolean> => {
    loading.value = true;
    clearError();
    try {
      await api.post(`${API_URLS.RESET_PASSWORD}?token=${token}`, {
        password,
        confirmPassword,
      });
      return true;
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Reset failed";
      setError(msg);
      return false;
    } finally {
      loading.value = false;
    }
  };

  return {
    // State
    user,
    loading,
    error,
    initialized,
    // Getters
    isAuthenticated,
    isEmailVerified,
    userInitials,
    // Actions
    initialize,
    markInitialized,
    login,
    register,
    logout,
    fetchMe,
    forgotPassword,
    resetPassword,
    clearError,
    setClientError,
  };
});
