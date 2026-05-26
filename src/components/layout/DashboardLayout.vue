<script setup lang="ts">
import Sidebar from './Sidebar.vue';
import TopBar from './TopBar.vue';
</script>

<template>
  <div class="flex h-screen bg-slate-50 dark:bg-[#020617] overflow-hidden">
    <!-- Sidebar -->
    <Sidebar />

    <!-- Main content area -->
    <div class="flex flex-col flex-1 min-w-0 overflow-hidden">
      <!-- Top bar -->
      <TopBar />

      <!-- Page content -->
      <main class="flex-1 overflow-y-auto">
        <div class="p-6 min-h-full">
          <RouterView v-slot="{ Component, route }">
            <Transition name="route" mode="out-in">
              <component :is="Component" :key="route.path" />
            </Transition>
          </RouterView>
        </div>
      </main>
    </div>
  </div>
</template>
