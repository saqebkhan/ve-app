<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { ROUTE_NAMES } from '@/constants';

const auth = useAuthStore();

const name = ref('');
const email = ref('');
const shopName = ref('');
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const isShaking = ref(false);
const submitted = ref(false);

const error = computed(() => auth.error);
const loading = computed(() => auth.loading);

const triggerShake = () => {
  isShaking.value = true;
  setTimeout(() => { isShaking.value = false; }, 600);
};

const validate = (): string | null => {
  if (!name.value.trim() || name.value.trim().length < 2) return 'Name must be at least 2 characters';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) return 'Please enter a valid email';
  if (password.value.length < 8) return 'Password must be at least 8 characters';
  if (password.value !== confirmPassword.value) return 'Passwords do not match';
  return null;
};

const handleSubmit = async () => {
  auth.clearError();
  const validationError = validate();
  if (validationError) {
    auth.error = validationError;
    triggerShake();
    return;
  }

  const success = await auth.register(name.value, email.value, password.value, shopName.value || undefined);
  if (success) {
    submitted.value = true;
  } else {
    triggerShake();
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#020617] relative overflow-hidden p-4">
    <!-- Gradient orbs -->
    <div class="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
    <div class="absolute bottom-0 left-0 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

    <!-- Success State -->
    <Transition
      enter-active-class="transition-all duration-300"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
    >
      <div
        v-if="submitted"
        class="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl p-10 text-center"
      >
        <div class="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
          <svg viewBox="0 0 24 24" fill="none" class="w-10 h-10 text-emerald-600">
            <path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h2 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Check your email</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          We sent a verification link to <strong class="text-slate-700 dark:text-slate-200">{{ email }}</strong>. Click the link to activate your account.
        </p>
        <RouterLink
          :to="{ name: ROUTE_NAMES.LOGIN }"
          class="inline-flex items-center gap-2 px-6 py-3 rounded-[2rem] text-[10px] font-black uppercase tracking-widest bg-primary-600 text-white shadow-xl shadow-primary-500/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          Back to Sign In
        </RouterLink>
      </div>
    </Transition>

    <!-- Register Form -->
    <div
      v-if="!submitted"
      :class="[
        'relative w-full max-w-md bg-white dark:bg-slate-900',
        'rounded-[2rem] border border-slate-200 dark:border-slate-800',
        'shadow-2xl shadow-slate-900/10 p-8',
        isShaking ? 'animate-shake' : '',
      ]"
    >
      <!-- Logo -->
      <div class="flex items-center gap-3 mb-8">
        <div class="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-400 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/25">
          <span class="text-white font-black text-sm">VA</span>
        </div>
        <div>
          <p class="font-black text-slate-900 dark:text-white tracking-tight text-lg leading-none">ve-admin</p>
          <p class="text-[9px] font-black uppercase tracking-widest text-slate-400">Seller Dashboard</p>
        </div>
      </div>

      <h1 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">Create account</h1>
      <p class="text-sm text-slate-500 dark:text-slate-400 mb-8">Start selling with ve-admin today</p>

      <!-- Error -->
      <Transition enter-active-class="transition-all duration-200" enter-from-class="opacity-0 -translate-y-2" enter-to-class="opacity-100 translate-y-0">
        <div v-if="error" class="flex items-start gap-3 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl mb-6">
          <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 text-red-500 shrink-0 mt-0.5">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd"/>
          </svg>
          <p class="text-sm font-medium text-red-700 dark:text-red-400">{{ error }}</p>
        </div>
      </Transition>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Full Name -->
        <div>
          <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Full Name</label>
          <input v-model="name" type="text" id="reg-name" autocomplete="name" placeholder="Your name"
            class="w-full px-4 py-3 rounded-2xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            @input="auth.clearError()" />
        </div>

        <!-- Email -->
        <div>
          <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Email Address</label>
          <input v-model="email" type="email" id="reg-email" autocomplete="email" placeholder="you@example.com"
            class="w-full px-4 py-3 rounded-2xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            @input="auth.clearError()" />
        </div>

        <!-- Shop Name -->
        <div>
          <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Shop Name <span class="normal-case font-medium text-slate-400">(optional)</span></label>
          <input v-model="shopName" type="text" id="reg-shopname" placeholder="My Awesome Store"
            class="w-full px-4 py-3 rounded-2xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200" />
        </div>

        <!-- Password -->
        <div>
          <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Password</label>
          <div class="relative">
            <input v-model="password" :type="showPassword ? 'text' : 'password'" id="reg-password" autocomplete="new-password" placeholder="Min. 8 characters"
              class="w-full px-4 py-3 pr-12 rounded-2xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              @input="auth.clearError()" />
            <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1" @click="showPassword = !showPassword">
              <svg v-if="!showPassword" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/><path fill-rule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/></svg>
              <svg v-else viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path fill-rule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.091 1.092a4 4 0 00-5.557-5.557z" clip-rule="evenodd"/><path d="M10.748 13.93l2.523 2.523a10.014 10.014 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 6.02L6.07 9.252a4 4 0 004.678 4.678z"/></svg>
            </button>
          </div>
        </div>

        <!-- Confirm Password -->
        <div>
          <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Confirm Password</label>
          <div class="relative">
            <input v-model="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'" id="reg-confirm-password" autocomplete="new-password" placeholder="Re-enter password"
              class="w-full px-4 py-3 pr-12 rounded-2xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              @input="auth.clearError()" />
            <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1" @click="showConfirmPassword = !showConfirmPassword">
              <svg v-if="!showConfirmPassword" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/><path fill-rule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/></svg>
              <svg v-else viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path fill-rule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.091 1.092a4 4 0 00-5.557-5.557z" clip-rule="evenodd"/><path d="M10.748 13.93l2.523 2.523a10.014 10.014 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 6.02L6.07 9.252a4 4 0 004.678 4.678z"/></svg>
            </button>
          </div>
        </div>

        <!-- Submit -->
        <button
          type="submit"
          :disabled="loading"
          class="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary-500/25 hover:scale-[1.02] active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 mt-2"
        >
          <svg v-if="loading" class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          {{ loading ? 'Creating account...' : 'Create Account' }}
        </button>
      </form>

      <p class="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
        Already have an account?
        <RouterLink :to="{ name: ROUTE_NAMES.LOGIN }" class="font-black text-primary-600 hover:text-primary-700 transition-colors">Sign in</RouterLink>
      </p>
    </div>
  </div>
</template>
