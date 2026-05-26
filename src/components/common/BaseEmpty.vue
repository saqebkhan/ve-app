<script setup lang="ts">
interface Props {
  icon?: string;
  title?: string;
  description?: string;
  actionText?: string;
}

defineProps<Props>();
const emit = defineEmits<{ action: [] }>();
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div class="w-20 h-20 bg-primary-50 dark:bg-primary-900/20 rounded-[2rem] flex items-center justify-center mb-6 shadow-xl shadow-primary-500/10">
      <span class="text-4xl">{{ icon || '📦' }}</span>
    </div>
    <h3 class="font-black text-slate-900 dark:text-white tracking-tight text-xl mb-2">
      {{ title || 'Nothing here yet' }}
    </h3>
    <p class="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-sm leading-relaxed">
      {{ description || 'Get started by adding your first item.' }}
    </p>
    <button
      v-if="actionText"
      class="mt-6 px-6 py-2.5 bg-primary-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 hover:scale-[1.02] active:scale-95 transition-all"
      @click="emit('action')"
    >
      {{ actionText }}
    </button>
  </div>
</template>
