<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { ROUTE_NAMES, API_URLS } from '@/constants';
import { useRouter } from 'vue-router';
import api from '@/services/api';

const auth = useAuthStore();
const router = useRouter();

// States for counts
const activeProductsCount = ref(0);
const teamCount = ref(1);
const loadingStats = ref(false);

const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
});

// Timeframe for Analytics
const selectedTimeframe = ref<'7d' | '30d' | '12m'>('7d');

const timeframeData = {
  '7d': {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    values: [12000, 19000, 15000, 25000, 22000, 30000, 28000],
    revenue: '₹1,51,000',
    orders: 102,
    conversion: '2.4%',
    revenueGrow: '+12.4%',
    ordersGrow: '+8.3%',
    conversionGrow: '+1.2%'
  },
  '30d': {
    labels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'],
    values: [65000, 82000, 75000, 98000],
    revenue: '₹3,20,000',
    orders: 245,
    conversion: '2.8%',
    revenueGrow: '+18.1%',
    ordersGrow: '+11.5%',
    conversionGrow: '+2.1%'
  },
  '12m': {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    values: [180000, 220000, 250000, 210000, 280000, 320000, 350000, 310000, 390000, 420000, 400000, 480000],
    revenue: '₹39,10,000',
    orders: 2840,
    conversion: '3.1%',
    revenueGrow: '+24.5%',
    ordersGrow: '+16.9%',
    conversionGrow: '+4.0%'
  }
};

const currentData = computed(() => timeframeData[selectedTimeframe.value]);

// Generate SVG Line Path
const svgPath = computed(() => {
  const data = currentData.value.values;
  if (!data || data.length === 0) return '';
  const max = Math.max(...data) * 1.15;
  const min = Math.min(...data) * 0.85;
  const range = max - min;
  
  const width = 600;
  const height = 220;
  const stepX = width / (data.length - 1);
  
  const points = data.map((val, i) => {
    const x = i * stepX;
    const y = height - ((val - min) / range) * (height - 30) - 15;
    return { x, y };
  });

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const cpX1 = curr.x + stepX / 2;
    const cpY1 = curr.y;
    const cpX2 = next.x - stepX / 2;
    const cpY2 = next.y;
    path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
  }
  return path;
});

// Generate SVG Closed Area Path
const svgAreaPath = computed(() => {
  const path = svgPath.value;
  if (!path) return '';
  const width = 600;
  const height = 220;
  return `${path} L ${width} ${height} L 0 ${height} Z`;
});

// Fetch active listings and team count
const fetchDashboardStats = async () => {
  loadingStats.value = true;
  try {
    const { data: invData } = await api.get<{ success: boolean; data: { pagination: { total: number } } }>(API_URLS.INVENTORY);
    if (invData.success) {
      activeProductsCount.value = invData.data.pagination.total;
    }
    const { data: teamData } = await api.get<{ success: boolean; data: { members: any[] } }>(API_URLS.TEAM_MEMBERS);
    if (teamData.success) {
      teamCount.value = teamData.data.members.length;
    }
  } catch (err) {
    console.warn('Could not load dashboard stats', err);
  } finally {
    loadingStats.value = false;
  }
};

onMounted(() => {
  fetchDashboardStats();
});
</script>

<template>
  <div class="space-y-6 max-w-6xl mx-auto">
    <!-- Welcome banner -->
    <div class="relative bg-gradient-to-r from-primary-600 to-primary-700 rounded-[2.5rem] p-8 overflow-hidden shadow-xl shadow-primary-500/10">
      <!-- Background decoration -->
      <div class="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div class="absolute bottom-0 right-24 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 pointer-events-none" />

      <div class="relative">
        <p class="text-primary-200 text-sm font-medium mb-1">{{ greeting }},</p>
        <h1 class="text-white text-3xl font-black tracking-tight mb-1">
          {{ auth.user?.name }}
        </h1>
        <p class="text-primary-200 text-sm">Welcome back to the dashboard of <span class="font-bold text-white">{{ auth.user?.shopName || 'your store' }}</span>.</p>

        <div class="flex gap-3 mt-6">
          <button
            class="px-5 py-2.5 bg-white text-primary-700 font-bold hover:bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-black/5"
            @click="router.push({ name: ROUTE_NAMES.INVENTORY })"
          >
            Manage Inventory
          </button>
          <button
            class="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 border border-white/20"
            @click="router.push({ name: ROUTE_NAMES.SETTINGS })"
          >
            Store Settings
          </button>
        </div>
      </div>
    </div>

    <!-- Quick stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-for="(stat, i) in [
        { label: 'Total Revenue', value: currentData.revenue, icon: '💰', sub: currentData.revenueGrow, subColor: 'text-emerald-500', color: 'text-emerald-600' },
        { label: 'Total Orders', value: String(currentData.orders), icon: '🛍️', sub: currentData.ordersGrow, subColor: 'text-emerald-500', color: 'text-primary-600' },
        { label: 'Active Products', value: String(activeProductsCount), icon: '📦', sub: 'Catalog Listings', subColor: 'text-slate-400', color: 'text-slate-900 dark:text-white' },
        { label: 'Team Members', value: String(teamCount), icon: '👥', sub: 'Collaborators', subColor: 'text-slate-400', color: 'text-slate-900 dark:text-white' },
      ]" :key="i" class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 transition-all hover:shadow-md">
        <div class="flex items-start justify-between mb-3">
          <p class="text-[9px] font-black uppercase tracking-widest text-slate-400">{{ stat.label }}</p>
          <span class="text-lg">{{ stat.icon }}</span>
        </div>
        <p :class="['text-2xl font-black tracking-tight', stat.color]">{{ stat.value }}</p>
        <p class="text-xs font-semibold mt-1" :class="stat.subColor">{{ stat.sub }}</p>
      </div>
    </div>

    <!-- Main Analytics Section -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Chart Card -->
      <div class="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-sm flex flex-col justify-between">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 class="text-lg font-black text-slate-900 dark:text-white tracking-tight">Revenue Insights</h2>
            <p class="text-xs text-slate-400 font-medium">Visual analysis of store income patterns</p>
          </div>
          
          <!-- Chart Timeframe Selector -->
          <div class="flex gap-1 p-1 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/50 dark:border-slate-700/30">
            <button v-for="t in ([
              { label: '7 Days', value: '7d' },
              { label: '30 Days', value: '30d' },
              { label: '12 Months', value: '12m' }
            ] as const)" :key="t.value" @click="selectedTimeframe = t.value"
              :class="['px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all', selectedTimeframe === t.value ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-250']">
              {{ t.label }}
            </button>
          </div>
        </div>

        <!-- SVG Line Chart representation -->
        <div class="relative w-full h-[220px] mb-4">
          <svg viewBox="0 0 600 220" class="w-full h-full overflow-visible" preserveAspectRatio="none">
            <!-- Gradients -->
            <defs>
              <linearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="var(--color-primary-500, #8b5cf6)" stop-opacity="0.25" />
                <stop offset="100%" stop-color="var(--color-primary-500, #8b5cf6)" stop-opacity="0.0" />
              </linearGradient>
            </defs>

            <!-- Grid Lines -->
            <line x1="0" y1="50" x2="600" y2="50" stroke="#f1f5f9" class="dark:stroke-slate-800/40" stroke-width="1" stroke-dasharray="4,4" />
            <line x1="0" y1="110" x2="600" y2="110" stroke="#f1f5f9" class="dark:stroke-slate-800/40" stroke-width="1" stroke-dasharray="4,4" />
            <line x1="0" y1="170" x2="600" y2="170" stroke="#f1f5f9" class="dark:stroke-slate-800/40" stroke-width="1" stroke-dasharray="4,4" />

            <!-- Smooth area path -->
            <path :d="svgAreaPath" fill="url(#chartAreaGradient)" />

            <!-- Smooth stroke path -->
            <path :d="svgPath" fill="none" stroke="var(--color-primary-600, #6366f1)" stroke-width="3" stroke-linecap="round" />
            
            <!-- Target dashed comparison line -->
            <path :d="svgPath" fill="none" stroke="var(--color-primary-400, #818cf8)" stroke-width="1" stroke-dasharray="5,5" stroke-opacity="0.5" transform="translate(0, 10)" />
          </svg>
        </div>

        <!-- X Axis Labels -->
        <div class="flex justify-between items-center px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <span v-for="lbl in currentData.labels" :key="lbl">{{ lbl }}</span>
        </div>
      </div>

      <!-- Breakdown Card -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-sm flex flex-col justify-between">
        <div>
          <h2 class="text-lg font-black text-slate-900 dark:text-white tracking-tight mb-1">Store Performance</h2>
          <p class="text-xs text-slate-400 font-medium mb-6">Distribution and conversion dynamics</p>
          
          <!-- Category breakdown progress lines -->
          <div class="space-y-4">
            <h3 class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Category Distribution</h3>
            
            <div v-for="cat in [
              { name: 'Electronics', percentage: 45, color: 'bg-primary-500' },
              { name: 'Clothing', percentage: 30, color: 'bg-emerald-500' },
              { name: 'Home & Garden', percentage: 15, color: 'bg-amber-500' },
              { name: 'Other', percentage: 10, color: 'bg-slate-400' }
            ]" :key="cat.name" class="space-y-1">
              <div class="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>{{ cat.name }}</span>
                <span>{{ cat.percentage }}%</span>
              </div>
              <div class="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-500" :class="cat.color" :style="{ width: `${cat.percentage}%` }" />
              </div>
            </div>
          </div>
        </div>

        <!-- Conversion rates info footer -->
        <div class="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6 flex justify-between items-center">
          <div>
            <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">AOV Conversion</p>
            <p class="text-xl font-black text-slate-900 dark:text-white">{{ currentData.conversion }}</p>
          </div>
          <div class="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-emerald-100/30">
            {{ currentData.conversionGrow }} Grow
          </div>
        </div>
      </div>

    </div>

  </div>
</template>
