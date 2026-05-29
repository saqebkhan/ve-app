<template>
  <div class="relative w-full" ref="dropdownRef">
    <button
      class="w-full flex items-center justify-between px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      @click="toggleDropdown"
      :aria-expanded="open"
      type="button"
    >
      <span>{{ selectedLabel || placeholder }}</span>
      <svg class="w-4 h-4 ml-2 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    <transition name="fade">
      <ul
        v-if="open"
        class="absolute z-10 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded shadow-lg max-h-60 overflow-auto"
      >
        <li
          v-for="option in options"
          :key="option.value"
          @click="select(option)"
          class="px-4 py-2 cursor-pointer hover:bg-indigo-50 dark:hover:bg-slate-700"
          :class="{ 'bg-indigo-100 dark:bg-slate-700': option.value === modelValue }"
        >
          {{ option.label }}
        </li>
      </ul>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps<{
  modelValue: string | number | null;
  options: { label: string; value: string | number }[];
  placeholder?: string;
}>();
const emit = defineEmits(['update:modelValue']);

const open = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    open.value = false;
  }
};

onMounted(() => {
  window.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside);
});

const selectedLabel = computed(() => {
  const found = props.options.find((o) => o.value === props.modelValue);
  return found ? found.label : '';
});

function toggleDropdown() {
  open.value = !open.value;
}
function select(option: { label: string; value: string | number }) {
  emit('update:modelValue', option.value);
  open.value = false;
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.15s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
