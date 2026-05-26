<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ROUTE_NAMES, API_URLS } from '@/constants';
import api from '@/services/api';

const route = useRoute();
const router = useRouter();

const status = ref<'verifying' | 'success' | 'error'>('verifying');
const message = ref('');
const countdown = ref(3);

onMounted(async () => {
  const token = (route.query.token as string) || '';

  if (!token) {
    status.value = 'error';
    message.value = 'Missing verification token.';
    return;
  }

  try {
    const { data } = await api.get(`${API_URLS.VERIFY_EMAIL}?token=${token}`);
    if (data.success) {
      status.value = 'success';
      message.value = data.message;
      // Countdown and redirect
      const interval = setInterval(() => {
        countdown.value--;
        if (countdown.value <= 0) {
          clearInterval(interval);
          router.push({ name: ROUTE_NAMES.LOGIN });
        }
      }, 1000);
    }
  } catch (err: unknown) {
    status.value = 'error';
    message.value = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Invalid or expired verification link.';
  }
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#020617] relative overflow-hidden p-4">
    <div class="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
    <div class="absolute bottom-0 left-0 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

    <div class="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl p-10 text-center">
      <div class="flex items-center justify-center gap-3 mb-8">
        <div class="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-400 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/25"><span class="text-white font-black text-sm">VA</span></div>
        <p class="font-black text-slate-900 dark:text-white tracking-tight text-lg">ve-admin</p>
      </div>

      <!-- Verifying -->
      <div v-if="status === 'verifying'" class="flex flex-col items-center gap-4">
        <svg class="animate-spin w-12 h-12 text-primary-500" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 animate-pulse">Verifying your email...</p>
      </div>

      <!-- Success -->
      <div v-else-if="status === 'success'" class="flex flex-col items-center gap-4">
        <div class="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/20 rounded-[2rem] flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" class="w-10 h-10 text-emerald-600"><path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <h2 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Email verified!</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{{ message }}</p>
        <p class="text-xs text-slate-400">Redirecting in <strong class="text-primary-600">{{ countdown }}s</strong>...</p>
        <RouterLink :to="{ name: ROUTE_NAMES.LOGIN }" class="px-6 py-2.5 bg-primary-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 hover:scale-[1.02] active:scale-95 transition-all">
          Sign In Now
        </RouterLink>
      </div>

      <!-- Error -->
      <div v-else class="flex flex-col items-center gap-4">
        <div class="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-[2rem] flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" class="w-10 h-10 text-red-600"><path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
        </div>
        <h2 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Verification failed</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{{ message }}</p>
        <RouterLink :to="{ name: ROUTE_NAMES.LOGIN }" class="px-6 py-2.5 bg-primary-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 hover:scale-[1.02] active:scale-95 transition-all">
          Back to Sign In
        </RouterLink>
      </div>
    </div>
  </div>
</template>
