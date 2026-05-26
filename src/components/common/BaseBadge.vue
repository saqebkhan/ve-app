<script setup lang="ts">
interface Props {
  status: 'active' | 'draft' | 'archived' | 'low-stock' | 'out-of-stock' | 'in-stock';
  pulse?: boolean;
}

withDefaults(defineProps<Props>(), {
  pulse: false,
});

const config: Record<Props['status'], { label: string; classes: string; dot: string }> = {
  active:      { label: 'Active',      classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', dot: 'bg-emerald-500' },
  draft:       { label: 'Draft',       classes: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',            dot: 'bg-slate-400' },
  archived:    { label: 'Archived',    classes: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500',            dot: 'bg-slate-300' },
  'low-stock': { label: 'Low Stock',   classes: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',         dot: 'bg-amber-500' },
  'out-of-stock': { label: 'Out of Stock', classes: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',           dot: 'bg-red-500' },
  'in-stock':  { label: 'In Stock',    classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', dot: 'bg-emerald-500' },
};
</script>

<template>
  <span :class="['inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest', config[status].classes]">
    <span
      :class="['w-1.5 h-1.5 rounded-full shrink-0', config[status].dot, pulse ? 'animate-pulse' : '']"
    />
    {{ config[status].label }}
  </span>
</template>
