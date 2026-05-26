<script setup lang="ts">
import { useNotificationStore } from '@/stores/notification';
import type { Notification } from '@/types';

const notif = useNotificationStore();

const iconMap: Record<Notification['type'], string> = {
  success: `<svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd"/></svg>`,
  error:   `<svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd"/></svg>`,
  warning: `<svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/></svg>`,
  info:    `<svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd"/></svg>`,
};

const colorMap: Record<Notification['type'], string> = {
  success: 'border-emerald-500 bg-white dark:bg-slate-900',
  error:   'border-red-500 bg-white dark:bg-slate-900',
  warning: 'border-amber-500 bg-white dark:bg-slate-900',
  info:    'border-primary-500 bg-white dark:bg-slate-900',
};

const iconColorMap: Record<Notification['type'], string> = {
  success: 'text-emerald-500',
  error:   'text-red-500',
  warning: 'text-amber-500',
  info:    'text-primary-500',
};
</script>

<template>
  <!-- Toast Container -->
  <div
    class="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 items-end"
    aria-live="polite"
    aria-label="Notifications"
  >
    <TransitionGroup
      enter-active-class="transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)]"
      enter-from-class="translate-x-full opacity-0"
      enter-to-class="translate-x-0 opacity-100"
      leave-active-class="transition-all duration-250 ease-in"
      leave-from-class="translate-x-0 opacity-100"
      leave-to-class="translate-x-full opacity-0"
      move-class="transition-all duration-300"
    >
      <div
        v-for="toast in notif.notifications"
        :key="toast.id"
        :class="[
          'relative flex items-start gap-3 min-w-[300px] max-w-[400px] p-4',
          'rounded-2xl shadow-xl border-l-4 cursor-pointer',
          colorMap[toast.type],
        ]"
        @click="notif.dismiss(toast.id)"
      >
        <!-- Icon -->
        <div :class="['mt-0.5 shrink-0', iconColorMap[toast.type]]" v-html="iconMap[toast.type]" />

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <p
            v-if="toast.title"
            class="text-[11px] font-black uppercase tracking-widest mb-0.5"
            :class="iconColorMap[toast.type]"
          >
            {{ toast.title }}
          </p>
          <p class="text-sm font-medium text-slate-700 dark:text-slate-200 leading-snug">
            {{ toast.message }}
          </p>
        </div>

        <!-- Dismiss Button -->
        <button
          class="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors mt-0.5"
          @click.stop="notif.dismiss(toast.id)"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" class="w-3.5 h-3.5">
            <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"/>
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
