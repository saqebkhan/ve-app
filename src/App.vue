<script setup lang="ts">
import { RouterView } from 'vue-router';
import BaseToaster from '@/components/common/BaseToaster.vue';
import BaseLoader from '@/components/common/BaseLoader.vue';
import { useAuthStore } from '@/stores/auth';
import { computed } from 'vue';

const authStore = useAuthStore();
const isInitialized = computed(() => authStore.initialized);
</script>

<template>
  <!-- Page-level loader until session is initialized -->
  <BaseLoader v-if="!isInitialized" variant="page" />

  <template v-else>
    <!-- Route transitions -->
    <RouterView v-slot="{ Component, route }">
      <Transition name="route" mode="out-in">
        <component :is="Component" :key="route.path" />
      </Transition>
    </RouterView>
  </template>

  <!-- Global Toast System -->
  <BaseToaster />
</template>
