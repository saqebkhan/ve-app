<script setup lang="ts">
import BaseModal from './BaseModal.vue';

interface Props {
  modelValue: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'default';
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  title: 'Are you sure?',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  type: 'default',
  loading: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  confirm: [];
  cancel: [];
}>();

const confirmBtnClass = {
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20',
  warning: 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20',
  default: 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/20',
};

const cancel = () => {
  emit('update:modelValue', false);
  emit('cancel');
};

const confirm = () => {
  emit('confirm');
};
</script>

<template>
  <BaseModal :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" :title="title" max-width="max-w-md">
    <div class="flex flex-col items-center text-center gap-4">
      <!-- Icon -->
      <div
        :class="[
          'w-14 h-14 rounded-2xl flex items-center justify-center',
          type === 'danger' ? 'bg-red-100 dark:bg-red-900/20' :
          type === 'warning' ? 'bg-amber-100 dark:bg-amber-900/20' :
          'bg-primary-100 dark:bg-primary-900/20',
        ]"
      >
        <svg v-if="type === 'danger'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-7 h-7 text-red-600">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
        </svg>
        <svg v-else-if="type === 'warning'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-7 h-7 text-amber-600">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374l7.303-12.748c.866-1.5 3.032-1.5 3.898 0l7.303 12.748zM12 15.75h.007v.008H12v-.008z"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-7 h-7 text-primary-600">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"/>
        </svg>
      </div>

      <p v-if="message" class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        {{ message }}
      </p>

      <slot />
    </div>

    <template #footer>
      <button
        class="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
        @click="cancel"
        :disabled="loading"
      >
        {{ cancelText }}
      </button>
      <button
        :class="[
          'px-5 py-2.5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95',
          confirmBtnClass[type],
          loading ? 'opacity-60 cursor-not-allowed' : '',
        ]"
        @click="confirm"
        :disabled="loading"
      >
        <span v-if="loading" class="flex items-center gap-2">
          <svg class="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Processing...
        </span>
        <span v-else>{{ confirmText }}</span>
      </button>
    </template>
  </BaseModal>
</template>
