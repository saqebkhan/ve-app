<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

interface Props {
  modelValue: boolean;
  title?: string;
  maxWidth?: string;
  closeable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  maxWidth: 'max-w-lg',
  closeable: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  close: [];
}>();

const close = () => {
  if (props.closeable) {
    emit('update:modelValue', false);
    emit('close');
  }
};

// ESC key to close
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') close();
};

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
  document.body.style.overflow = 'hidden';
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  document.body.style.overflow = '';
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[800] flex items-center justify-center p-4"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          @click="close"
        />

        <!-- Modal Panel -->
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
          appear
        >
          <div
            v-if="modelValue"
            :class="[
              'relative z-10 w-full rounded-[2rem] bg-white dark:bg-slate-900',
              'border border-slate-200 dark:border-slate-800',
              'shadow-2xl shadow-slate-900/20',
              maxWidth,
            ]"
            @click.stop
          >
            <!-- Header Slot -->
            <div
              v-if="$slots.header || title"
              class="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800"
            >
              <slot name="header">
                <h3 class="font-black tracking-tight text-slate-900 dark:text-white text-lg">
                  {{ title }}
                </h3>
              </slot>
              <button
                v-if="closeable"
                class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-xl p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
                @click="close"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
                </svg>
              </button>
            </div>

            <!-- Body Slot -->
            <div class="px-6 py-6">
              <slot />
            </div>

            <!-- Footer Slot -->
            <div
              v-if="$slots.footer"
              class="px-6 pb-6 pt-2 flex justify-end gap-3"
            >
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
