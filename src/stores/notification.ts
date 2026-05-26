import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Notification } from '@/types';

export const useNotificationStore = defineStore('notification', () => {
  // ─── State ───────────────────────────────────────────────────────────────────
  const notifications = ref<Notification[]>([]);

  // ─── Internal Add ─────────────────────────────────────────────────────────────
  const add = (
    type: Notification['type'],
    message: string,
    title?: string,
    duration = 4000
  ): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const notification: Notification = { id, type, message, title, duration, dismissing: false };
    notifications.value.push(notification);

    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }

    return id;
  };

  // ─── Public Actions ───────────────────────────────────────────────────────────
  const success = (message: string, title?: string, duration?: number): string =>
    add('success', message, title, duration);

  const error = (message: string, title?: string, duration?: number): string =>
    add('error', message, title, duration ?? 6000);

  const warning = (message: string, title?: string, duration?: number): string =>
    add('warning', message, title, duration);

  const info = (message: string, title?: string, duration?: number): string =>
    add('info', message, title, duration);

  const dismiss = (id: string): void => {
    const idx = notifications.value.findIndex((n) => n.id === id);
    if (idx === -1) return;
    // Mark as dismissing (triggers exit animation)
    notifications.value[idx].dismissing = true;
    // Remove after animation
    setTimeout(() => {
      notifications.value = notifications.value.filter((n) => n.id !== id);
    }, 300);
  };

  const dismissAll = (): void => {
    notifications.value.forEach((n) => { n.dismissing = true; });
    setTimeout(() => { notifications.value = []; }, 350);
  };

  return {
    notifications,
    success,
    error,
    warning,
    info,
    dismiss,
    dismissAll,
  };
});
