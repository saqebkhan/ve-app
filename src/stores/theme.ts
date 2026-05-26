import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

const STORAGE_KEY_DARK = 've-admin:dark-mode';
const STORAGE_KEY_SIDEBAR = 've-admin:sidebar-collapsed';

export const useThemeStore = defineStore('theme', () => {
  // ─── State ───────────────────────────────────────────────────────────────────
  const isDark = ref<boolean>(
    localStorage.getItem(STORAGE_KEY_DARK) === 'true' ||
    (!localStorage.getItem(STORAGE_KEY_DARK) &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  );

  const isSidebarCollapsed = ref<boolean>(
    localStorage.getItem(STORAGE_KEY_SIDEBAR) === 'true'
  );

  // ─── Apply Theme ──────────────────────────────────────────────────────────────
  const applyTheme = (): void => {
    const html = document.documentElement;
    if (isDark.value) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  };

  // ─── Actions ──────────────────────────────────────────────────────────────────
  const toggleDark = (): void => {
    isDark.value = !isDark.value;
  };

  const toggleSidebar = (): void => {
    isSidebarCollapsed.value = !isSidebarCollapsed.value;
  };

  const setDark = (value: boolean): void => {
    isDark.value = value;
  };

  const setSidebarCollapsed = (value: boolean): void => {
    isSidebarCollapsed.value = value;
  };

  // ─── Watchers (Persist to localStorage) ──────────────────────────────────────
  watch(isDark, (val) => {
    localStorage.setItem(STORAGE_KEY_DARK, String(val));
    applyTheme();
  }, { immediate: true });

  watch(isSidebarCollapsed, (val) => {
    localStorage.setItem(STORAGE_KEY_SIDEBAR, String(val));
  });

  return {
    isDark,
    isSidebarCollapsed,
    applyTheme,
    toggleDark,
    toggleSidebar,
    setDark,
    setSidebarCollapsed,
  };
});
