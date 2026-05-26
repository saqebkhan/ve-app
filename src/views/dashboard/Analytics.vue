<template>
  <div class="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
    <div class="w-24 h-24 bg-primary-50 dark:bg-primary-900/20 rounded-[2rem] flex items-center justify-center mb-8 shadow-xl shadow-primary-500/10">
      <span class="text-5xl">📈</span>
    </div>
    <h2 class="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Under Construction</h2>
    <p class="text-slate-500 dark:text-slate-400 text-sm font-medium max-w-sm leading-relaxed">This feature is being built with care. Check back soon for a powerful Analytics experience.</p>
    <div class="mt-8 flex gap-2"><div v-for="j in 3" :key="j" class="w-2 h-2 rounded-full bg-primary-400 animate-bounce" :style="{ animationDelay: j * 0.15 + 's' }"></div></div>
  </div>
</template>
