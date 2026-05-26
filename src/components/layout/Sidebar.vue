<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useThemeStore } from '@/stores/theme';
import { useAuthStore } from '@/stores/auth';
import { NAV_LINKS } from '@/constants';

const route = useRoute();
const router = useRouter();
const theme = useThemeStore();
const auth = useAuthStore();

const collapsed = computed(() => theme.isSidebarCollapsed);

const isActive = (name: string) => route.name === name;

const navigate = (name: string) => {
  router.push({ name });
};

const handleLogout = async () => {
  await auth.logout();
};
</script>

<template>
  <!-- Sidebar -->
  <aside
    :class="[
      'relative flex flex-col h-full bg-white dark:bg-slate-900',
      'border-r border-slate-200 dark:border-slate-800',
      'transition-all duration-500 ease-in-out shrink-0',
      collapsed ? 'w-20' : 'w-72',
    ]"
  >
    <!-- ── Brand ──────────────────────────────────────────────────────────── -->
    <div
      :class="[
        'flex items-center gap-3 p-4 border-b border-slate-100 dark:border-slate-800',
        collapsed ? 'justify-center' : 'px-5',
      ]"
    >
      <!-- Logo mark -->
      <div class="w-9 h-9 rounded-2xl flex items-center justify-center shadow shadow-slate-200/50 dark:shadow-none shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img v-if="auth.user?.shopLogo" :src="auth.user.shopLogo" alt="Store Logo" class="w-full h-full object-cover" />
        <div v-else class="w-full h-full bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center">
          <span class="text-white font-black text-sm">VA</span>
        </div>
      </div>

      <Transition
        enter-active-class="transition-all duration-300"
        enter-from-class="opacity-0 -translate-x-2"
        enter-to-class="opacity-100 translate-x-0"
        leave-active-class="transition-all duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="!collapsed" class="overflow-hidden flex-1">
          <p class="font-black text-slate-900 dark:text-white tracking-tight text-sm leading-none truncate max-w-[170px]" :title="auth.user?.shopName || 've-admin'">
            {{ auth.user?.shopName || 've-admin' }}
          </p>
          <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">
            Seller Dashboard
          </p>
        </div>
      </Transition>
    </div>

    <!-- ── Collapse Toggle ────────────────────────────────────────────────── -->
    <button
      :class="[
        'absolute -right-3 top-[4.5rem] z-10',
        'w-6 h-6 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700',
        'flex items-center justify-center shadow-sm',
        'hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300',
        'transition-all duration-200 group',
      ]"
      @click="theme.toggleSidebar()"
    >
      <svg
        :class="['w-3.5 h-3.5 text-slate-500 group-hover:text-primary-600 transition-all duration-300', collapsed ? 'rotate-180' : '']"
        viewBox="0 0 20 20" fill="currentColor"
      >
        <path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd"/>
      </svg>
    </button>

    <!-- ── Nav Section Label ───────────────────────────────────────────────── -->
    <div v-if="!collapsed" class="px-5 pt-5 pb-1">
      <p class="text-[9px] font-black uppercase tracking-widest italic text-slate-400">
        Main Menu
      </p>
    </div>

    <!-- ── Nav Links ──────────────────────────────────────────────────────── -->
    <nav class="flex-1 overflow-y-auto px-3 py-2 space-y-1">
      <div v-for="link in NAV_LINKS" :key="link.name" class="relative group">
        <button
          :class="[
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-300 text-left',
            isActive(link.name)
              ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white',
            collapsed ? 'justify-center' : '',
          ]"
          @click="navigate(link.name)"
        >
          <!-- Active left accent bar -->
          <div
            v-if="isActive(link.name) && !collapsed"
            class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white/40 rounded-r-full"
          />

          <!-- Icon -->
          <span class="text-base shrink-0">{{ link.icon }}</span>

          <!-- Label -->
          <Transition
            enter-active-class="transition-all duration-200"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition-all duration-100"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
          >
            <span v-if="!collapsed" class="flex-1 text-sm font-semibold">
              {{ link.label }}
            </span>
          </Transition>

          <!-- Under Construction Badge -->
          <Transition enter-active-class="transition-opacity duration-200" enter-from-class="opacity-0" enter-to-class="opacity-100">
            <span
              v-if="!link.implemented && !collapsed && !isActive(link.name)"
              class="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 animate-pulse"
            />
          </Transition>
        </button>

        <!-- Collapsed tooltip -->
        <div
          v-if="collapsed"
          class="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50
                 bg-slate-900 dark:bg-slate-700 text-white text-xs font-semibold
                 px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap
                 opacity-0 pointer-events-none group-hover:opacity-100
                 transition-opacity duration-200"
        >
          {{ link.label }}
          <span v-if="!link.implemented" class="ml-1.5 text-[9px] text-amber-400 font-black uppercase">Soon</span>
        </div>
      </div>
    </nav>

    <!-- ── User Section ───────────────────────────────────────────────────── -->
    <div class="border-t border-slate-100 dark:border-slate-800 p-3">
      <div
        :class="[
          'flex items-center gap-3 px-2 py-2 rounded-2xl',
          collapsed ? 'justify-center' : '',
        ]"
      >
        <!-- Avatar -->
        <div
          class="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-400 rounded-2xl flex items-center justify-center shadow-md shrink-0"
        >
          <span class="text-white font-black text-xs">{{ auth.userInitials }}</span>
        </div>

        <!-- Name/Email -->
        <Transition
          enter-active-class="transition-all duration-200"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition-all duration-100"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div v-if="!collapsed" class="flex-1 overflow-hidden">
            <p class="text-sm font-black text-slate-900 dark:text-white truncate tracking-tight">
              {{ auth.user?.name }}
            </p>
            <p class="text-[10px] text-slate-400 truncate">{{ auth.user?.email }}</p>
          </div>
        </Transition>

        <!-- Logout -->
        <button
          v-if="!collapsed"
          class="shrink-0 text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20"
          title="Logout"
          @click="handleLogout"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
            <path fill-rule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clip-rule="evenodd"/>
            <path fill-rule="evenodd" d="M6 10a.75.75 0 01.75-.75h9.546l-1.048-.943a.75.75 0 111.004-1.114l2.5 2.25a.75.75 0 010 1.114l-2.5 2.25a.75.75 0 11-1.004-1.114l1.048-.943H6.75A.75.75 0 016 10z" clip-rule="evenodd"/>
          </svg>
        </button>
      </div>

      <!-- Collapsed logout -->
      <button
        v-if="collapsed"
        class="w-full mt-1 flex justify-center p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        title="Logout"
        @click="handleLogout"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
          <path fill-rule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clip-rule="evenodd"/>
          <path fill-rule="evenodd" d="M6 10a.75.75 0 01.75-.75h9.546l-1.048-.943a.75.75 0 111.004-1.114l2.5 2.25a.75.75 0 010 1.114l-2.5 2.25a.75.75 0 11-1.004-1.114l1.048-.943H6.75A.75.75 0 016 10z" clip-rule="evenodd"/>
        </svg>
      </button>
    </div>
  </aside>
</template>
