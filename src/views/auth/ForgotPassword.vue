<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { ROUTE_NAMES } from '@/constants';

const auth = useAuthStore();
const email = ref('');
const isShaking = ref(false);
const submitted = ref(false);
const loading = computed(() => auth.loading);
const error = computed(() => auth.error);

const triggerShake = () => { isShaking.value = true; setTimeout(() => { isShaking.value = false; }, 600); };

const handleSubmit = async () => {
  auth.clearError();
  if (!email.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    auth.error = 'Please enter a valid email address';
    triggerShake();
    return;
  }
  const success = await auth.forgotPassword(email.value);
  if (success) submitted.value = true;
  else triggerShake();
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#020617] relative overflow-hidden p-4">
    <div class="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
    <div class="absolute bottom-0 left-0 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

    <div :class="['relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl p-8', isShaking ? 'animate-shake' : '']">
      <div class="flex items-center gap-3 mb-8">
        <div class="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-400 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/25"><span class="text-white font-black text-sm">VA</span></div>
        <div><p class="font-black text-slate-900 dark:text-white tracking-tight text-lg leading-none">ve-admin</p><p class="text-[9px] font-black uppercase tracking-widest text-slate-400">Seller Dashboard</p></div>
      </div>

      <Transition enter-active-class="transition-all duration-300" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100" mode="out-in">
        <!-- Success -->
        <div v-if="submitted" class="text-center py-4">
          <div class="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-[1.5rem] flex items-center justify-center mx-auto mb-5">
            <svg viewBox="0 0 24 24" fill="none" class="w-8 h-8 text-primary-600"><path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>
          </div>
          <h2 class="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Check your inbox</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
            If an account with <strong class="text-slate-700 dark:text-slate-200">{{ email }}</strong> exists, you'll receive a password reset link shortly.
          </p>
          <RouterLink :to="{ name: ROUTE_NAMES.LOGIN }" class="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary-600 hover:text-primary-700 transition-colors">
            ← Back to Sign In
          </RouterLink>
        </div>

        <!-- Form -->
        <div v-else>
          <h1 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">Forgot password?</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mb-8">Enter your email and we'll send you a reset link.</p>

          <Transition enter-active-class="transition-all duration-200" enter-from-class="opacity-0 -translate-y-2" enter-to-class="opacity-100 translate-y-0">
            <div v-if="error" class="flex items-start gap-3 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl mb-6">
              <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 text-red-500 shrink-0 mt-0.5"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd"/></svg>
              <p class="text-sm font-medium text-red-700 dark:text-red-400">{{ error }}</p>
            </div>
          </Transition>

          <form @submit.prevent="handleSubmit" class="space-y-5">
            <div>
              <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Email Address</label>
              <input v-model="email" type="email" id="forgot-email" autocomplete="email" placeholder="you@example.com"
                class="w-full px-4 py-3 rounded-2xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                @input="auth.clearError()" />
            </div>
            <button type="submit" :disabled="loading"
              class="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary-500/25 hover:scale-[1.02] active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2">
              <svg v-if="loading" class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              {{ loading ? 'Sending...' : 'Send Reset Link' }}
            </button>
          </form>

          <p class="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
            <RouterLink :to="{ name: ROUTE_NAMES.LOGIN }" class="font-black text-primary-600 hover:text-primary-700 transition-colors">← Back to Sign In</RouterLink>
          </p>
        </div>
      </Transition>
    </div>
  </div>
</template>
