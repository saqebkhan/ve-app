<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useThemeStore } from '@/stores/theme';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const theme = useThemeStore();
const auth = useAuthStore();

const showUserMenu = ref(false);

// Breadcrumb from route meta
const breadcrumb = computed(() => {
  return (route.meta?.breadcrumb as string) || 'Dashboard';
});

const closeMenu = () => { showUserMenu.value = false; };
</script>

<template>
  <header class="h-16 flex items-center justify-between px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
    <!-- ── Left: Mobile menu + Breadcrumb ───────────────────────────────── -->
    <div class="flex items-center gap-4">
      <!-- Mobile hamburger -->
      <button
        class="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        @click="theme.toggleSidebar()"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
          <path fill-rule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 012 10z" clip-rule="evenodd"/>
        </svg>
      </button>

      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2">
        <span class="text-slate-400 text-sm">Dashboard</span>
        <svg class="w-3.5 h-3.5 text-slate-300" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd"/>
        </svg>
        <span class="text-sm font-black text-slate-900 dark:text-white tracking-tight">
          {{ breadcrumb }}
        </span>
      </nav>
    </div>

    <!-- ── Right: Dark mode + User menu ─────────────────────────────────── -->
    <div class="flex items-center gap-3">
      <!-- Dark mode toggle -->
      <button
        :class="[
          'relative p-2 rounded-xl border transition-all duration-300',
          'hover:scale-[1.05] active:scale-95',
          theme.isDark
            ? 'bg-slate-800 border-slate-700 text-amber-400'
            : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-700',
        ]"
        @click="theme.toggleDark()"
        :title="theme.isDark ? 'Switch to light mode' : 'Switch to dark mode'"
      >
        <!-- Sun icon -->
        <svg v-if="theme.isDark" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
          <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6zM15.657 5.404a.75.75 0 10-1.06-1.06l-1.061 1.06a.75.75 0 001.06 1.06l1.06-1.06zM6.464 14.596a.75.75 0 10-1.06-1.06l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06zM18 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0118 10zM5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 015 10zM14.596 15.657a.75.75 0 001.06-1.06l-1.06-1.061a.75.75 0 10-1.06 1.06l1.06 1.06zM5.404 6.464a.75.75 0 001.06-1.06l-1.06-1.06a.75.75 0 10-1.061 1.06l1.06 1.06z"/>
        </svg>
        <!-- Moon icon -->
        <svg v-else viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
          <path fill-rule="evenodd" d="M7.455 2.004a.75.75 0 01.26.77 7 7 0 009.958 7.967.75.75 0 011.067.853A8.5 8.5 0 116.647 1.921a.75.75 0 01.808.083z" clip-rule="evenodd"/>
        </svg>
      </button>

      <!-- User menu -->
      <div class="relative" v-click-outside="closeMenu">
        <button
          class="flex items-center gap-2.5 px-3 py-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 group"
          @click="showUserMenu = !showUserMenu"
        >
          <div class="w-7 h-7 bg-gradient-to-br from-primary-600 to-primary-400 rounded-xl flex items-center justify-center shadow">
            <span class="text-white font-black text-xs">{{ auth.userInitials }}</span>
          </div>
          <span class="hidden sm:block text-sm font-semibold text-slate-700 dark:text-slate-300 max-w-[120px] truncate">
            {{ auth.user?.name }}
          </span>
          <svg viewBox="0 0 20 20" fill="currentColor" :class="['w-3.5 h-3.5 text-slate-400 transition-transform duration-200', showUserMenu ? 'rotate-180' : '']">
            <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd"/>
          </svg>
        </button>

        <!-- Dropdown -->
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 scale-95 -translate-y-2"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 -translate-y-2"
        >
          <div
            v-if="showUserMenu"
            class="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-900/10 py-2 z-50"
          >
            <!-- User info -->
            <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <p class="text-sm font-black text-slate-900 dark:text-white truncate">{{ auth.user?.name }}</p>
              <p class="text-xs text-slate-400 truncate">{{ auth.user?.email }}</p>
            </div>

            <div class="p-2">
              <button class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all font-medium text-left">
                <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM10 12a5.99 5.99 0 00-4.793 2.39A6.483 6.483 0 0010 16.5a6.483 6.483 0 004.793-2.11A5.99 5.99 0 0010 12z" clip-rule="evenodd"/></svg>
                Profile
              </button>
              <button class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all font-medium text-left">
                <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path fill-rule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.205 1.251l-1.18 2.044a1 1 0 01-1.186.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.113a7.047 7.047 0 010-2.228L1.821 7.773a1 1 0 01-.205-1.251l1.18-2.044a1 1 0 011.186-.447l1.598.54A6.992 6.992 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/></svg>
                Settings
              </button>

              <div class="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                <button
                  class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-medium text-left"
                  @click="auth.logout(); closeMenu();"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path fill-rule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M6 10a.75.75 0 01.75-.75h9.546l-1.048-.943a.75.75 0 111.004-1.114l2.5 2.25a.75.75 0 010 1.114l-2.5 2.25a.75.75 0 11-1.004-1.114l1.048-.943H6.75A.75.75 0 016 10z" clip-rule="evenodd"/></svg>
                  Log out
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>
