<script setup lang="ts">
interface Props {
  variant?: 'page' | 'inline' | 'button';
  text?: string;
}

withDefaults(defineProps<Props>(), {
  variant: 'inline',
});
</script>

<template>
  <!-- Page overlay loader -->
  <div
    v-if="variant === 'page'"
    class="fixed inset-0 z-[900] flex flex-col items-center justify-center bg-slate-50 dark:bg-[#020617]"
  >
    <div class="flex flex-col items-center gap-6">
      <!-- Animated Logo -->
      <div class="relative">
        <div class="w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-400 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-primary-500/30 animate-pulse">
          <span class="text-white font-black text-xl">VA</span>
        </div>
        <!-- Spinning ring -->
        <svg class="absolute inset-0 w-full h-full animate-spin" viewBox="0 0 64 64" fill="none">
          <circle
            cx="32" cy="32" r="28"
            stroke="url(#loader-gradient)"
            stroke-width="3"
            stroke-dasharray="60 120"
            stroke-linecap="round"
          />
          <defs>
            <linearGradient id="loader-gradient" x1="0" y1="0" x2="64" y2="64">
              <stop offset="0%" stop-color="#8b5cf6" stop-opacity="1"/>
              <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0"/>
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div class="text-center">
        <p class="text-[10px] font-black uppercase tracking-widest text-primary-500 animate-pulse">
          {{ text || 'Loading...' }}
        </p>
      </div>
    </div>
  </div>

  <!-- Inline spinner -->
  <div v-else-if="variant === 'inline'" class="flex items-center justify-center py-12">
    <div class="flex flex-col items-center gap-3">
      <svg class="animate-spin w-8 h-8 text-primary-500" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      <p v-if="text" class="text-xs text-slate-500 dark:text-slate-400 font-medium">{{ text }}</p>
    </div>
  </div>

  <!-- Button spinner (just the icon) -->
  <svg
    v-else-if="variant === 'button'"
    class="animate-spin w-4 h-4"
    viewBox="0 0 24 24"
    fill="none"
  >
    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
  </svg>
</template>
