<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';
import { ROUTE_NAMES, API_URLS } from '@/constants';
import api from '@/services/api';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const notification = useNotificationStore();

// States
const token = ref('');
const verifyingToken = ref(true);
const verificationError = ref('');
const shopName = ref('');
const email = ref('');
const invitedRole = ref('');

const name = ref('');
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const isShaking = ref(false);
const success = ref(false);
const submitting = ref(false);
const clientError = ref('');

// Password strength calculation
const passwordStrength = computed(() => {
  const pass = password.value;
  if (!pass) return { score: 0, text: 'Too Short', color: 'bg-slate-200 dark:bg-slate-700' };
  if (pass.length < 8) return { score: 1, text: 'Weak', color: 'bg-red-500' };
  
  let score = 1;
  const hasLetters = /[a-zA-Z]/.test(pass);
  const hasNumbers = /[0-9]/.test(pass);
  const hasSpecial = /[^A-Za-z0-9]/.test(pass);
  
  if (hasLetters && hasNumbers) score = 2;
  if (hasLetters && hasNumbers && hasSpecial && pass.length >= 10) score = 3;
  
  if (score === 2) return { score: 2, text: 'Medium', color: 'bg-amber-500' };
  if (score === 3) return { score: 3, text: 'Strong', color: 'bg-emerald-500' };
  return { score: 1, text: 'Weak', color: 'bg-red-500' };
});

onMounted(async () => {
  token.value = (route.query.token as string) || '';
  if (!token.value) {
    verificationError.value = 'No invitation token was provided. Please check your email link.';
    verifyingToken.value = false;
    return;
  }

  try {
    const { data } = await api.get<{
      success: boolean;
      data: { email: string; role: string; shopName: string };
    }>(`${API_URLS.TEAM_VERIFY_INVITE}?token=${token.value}`);

    if (data.success) {
      email.value = data.data.email;
      invitedRole.value = data.data.role;
      shopName.value = data.data.shopName;
    } else {
      verificationError.value = 'Invalid or expired invitation.';
    }
  } catch (err: any) {
    verificationError.value = err.response?.data?.message || 'Verification of invitation token failed. It may have expired.';
  } finally {
    verifyingToken.value = false;
  }
});

const triggerShake = () => {
  isShaking.value = true;
  setTimeout(() => {
    isShaking.value = false;
  }, 600);
};

const handleSubmit = async () => {
  clientError.value = '';
  if (!name.value.trim()) {
    clientError.value = 'Please enter your name';
    triggerShake();
    return;
  }
  if (!password.value || password.value.length < 8) {
    clientError.value = 'Password must be at least 8 characters';
    triggerShake();
    return;
  }
  if (password.value !== confirmPassword.value) {
    clientError.value = 'Passwords do not match';
    triggerShake();
    return;
  }

  submitting.value = true;
  try {
    const { data } = await api.post<{
      success: boolean;
      data: any;
      message: string;
    }>(API_URLS.TEAM_ONBOARD, {
      token: token.value,
      name: name.value.trim(),
      password: password.value,
    });

    if (data.success) {
      success.value = true;
      authStore.user = data.data;
      authStore.initialized = true;
      notification.success('Onboarding complete!', `Welcome to ${shopName.value || 'the store'} 👋`);
      setTimeout(() => {
        router.push({ name: ROUTE_NAMES.DASHBOARD });
      }, 2500);
    }
  } catch (err: any) {
    clientError.value = err.response?.data?.message || 'Onboarding failed. Please try again.';
    triggerShake();
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#020617] relative overflow-hidden p-4">
    <!-- Visual background accent blobs -->
    <div class="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
    <div class="absolute bottom-0 left-0 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

    <div :class="['relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl p-8 transition-all duration-300', isShaking ? 'animate-shake' : '']">
      
      <!-- Brand Logo -->
      <div class="flex items-center gap-3 mb-8">
        <div class="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-400 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/25">
          <span class="text-white font-black text-sm">VA</span>
        </div>
        <div>
          <p class="font-black text-slate-900 dark:text-white tracking-tight text-lg leading-none">ve-admin</p>
        </div>
      </div>

      <!-- Loading verification state -->
      <div v-if="verifyingToken" class="text-center py-12">
        <div class="w-12 h-12 rounded-full border-4 border-slate-200 border-t-primary-600 animate-spin mx-auto mb-4" />
        <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Verifying your team invitation...</p>
      </div>

      <!-- Verification Error screen -->
      <div v-else-if="verificationError" class="text-center py-6">
        <div class="w-16 h-16 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-[1.5rem] flex items-center justify-center mx-auto mb-5">
          <svg viewBox="0 0 24 24" fill="none" class="w-8 h-8 text-red-500" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h2 class="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Invitation Expired or Invalid</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">{{ verificationError }}</p>
        <router-link :to="{ name: ROUTE_NAMES.LOGIN }" 
          class="inline-flex items-center justify-center px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all">
          Back to Login
        </router-link>
      </div>

      <!-- Onboard Form -->
      <div v-else>
        <Transition enter-active-class="transition-all duration-300" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100" mode="out-in">
          
          <!-- Success State -->
          <div v-if="success" class="text-center py-6">
            <div class="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/20 rounded-[1.5rem] flex items-center justify-center mx-auto mb-5">
              <svg viewBox="0 0 24 24" fill="none" class="w-8 h-8 text-emerald-600">
                <path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h2 class="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Registration Successful!</h2>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">Joining {{ shopName }} dashboard...</p>
            <div class="flex justify-center gap-1.5">
              <div v-for="i in 3" :key="i" class="w-2 h-2 rounded-full bg-primary-400 animate-bounce" :style="{ animationDelay: `${i * 0.15}s` }" />
            </div>
          </div>

          <!-- Onboarding Form State -->
          <div v-else>
            <h1 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">Join the Team</h1>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              You have been invited to join <span class="font-bold text-primary-600 dark:text-primary-400">{{ shopName }}</span> as an <span class="capitalize font-bold text-slate-700 dark:text-slate-300">{{ invitedRole }}</span>. Create your account credentials below.
            </p>

            <Transition enter-active-class="transition-all duration-200" enter-from-class="opacity-0 -translate-y-2" enter-to-class="opacity-100 translate-y-0">
              <div v-if="clientError" class="flex items-start gap-3 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl mb-5">
                <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 text-red-500 shrink-0 mt-0.5">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd"/>
                </svg>
                <p class="text-sm font-medium text-red-700 dark:text-red-400">{{ clientError }}</p>
              </div>
            </Transition>

            <form @submit.prevent="handleSubmit" class="space-y-4">
              <!-- Read-only Email -->
              <div>
                <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">Email Address</label>
                <input :value="email" type="email" disabled
                  class="w-full px-4 py-3 rounded-2xl text-sm font-medium bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed" />
              </div>

              <!-- Name Input -->
              <div>
                <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">Your Full Name</label>
                <input v-model="name" type="text" placeholder="Enter your full name" required
                  class="w-full px-4 py-3 rounded-2xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
              </div>

              <!-- Password Input -->
              <div>
                <div class="flex justify-between items-center mb-1.5">
                  <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Password</label>
                  <span class="text-[9px] font-bold uppercase tracking-wider" :class="passwordStrength.score === 1 ? 'text-red-500' : passwordStrength.score === 2 ? 'text-amber-500' : 'text-emerald-500'">
                    {{ passwordStrength.text }}
                  </span>
                </div>
                <div class="relative">
                  <input v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="Min. 8 characters" required
                    class="w-full px-4 py-3 pr-12 rounded-2xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
                  <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1" @click="showPassword = !showPassword">
                    <svg v-if="!showPassword" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                      <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/>
                      <path fill-rule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
                    </svg>
                    <svg v-else viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                      <path fill-rule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.091 1.092a4 4 0 00-5.557-5.557z" clip-rule="evenodd"/>
                      <path d="M10.748 13.93l2.523 2.523a10.014 10.014 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 6.02L6.07 9.252a4 4 0 004.678 4.678z"/>
                    </svg>
                  </button>
                </div>
                <!-- Strength bar indicator -->
                <div class="mt-2 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex gap-1">
                  <div class="h-full rounded-full transition-all duration-300" :class="passwordStrength.color" :style="{ width: passwordStrength.score === 0 ? '0%' : passwordStrength.score === 1 ? '33%' : passwordStrength.score === 2 ? '66%' : '100%' }" />
                </div>
              </div>

              <!-- Confirm Password Input -->
              <div>
                <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">Confirm Password</label>
                <div class="relative">
                  <input v-model="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'" placeholder="Re-enter password" required
                    class="w-full px-4 py-3 pr-12 rounded-2xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
                  <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1" @click="showConfirmPassword = !showConfirmPassword">
                    <svg v-if="!showConfirmPassword" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                      <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/>
                      <path fill-rule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
                    </svg>
                    <svg v-else viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                      <path fill-rule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.091 1.092a4 4 0 00-5.557-5.557z" clip-rule="evenodd"/>
                      <path d="M10.748 13.93l2.523 2.523a10.014 10.014 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 6.02L6.07 9.252a4 4 0 004.678 4.678z"/>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Submit button -->
              <button type="submit" :disabled="submitting"
                class="w-full mt-6 py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary-500/25 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2">
                <svg v-if="submitting" class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {{ submitting ? 'Joining Store...' : 'Complete Onboarding' }}
              </button>
            </form>
          </div>
        </Transition>
      </div>

    </div>
  </div>
</template>
