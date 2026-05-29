<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useInventory } from '@/composables/useInventory';
import BaseBadge from '@/components/common/BaseBadge.vue';
import BaseEmpty from '@/components/common/BaseEmpty.vue';
import BaseLoader from '@/components/common/BaseLoader.vue';
import BaseConfirm from '@/components/common/BaseConfirm.vue';
import { PRODUCT_CATEGORIES, CURRENCY_SYMBOL } from '@/constants';
import type { Product, ProductForm } from '@/types';

const {
  products, pagination, stats, loading, saving, deleting, query,
  isEmpty, fetchProducts, createProduct, updateProduct, deleteProduct, goToPage, setSearch, setFilter,
} = useInventory();

// ─── Drawer State ─────────────────────────────────────────────────────────────
const drawerOpen = ref(false);
const drawerMode = ref<'add' | 'edit' | 'view'>('add');
const editingProduct = ref<Product | null>(null);
const activeTab = ref<'basic' | 'pricing' | 'stock' | 'shipping' | 'tags'>('basic');

// ─── Confirm Delete ────────────────────────────────────────────────────────────
const confirmDelete = ref(false);
const deletingId = ref<string | null>(null);

// ─── Search debounce ──────────────────────────────────────────────────────────
const searchInput = ref('');
let searchTimer: ReturnType<typeof setTimeout>;
watch(searchInput, (val) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => setSearch(val), 400);
});

// ─── Form ─────────────────────────────────────────────────────────────────────
const defaultForm = (): ProductForm => ({
  name: '', sku: '', description: '', category: '', brand: '',
  status: 'draft',
  purchasePrice: '', sellingPrice: '', discountedPrice: '',
  hasDiscountedPrice: false,
  stock: 0, lowStockThreshold: 10, trackInventory: true,
  hasVariants: false, variants: [],
  weight: '', dimensions: { l: 0, w: 0, h: 0 },
  tags: [], images: [],
});

const form = ref<ProductForm>(defaultForm());
const formErrors = ref<Record<string, string>>({});
const tagInput = ref('');
const isFormShaking = ref(false);

const sizeInputText = ref('');
const colorInputText = ref('');

// Computed to sum up variant stocks dynamically in the form
const computedFormStock = computed(() => {
  if (form.value.hasVariants && form.value.variants && form.value.variants.length > 0) {
    return form.value.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
  }
  return Number(form.value.stock) || 0;
});

// Watch variants and update form.stock
watch(
  () => form.value.variants,
  () => {
    if (form.value.hasVariants) {
      form.value.stock = computedFormStock.value;
    }
  },
  { deep: true }
);

watch(
  () => form.value.hasVariants,
  (hasVariants) => {
    if (hasVariants) {
      form.value.stock = computedFormStock.value;
    }
  }
);

// Helper to get true product stock (sum of variants if hasVariants)
const getProductStock = (product: Product): number => {
  if (product.hasVariants && product.variants && product.variants.length > 0) {
    return product.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
  }
  return Number(product.stock) || 0;
};

// Generate variants combinations based on size and color inputs
const generateCombinations = () => {
  const sizes = sizeInputText.value.split(',').map(s => s.trim()).filter(Boolean);
  const colors = colorInputText.value.split(',').map(c => c.trim()).filter(Boolean);

  if (sizes.length === 0 && colors.length === 0) return;

  const newVariants: typeof form.value.variants = [];
  const baseSku = form.value.sku ? form.value.sku : 'SKU';

  if (sizes.length > 0 && colors.length > 0) {
    sizes.forEach(s => {
      colors.forEach(c => {
        const combinedSku = `${baseSku}-${s}-${c}`.toUpperCase().replace(/\s+/g, '');
        const existing = form.value.variants.find(v => v.size === s && v.color === c);
        newVariants.push({
          size: s,
          color: c,
          stock: existing ? existing.stock : 0,
          sku: existing && existing.sku ? existing.sku : combinedSku,
          purchasePrice: existing ? existing.purchasePrice : undefined,
          sellingPrice: existing ? existing.sellingPrice : undefined,
        });
      });
    });
  } else if (sizes.length > 0) {
    sizes.forEach(s => {
      const combinedSku = `${baseSku}-${s}`.toUpperCase().replace(/\s+/g, '');
      const existing = form.value.variants.find(v => v.size === s && !v.color);
      newVariants.push({
        size: s,
        color: '',
        stock: existing ? existing.stock : 0,
        sku: existing && existing.sku ? existing.sku : combinedSku,
        purchasePrice: existing ? existing.purchasePrice : undefined,
        sellingPrice: existing ? existing.sellingPrice : undefined,
      });
    });
  } else if (colors.length > 0) {
    colors.forEach(c => {
      const combinedSku = `${baseSku}-${c}`.toUpperCase().replace(/\s+/g, '');
      const existing = form.value.variants.find(v => !v.size && v.color === c);
      newVariants.push({
        size: '',
        color: c,
        stock: existing ? existing.stock : 0,
        sku: existing && existing.sku ? existing.sku : combinedSku,
        purchasePrice: existing ? existing.purchasePrice : undefined,
        sellingPrice: existing ? existing.sellingPrice : undefined,
      });
    });
  }

  form.value.variants = newVariants;
};

// ─── Live profit margin ───────────────────────────────────────────────────────
const profitMargin = computed(() => {
  const buy = Number(form.value.purchasePrice);
  const sell = Number(form.value.sellingPrice);
  if (!buy || !sell) return null;
  const margin = ((sell - buy) / buy) * 100;
  return margin.toFixed(1);
});

const profitMarginClass = computed(() => {
  const m = Number(profitMargin.value);
  if (m < 0) return 'text-red-600';
  if (m < 10) return 'text-amber-500';
  return 'text-emerald-600';
});

// ─── Open Drawer ──────────────────────────────────────────────────────────────
const openAddDrawer = () => {
  editingProduct.value = null;
  form.value = defaultForm();
  formErrors.value = {};
  activeTab.value = 'basic';
  drawerMode.value = 'add';
  sizeInputText.value = '';
  colorInputText.value = '';
  drawerOpen.value = true;
};

const openEditDrawer = (product: Product) => {
  editingProduct.value = product;
  form.value = {
    name: product.name,
    sku: product.sku,
    description: product.description || '',
    category: product.category,
    brand: product.brand || '',
    status: product.status,
    purchasePrice: product.purchasePrice,
    sellingPrice: product.sellingPrice,
    discountedPrice: product.discountedPrice || '',
    hasDiscountedPrice: !!product.discountedPrice,
    stock: product.stock,
    lowStockThreshold: product.lowStockThreshold,
    trackInventory: product.trackInventory,
    hasVariants: product.hasVariants,
    variants: product.variants.map(v => ({ ...v })),
    weight: product.weight || '',
    dimensions: product.dimensions ? { ...product.dimensions } : { l: 0, w: 0, h: 0 },
    tags: [...product.tags],
    images: [...product.images],
  };

  // Initialize sizes and colors for options UI
  const uniqueSizes = [...new Set(product.variants.map(v => v.size).filter(Boolean))];
  const uniqueColors = [...new Set(product.variants.map(v => v.color).filter(Boolean))];
  sizeInputText.value = uniqueSizes.join(', ');
  colorInputText.value = uniqueColors.join(', ');

  formErrors.value = {};
  activeTab.value = 'basic';
  drawerMode.value = 'edit';
  drawerOpen.value = true;
};

const openViewDrawer = (product: Product) => {
  editingProduct.value = product;
  form.value = {
    name: product.name,
    sku: product.sku,
    description: product.description || '',
    category: product.category,
    brand: product.brand || '',
    status: product.status,
    purchasePrice: product.purchasePrice,
    sellingPrice: product.sellingPrice,
    discountedPrice: product.discountedPrice || '',
    hasDiscountedPrice: !!product.discountedPrice,
    stock: product.stock,
    lowStockThreshold: product.lowStockThreshold,
    trackInventory: product.trackInventory,
    hasVariants: product.hasVariants,
    variants: product.variants.map(v => ({ ...v })),
    weight: product.weight || '',
    dimensions: product.dimensions ? { ...product.dimensions } : { l: 0, w: 0, h: 0 },
    tags: [...product.tags],
    images: [...product.images],
  };

  const uniqueSizes = [...new Set(product.variants.map(v => v.size).filter(Boolean))];
  const uniqueColors = [...new Set(product.variants.map(v => v.color).filter(Boolean))];
  sizeInputText.value = uniqueSizes.join(', ');
  colorInputText.value = uniqueColors.join(', ');

  formErrors.value = {};
  activeTab.value = 'basic';
  drawerMode.value = 'view';
  drawerOpen.value = true;
};

const closeDrawer = () => {
  drawerOpen.value = false;
  editingProduct.value = null;
};

// ─── Validation ────────────────────────────────────────────────────────────────
const validate = (): boolean => {
  formErrors.value = {};
  const f = form.value;

  if (!f.name.trim() || f.name.trim().length < 3) formErrors.value.name = 'Name must be at least 3 characters';
  if (!f.category) formErrors.value.category = 'Category is required';
  if (f.sku && !/^[A-Za-z0-9\-]+$/.test(f.sku)) formErrors.value.sku = 'SKU must be alphanumeric with hyphens only';
  if (!f.purchasePrice || Number(f.purchasePrice) <= 0) formErrors.value.purchasePrice = 'Purchase price is required';
  if (!f.sellingPrice || Number(f.sellingPrice) <= 0) formErrors.value.sellingPrice = 'Selling price is required';
  
  if (form.value.hasVariants) {
    form.value.stock = computedFormStock.value;
  }
  if (Number(form.value.stock) < 0) formErrors.value.stock = 'Stock cannot be negative';

  if (Object.keys(formErrors.value).length > 0) {
    isFormShaking.value = true;
    setTimeout(() => { isFormShaking.value = false; }, 600);
    // Jump to tab with error
    if (formErrors.value.name || formErrors.value.sku || formErrors.value.category) activeTab.value = 'basic';
    else if (formErrors.value.purchasePrice || formErrors.value.sellingPrice) activeTab.value = 'pricing';
    else if (formErrors.value.stock) activeTab.value = 'stock';
    return false;
  }
  return true;
};

// ─── Submit ───────────────────────────────────────────────────────────────────
const handleSubmit = async () => {
  if (!validate()) return;
  let result: Product | null;
  if (editingProduct.value) {
    result = await updateProduct(editingProduct.value._id, form.value);
  } else {
    result = await createProduct(form.value);
  }
  if (result) closeDrawer();
};

// ─── Delete ───────────────────────────────────────────────────────────────────
const requestDelete = (id: string) => {
  deletingId.value = id;
  confirmDelete.value = true;
};

const handleDelete = async () => {
  if (!deletingId.value) return;
  const ok = await deleteProduct(deletingId.value);
  if (ok) { confirmDelete.value = false; deletingId.value = null; }
};

// ─── Tags ─────────────────────────────────────────────────────────────────────
const addTag = () => {
  const tags = tagInput.value.split(',').map(t => t.trim()).filter(Boolean);
  form.value.tags = [...new Set([...form.value.tags, ...tags])];
  tagInput.value = '';
};

// Remove tag
const removeTag = (tag: string) => {
  form.value.tags = form.value.tags.filter(t => t !== tag);
};

const handleTagKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); }
};

// ─── Variants ─────────────────────────────────────────────────────────────────
const addVariant = () => {
  form.value.variants.push({ size: '', color: '', stock: 0, sku: '', purchasePrice: undefined, sellingPrice: undefined });
};

const removeVariant = (i: number) => {
  form.value.variants.splice(i, 1);
};

// ─── Stock Status Helper ──────────────────────────────────────────────────────
const getStockStatus = (p: Product): 'in-stock' | 'low-stock' | 'out-of-stock' => {
  if (!p.trackInventory) return 'in-stock';
  const stock = getProductStock(p);
  if (stock === 0) return 'out-of-stock';
  if (stock <= p.lowStockThreshold) return 'low-stock';
  return 'in-stock';
};

// ─── Format currency ──────────────────────────────────────────────────────────
const fmt = (n: number) => `${CURRENCY_SYMBOL}${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ─── Init ─────────────────────────────────────────────────────────────────────
onMounted(() => fetchProducts());

// Tabs
const tabs = [
  { id: 'basic', label: 'Basic Info' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'stock', label: 'Stock' },
  { id: 'shipping', label: 'Shipping' },
  { id: 'tags', label: 'Tags' },
] as const;
</script>

<template>
  <div class="space-y-6">
    <!-- ── Page Header ──────────────────────────────────────────────────────── -->
    <div class="flex items-center justify-between">
      <div>
        <p class="text-[10px] font-black uppercase tracking-widest italic text-slate-400 mb-1">Management</p>
        <h1 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Inventory</h1>
      </div>
      <button
        id="btn-add-product"
        class="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 hover:scale-[1.02] active:scale-95 transition-all"
        @click="openAddDrawer"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"/></svg>
        Add Product
      </button>
    </div>

    <!-- ── Stats Row ────────────────────────────────────────────────────────── -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
        <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Items</p>
        <p class="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{{ stats.total }}</p>
      </div>
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
        <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Stock Units</p>
        <p class="text-3xl font-black text-primary-600 dark:text-primary-400 tracking-tight">{{ stats.totalStock || 0 }}</p>
      </div>
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
        <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Low Stock</p>
        <div class="flex items-center gap-2">
          <p class="text-3xl font-black text-amber-500 tracking-tight">{{ stats.lowStock }}</p>
          <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        </div>
      </div>
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
        <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Out of Stock</p>
        <div class="flex items-center gap-2">
          <p class="text-3xl font-black text-red-500 tracking-tight">{{ stats.outOfStock }}</p>
          <span class="w-2 h-2 rounded-full bg-red-400" />
        </div>
      </div>
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
        <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Drafts</p>
        <p class="text-3xl font-black text-slate-500 dark:text-slate-400 tracking-tight">{{ stats.drafts }}</p>
      </div>
    </div>

    <!-- ── Filters ──────────────────────────────────────────────────────────── -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
      <div class="flex flex-col sm:flex-row gap-3">
        <!-- Search -->
        <div class="relative flex-1">
          <svg viewBox="0 0 20 20" fill="currentColor" class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none">
            <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd"/>
          </svg>
          <input
            v-model="searchInput"
            type="text"
            id="inventory-search"
            placeholder="Search by name, SKU, brand..."
            class="w-full pl-10 pr-4 py-2.5 rounded-2xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </div>

        <!-- Category filter -->
        <select
          :value="query.category"
          @change="setFilter('category', ($event.target as HTMLSelectElement).value)"
          class="px-4 py-2.5 rounded-2xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all cursor-pointer"
        >
          <option value="">All Categories</option>
          <option v-for="cat in PRODUCT_CATEGORIES" :key="cat" :value="cat">{{ cat }}</option>
        </select>

        <!-- Status filter -->
        <select
          :value="query.status"
          @change="setFilter('status', ($event.target as HTMLSelectElement).value)"
          class="px-4 py-2.5 rounded-2xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all cursor-pointer"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
        </select>
      </div>
    </div>

    <!-- ── Product Table ────────────────────────────────────────────────────── -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <!-- Loading -->
      <BaseLoader v-if="loading" variant="inline" text="Loading products..." />

      <!-- Empty -->
      <BaseEmpty
        v-else-if="isEmpty"
        icon="📦"
        title="No products yet"
        description="Add your first product to start managing your inventory."
        action-text="Add Product"
        @action="openAddDrawer"
      />

      <!-- Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-slate-100 dark:border-slate-800">
              <th class="text-left text-[9px] font-black uppercase tracking-widest text-slate-400 px-5 py-3.5">Product</th>
              <th class="text-left text-[9px] font-black uppercase tracking-widest text-slate-400 px-4 py-3.5 hidden md:table-cell">SKU</th>
              <th class="text-left text-[9px] font-black uppercase tracking-widest text-slate-400 px-4 py-3.5 hidden lg:table-cell">Category</th>
              <th class="text-left text-[9px] font-black uppercase tracking-widest text-slate-400 px-4 py-3.5">Stock</th>
              <th class="text-left text-[9px] font-black uppercase tracking-widest text-slate-400 px-4 py-3.5 hidden xl:table-cell">Buy Price</th>
              <th class="text-left text-[9px] font-black uppercase tracking-widest text-slate-400 px-4 py-3.5">Sell Price</th>
              <th class="text-left text-[9px] font-black uppercase tracking-widest text-slate-400 px-4 py-3.5">Status</th>
              <th class="text-right text-[9px] font-black uppercase tracking-widest text-slate-400 px-5 py-3.5">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr
              v-for="product in products"
              :key="product._id"
              class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
            >
              <!-- Name -->
              <td class="px-5 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 rounded-xl flex items-center justify-center shrink-0">
                    <span class="text-primary-600 dark:text-primary-400 font-black text-xs">{{ product.name[0].toUpperCase() }}</span>
                  </div>
                  <div>
                    <p class="font-black text-sm text-slate-900 dark:text-white tracking-tight">{{ product.name }}</p>
                    <p v-if="product.brand" class="text-xs text-slate-400">{{ product.brand }}</p>
                  </div>
                </div>
              </td>
              <!-- SKU -->
              <td class="px-4 py-4 hidden md:table-cell">
                <code class="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg text-slate-600 dark:text-slate-400">{{ product.sku }}</code>
              </td>
              <!-- Category -->
              <td class="px-4 py-4 hidden lg:table-cell">
                <span class="text-sm text-slate-600 dark:text-slate-400">{{ product.category }}</span>
              </td>
              <!-- Stock -->
              <td class="px-4 py-4">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold text-slate-900 dark:text-white">
                    {{ product.trackInventory ? getProductStock(product) : '∞' }}
                  </span>
                  <BaseBadge
                    v-if="product.trackInventory"
                    :status="getStockStatus(product)"
                    :pulse="getStockStatus(product) === 'low-stock'"
                  />
                </div>
              </td>
              <!-- Buy Price -->
              <td class="px-4 py-4 hidden xl:table-cell">
                <span class="text-sm text-slate-600 dark:text-slate-400">{{ fmt(product.purchasePrice) }}</span>
              </td>
              <!-- Sell Price -->
              <td class="px-4 py-4">
                <div>
                  <span class="text-sm font-bold text-slate-900 dark:text-white">{{ fmt(product.sellingPrice) }}</span>
                  <span v-if="product.discountedPrice" class="block text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    Sale: {{ fmt(product.discountedPrice) }}
                  </span>
                </div>
              </td>
              <!-- Status -->
              <td class="px-4 py-4">
                <BaseBadge :status="product.status" />
              </td>
              <!-- Actions -->
              <td class="px-5 py-4">
                <div class="flex items-center justify-end gap-2">
                  <button
                    class="p-2 rounded-xl text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all opacity-0 group-hover:opacity-100"
                    title="View details"
                    @click="openViewDrawer(product)"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                      <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
                    </svg>
                  </button>
                  <button
                    class="p-2 rounded-xl text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all opacity-0 group-hover:opacity-100"
                    title="Edit product"
                    @click="openEditDrawer(product)"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                      <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z"/>
                      <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z"/>
                    </svg>
                  </button>
                  <button
                    class="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
                    title="Archive product"
                    @click="requestDelete(product._id)"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                      <path d="M2 3a1 1 0 00-1 1v1a1 1 0 001 1h16a1 1 0 001-1V4a1 1 0 00-1-1H2z"/>
                      <path fill-rule="evenodd" d="M2 7.5h16l-.811 7.71a2 2 0 01-1.99 1.79H4.802a2 2 0 01-1.99-1.79L2 7.5zM7 11a1 1 0 012 0v3a1 1 0 11-2 0v-3zm4-1a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1z" clip-rule="evenodd"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="!loading && pagination.totalPages > 1" class="flex items-center justify-between px-5 py-4 border-t border-slate-100 dark:border-slate-800">
        <p class="text-xs text-slate-500 dark:text-slate-400">
          Showing {{ (pagination.page - 1) * pagination.limit + 1 }}–{{ Math.min(pagination.page * pagination.limit, pagination.total) }} of {{ pagination.total }}
        </p>
        <div class="flex items-center gap-1">
          <button
            :disabled="!pagination.hasPrev"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            @click="goToPage(pagination.page - 1)"
          >←</button>
          <template v-for="p in pagination.totalPages" :key="p">
            <button
              v-if="p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1"
              :class="['px-3 py-1.5 rounded-xl text-xs font-bold transition-all', p === pagination.page ? 'bg-primary-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800']"
              @click="goToPage(p)"
            >{{ p }}</button>
            <span v-else-if="p === 2 || p === pagination.totalPages - 1" class="px-1 text-slate-400">…</span>
          </template>
          <button
            :disabled="!pagination.hasNext"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            @click="goToPage(pagination.page + 1)"
          >→</button>
        </div>
      </div>
    </div>

    <!-- ── Delete Confirm ──────────────────────────────────────────────────── -->
    <BaseConfirm
      v-model="confirmDelete"
      title="Archive Product"
      message="This product will be archived and removed from your active inventory. You can restore it later."
      confirm-text="Archive"
      type="danger"
      :loading="deleting"
      @confirm="handleDelete"
      @cancel="confirmDelete = false; deletingId = null"
    />

    <!-- ── Product Drawer ──────────────────────────────────────────────────── -->
    <Teleport to="body">
      <!-- Backdrop -->
      <Transition
        enter-active-class="transition-opacity duration-300"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-250"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="drawerOpen"
          class="fixed inset-0 z-[700] bg-slate-900/40 backdrop-blur-sm"
          @click="closeDrawer"
        />
      </Transition>

      <!-- Drawer Panel -->
      <Transition
        enter-active-class="transition-transform duration-350 ease-[cubic-bezier(0.16,1,0.3,1)]"
        enter-from-class="translate-x-full"
        enter-to-class="translate-x-0"
        leave-active-class="transition-transform duration-250 ease-in"
        leave-from-class="translate-x-0"
        leave-to-class="translate-x-full"
      >
        <div
          v-if="drawerOpen"
          :class="[
            'fixed inset-y-0 right-0 z-[800] w-full max-w-2xl',
            'bg-white dark:bg-slate-900',
            'border-l border-slate-200 dark:border-slate-800',
            'shadow-2xl shadow-slate-900/20',
            'flex flex-col',
          ]"
          @click.stop
        >
          <!-- Drawer Header -->
          <div class="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div>
              <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Inventory</p>
              <h2 class="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                {{ drawerMode === 'view' ? 'Product Details' : (editingProduct ? 'Edit Product' : 'Add New Product') }}
              </h2>
            </div>
            <button
              class="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              @click="closeDrawer"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
              </svg>
            </button>
          </div>

          <!-- Tabs -->
          <div v-if="drawerMode !== 'view'" class="flex gap-1 px-6 py-3 border-b border-slate-100 dark:border-slate-800 overflow-x-auto shrink-0">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              :class="[
                'px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all',
                activeTab === tab.id
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800',
              ]"
              @click="activeTab = tab.id"
            >
              <span
                v-if="(tab.id === 'basic' && (formErrors.name || formErrors.sku || formErrors.category)) ||
                      (tab.id === 'pricing' && (formErrors.purchasePrice || formErrors.sellingPrice)) ||
                      (tab.id === 'stock' && formErrors.stock)"
                class="inline-block w-1.5 h-1.5 bg-red-500 rounded-full mr-1"
              />
              {{ tab.label }}
            </button>
          </div>

          <!-- Drawer Body (scrollable) -->
          <div :class="['flex-1 overflow-y-auto p-6', isFormShaking ? 'animate-shake' : '']">
            <!-- ── View Details Dashboard ─────────────────────────────────── -->
            <div v-if="drawerMode === 'view'" class="space-y-6">
              <!-- Name, Brand, status header banner -->
              <div class="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
                <div class="flex items-start justify-between">
                  <div>
                    <span v-if="form.brand" class="text-[9px] font-black uppercase tracking-widest text-primary-500 mb-1 block">{{ form.brand }}</span>
                    <h3 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{{ form.name }}</h3>
                    <code class="text-xs font-mono bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-lg text-slate-600 dark:text-slate-300 mt-1.5 inline-block">{{ form.sku }}</code>
                  </div>
                  <BaseBadge :status="form.status" />
                </div>
                <p v-if="form.description" class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  {{ form.description }}
                </p>
              </div>

              <!-- Specs Quick Grid -->
              <div class="grid grid-cols-2 gap-4">
                <div class="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
                  <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Category</p>
                  <p class="text-sm font-bold text-slate-800 dark:text-slate-200">{{ form.category }}</p>
                </div>
                <div class="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
                  <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Track Inventory</p>
                  <p class="text-sm font-bold text-slate-800 dark:text-slate-200">{{ form.trackInventory ? 'Enabled' : 'Disabled' }}</p>
                </div>
              </div>

              <!-- Pricing Section -->
              <div class="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-4">
                <h4 class="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-50 dark:border-slate-800 pb-2">Pricing Details</h4>
                <div class="grid grid-cols-3 gap-4">
                  <div>
                    <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Purchase Price</p>
                    <p class="text-base font-bold text-slate-800 dark:text-slate-200">{{ fmt(Number(form.purchasePrice) || 0) }}</p>
                  </div>
                  <div>
                    <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Selling Price</p>
                    <p class="text-base font-bold text-slate-900 dark:text-white">{{ fmt(Number(form.sellingPrice) || 0) }}</p>
                  </div>
                  <div>
                    <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Discounted Price</p>
                    <p class="text-base font-bold text-emerald-600 dark:text-emerald-400">
                      {{ form.hasDiscountedPrice && form.discountedPrice ? fmt(Number(form.discountedPrice) || 0) : 'None' }}
                    </p>
                  </div>
                </div>
                <!-- Margin Indicator -->
                <div v-if="profitMargin !== null" class="pt-3 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-500 dark:text-slate-400">Estimated Profit Margin</span>
                  <span :class="['text-sm font-black', profitMarginClass]">
                    {{ Number(profitMargin) >= 0 ? '+' : '' }}{{ profitMargin }}%
                  </span>
                </div>
              </div>

              <!-- Stock & Variants -->
              <div class="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-4">
                <div class="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-2">
                  <h4 class="text-xs font-black uppercase tracking-widest text-slate-400">Stock & Inventory</h4>
                  <BaseBadge
                    v-if="form.trackInventory"
                    :status="editingProduct ? getStockStatus(editingProduct) : 'in-stock'"
                  />
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Stock Quantity</p>
                    <p class="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {{ form.trackInventory ? computedFormStock : '∞' }}
                    </p>
                  </div>
                  <div>
                    <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Low Stock Threshold</p>
                    <p class="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{{ form.lowStockThreshold }}</p>
                  </div>
                </div>

                <!-- Variants Info Table if hasVariants -->
                <div v-if="form.hasVariants && form.variants.length > 0" class="pt-4 border-t border-slate-50 dark:border-slate-800 space-y-3">
                  <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Variants Combinations</p>
                  <div class="overflow-x-auto">
                    <table class="w-full text-xs">
                      <thead>
                        <tr class="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <th class="text-left pb-2">Size</th>
                          <th class="text-left pb-2">Color</th>
                          <th class="text-left pb-2">SKU</th>
                          <th class="text-right pb-2">Variant Stock</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-50 dark:divide-slate-800/50">
                        <tr v-for="(v, index) in form.variants" :key="index" class="text-slate-700 dark:text-slate-300 font-medium">
                          <td class="py-2.5 font-bold">{{ v.size || '—' }}</td>
                          <td class="py-2.5 font-bold">{{ v.color || '—' }}</td>
                          <td class="py-2.5"><code class="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{{ v.sku || '—' }}</code></td>
                          <td class="py-2.5 text-right font-black text-slate-900 dark:text-white">{{ v.stock }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <!-- Tags Section -->
              <div v-if="form.tags.length > 0" class="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3">
                <h4 class="text-xs font-black uppercase tracking-widest text-slate-400">Metadata Tags</h4>
                <div class="flex flex-wrap gap-2">
                  <span v-for="tag in form.tags" :key="tag" class="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold">
                    {{ tag }}
                  </span>
                </div>
              </div>
            </div>

            <!-- ── Form Inputs (Add/Edit Mode) ────────────────────────────── -->
            <div v-else>
              <!-- ── Section 1: Basic Info ──────────────────────────────────── -->
              <div v-show="activeTab === 'basic'" class="space-y-5">
                <!-- Name -->
                <div>
                  <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                    Product Name <span class="text-red-500">*</span>
                  </label>
                  <input v-model="form.name" type="text" id="product-name" placeholder="e.g. Premium Wireless Headphones"
                    :class="['w-full px-4 py-3 rounded-2xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all', formErrors.name ? 'border-red-400' : 'border-slate-200 dark:border-slate-700']" />
                  <p v-if="formErrors.name" class="mt-1.5 text-xs text-red-500 font-medium">{{ formErrors.name }}</p>
                </div>

                <!-- SKU -->
                <div>
                  <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                    SKU <span class="normal-case font-medium text-slate-400">(auto-generated if blank)</span>
                  </label>
                  <input v-model="form.sku" type="text" id="product-sku" placeholder="e.g. VH-A1B2C3"
                    :class="['w-full px-4 py-3 rounded-2xl text-sm font-mono bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all', formErrors.sku ? 'border-red-400' : 'border-slate-200 dark:border-slate-700']" />
                  <p v-if="formErrors.sku" class="mt-1.5 text-xs text-red-500 font-medium">{{ formErrors.sku }}</p>
                </div>

                <!-- Category + Brand -->
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                      Category <span class="text-red-500">*</span>
                    </label>
                    <select v-model="form.category" id="product-category"
                      :class="['w-full px-4 py-3 rounded-2xl text-sm bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all cursor-pointer', formErrors.category ? 'border-red-400' : 'border-slate-200 dark:border-slate-700']">
                      <option value="">Select category</option>
                      <option v-for="cat in PRODUCT_CATEGORIES" :key="cat" :value="cat">{{ cat }}</option>
                    </select>
                    <p v-if="formErrors.category" class="mt-1.5 text-xs text-red-500 font-medium">{{ formErrors.category }}</p>
                  </div>
                  <div>
                    <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Brand</label>
                    <input v-model="form.brand" type="text" id="product-brand" placeholder="e.g. Sony"
                      class="w-full px-4 py-3 rounded-2xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
                  </div>
                </div>

                <!-- Description -->
                <div>
                  <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Description</label>
                  <textarea v-model="form.description" id="product-description" rows="4" placeholder="Product description..."
                    class="w-full px-4 py-3 rounded-2xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none" />
                </div>

                <!-- Status -->
                <div>
                  <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Status</label>
                  <div class="flex gap-2">
                    <button v-for="s in ['active', 'draft', 'archived']" :key="s"
                      type="button"
                      :class="[
                        'px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all',
                        form.status === s
                          ? s === 'active' ? 'bg-emerald-600 text-white border-emerald-600'
                            : s === 'draft' ? 'bg-slate-600 text-white border-slate-600'
                            : 'bg-slate-400 text-white border-slate-400'
                          : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300',
                      ]"
                      @click="form.status = s as 'active' | 'draft' | 'archived'"
                    >{{ s }}</button>
                  </div>
                </div>
              </div>

              <!-- ── Section 2: Pricing ────────────────────────────────────── -->
              <div v-show="activeTab === 'pricing'" class="space-y-5">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                      Purchase Price (₹) <span class="text-red-500">*</span>
                    </label>
                    <input v-model="form.purchasePrice" type="number" id="product-purchase-price" placeholder="0.00" min="0" step="0.01"
                      :class="['w-full px-4 py-3 rounded-2xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all', formErrors.purchasePrice ? 'border-red-400' : 'border-slate-200 dark:border-slate-700']" />
                    <p v-if="formErrors.purchasePrice" class="mt-1.5 text-xs text-red-500 font-medium">{{ formErrors.purchasePrice }}</p>
                  </div>
                  <div>
                    <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                      Selling Price (₹) <span class="text-red-500">*</span>
                    </label>
                    <input v-model="form.sellingPrice" type="number" id="product-selling-price" placeholder="0.00" min="0" step="0.01"
                      :class="['w-full px-4 py-3 rounded-2xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all', formErrors.sellingPrice ? 'border-red-400' : 'border-slate-200 dark:border-slate-700']" />
                    <p v-if="formErrors.sellingPrice" class="mt-1.5 text-xs text-red-500 font-medium">{{ formErrors.sellingPrice }}</p>
                  </div>
                </div>

                <!-- Profit Margin Live Indicator -->
                <div v-if="profitMargin !== null" class="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div class="flex items-center justify-between">
                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Profit Margin</p>
                    <p :class="['text-xl font-black tracking-tight', profitMarginClass]">
                      {{ Number(profitMargin) >= 0 ? '+' : '' }}{{ profitMargin }}%
                    </p>
                  </div>
                  <p v-if="Number(profitMargin) < 0" class="text-xs text-red-500 font-medium mt-1">
                    ⚠️ Selling price is below purchase price
                  </p>
                  <p :class="['text-xs font-medium mt-1', Number(profitMargin) < 10 ? 'text-amber-500' : 'text-slate-400']" v-else>
                    {{ Number(profitMargin) < 10 ? 'Low margin — consider raising the price' : 'Healthy profit margin' }}
                  </p>
                </div>

                <!-- Discounted Price -->
                <div>
                  <label class="flex items-center gap-2.5 cursor-pointer mb-3">
                    <div
                      :class="['relative w-9 h-5 rounded-full transition-colors duration-200', form.hasDiscountedPrice ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600']"
                      @click="form.hasDiscountedPrice = !form.hasDiscountedPrice"
                    >
                      <div :class="['absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200', form.hasDiscountedPrice ? 'translate-x-4' : '']" />
                    </div>
                    <span class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Enable Sale Price</span>
                  </label>
                  <Transition enter-active-class="transition-all duration-200" enter-from-class="opacity-0 -translate-y-1" enter-to-class="opacity-100 translate-y-0">
                    <div v-if="form.hasDiscountedPrice">
                      <input v-model="form.discountedPrice" type="number" id="product-discount-price" placeholder="Discounted price (₹)" min="0" step="0.01"
                        class="w-full px-4 py-3 rounded-2xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
                    </div>
                  </Transition>
                </div>
              </div>

              <!-- ── Section 3: Stock ──────────────────────────────────────── -->
              <div v-show="activeTab === 'stock'" class="space-y-5">
                <!-- Track Inventory Toggle -->
                <label class="flex items-center gap-3 cursor-pointer p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div
                    :class="['relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0', form.trackInventory ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600']"
                    @click="form.trackInventory = !form.trackInventory"
                  >
                    <div :class="['absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200', form.trackInventory ? 'translate-x-4' : '']" />
                  </div>
                  <div>
                    <p class="text-sm font-black text-slate-900 dark:text-white">Track Inventory</p>
                    <p class="text-xs text-slate-500">When disabled, product shows as always "In Stock"</p>
                  </div>
                </label>

                <!-- Has Variants Toggle -->
                <label class="flex items-center gap-3 cursor-pointer p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div
                    :class="['relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0', form.hasVariants ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600']"
                    @click="form.hasVariants = !form.hasVariants; if(form.hasVariants && form.variants.length === 0) addVariant()"
                  >
                    <div :class="['absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200', form.hasVariants ? 'translate-x-4' : '']" />
                  </div>
                  <div>
                    <p class="text-sm font-black text-slate-900 dark:text-white">Has Variants</p>
                    <p class="text-xs text-slate-500">Add size/color variants with individual stock levels</p>
                  </div>
                </label>

                <!-- No Variants -->
                <div v-if="!form.hasVariants" class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Stock Quantity</label>
                    <input v-model="form.stock" type="number" id="product-stock" min="0" placeholder="0"
                      :class="['w-full px-4 py-3 rounded-2xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all', formErrors.stock ? 'border-red-400' : 'border-slate-200 dark:border-slate-700']" />
                    <p v-if="formErrors.stock" class="mt-1.5 text-xs text-red-500 font-medium">{{ formErrors.stock }}</p>
                  </div>
                  <div>
                    <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Low Stock Threshold</label>
                    <input v-model="form.lowStockThreshold" type="number" id="product-threshold" min="0" placeholder="10"
                      class="w-full px-4 py-3 rounded-2xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
                  </div>
                </div>

                <!-- Variants Generator & Table -->
                <div v-if="form.hasVariants" class="space-y-4">
                  <!-- Option Inputs Generator -->
                  <div class="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3.5">
                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Variant Generator</p>
                    
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Sizes Option</label>
                        <input v-model="sizeInputText" type="text" placeholder="e.g. S, M, L, XL"
                          class="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
                      </div>
                      <div>
                        <label class="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Colors Option</label>
                        <input v-model="colorInputText" type="text" placeholder="e.g. Black, White, Blue"
                          class="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
                      </div>
                    </div>

                    <div class="flex items-center justify-between pt-1">
                      <p class="text-[10px] text-slate-400">Enter comma-separated values to automatically generate options</p>
                      <button type="button" @click="generateCombinations"
                        class="px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
                        Generate Grid
                      </button>
                    </div>
                  </div>

                  <!-- Variants Table -->
                  <div class="space-y-3">
                    <div class="flex items-center justify-between">
                      <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Combinations List</p>
                      <button type="button" @click="addVariant"
                        class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 border border-primary-200 dark:border-primary-800 transition-all">
                        <svg viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"/></svg>
                        Add Row
                      </button>
                    </div>

                    <div class="overflow-x-auto">
                      <table class="w-full text-xs">
                        <thead>
                          <tr class="border-b border-slate-200 dark:border-slate-700">
                            <th class="text-left text-[9px] font-black uppercase tracking-widest text-slate-400 pb-2 pr-2">Size</th>
                            <th class="text-left text-[9px] font-black uppercase tracking-widest text-slate-400 pb-2 pr-2">Color</th>
                            <th class="text-left text-[9px] font-black uppercase tracking-widest text-slate-400 pb-2 pr-2">Stock</th>
                            <th class="text-left text-[9px] font-black uppercase tracking-widest text-slate-400 pb-2 pr-2">SKU</th>
                            <th class="pb-2" />
                          </tr>
                        </thead>
                        <tbody class="space-y-2">
                          <tr v-for="(variant, i) in form.variants" :key="i" class="border-b border-slate-100 dark:border-slate-800">
                            <td class="py-2 pr-2">
                              <input v-model="variant.size" type="text" placeholder="S / M / L" class="w-full px-2.5 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500" />
                            </td>
                            <td class="py-2 pr-2">
                              <input v-model="variant.color" type="text" placeholder="Red / Blue" class="w-full px-2.5 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500" />
                            </td>
                            <td class="py-2 pr-2">
                              <input v-model="variant.stock" type="number" min="0" placeholder="0" class="w-full px-2.5 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500" />
                            </td>
                            <td class="py-2 pr-2">
                              <input v-model="variant.sku" type="text" placeholder="SKU-001" class="w-full px-2.5 py-1.5 rounded-xl text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500" />
                            </td>
                            <td class="py-2">
                              <button type="button" @click="removeVariant(i)" class="p-1 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                                <svg viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/></svg>
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <!-- Total Stock Info Display -->
                  <div class="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900 flex items-center justify-between">
                    <span class="text-xs font-bold text-emerald-800 dark:text-emerald-300">Total Calculated Stock:</span>
                    <span class="text-lg font-black text-emerald-900 dark:text-emerald-100">{{ computedFormStock }} Units</span>
                  </div>
                </div>
              </div>

              <!-- ── Section 4: Shipping ───────────────────────────────────── -->
              <div v-show="activeTab === 'shipping'" class="space-y-5">
                <div>
                  <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Weight (grams)</label>
                  <input v-model="form.weight" type="number" id="product-weight" min="0" placeholder="e.g. 250"
                    class="w-full px-4 py-3 rounded-2xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
                </div>
                <div>
                  <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Dimensions (cm)</label>
                  <div class="grid grid-cols-3 gap-3">
                    <div>
                      <label class="block text-xs text-slate-400 mb-1">Length</label>
                      <input v-model="form.dimensions.l" type="number" min="0" placeholder="L"
                        class="w-full px-4 py-3 rounded-2xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
                    </div>
                    <div>
                      <label class="block text-xs text-slate-400 mb-1">Width</label>
                      <input v-model="form.dimensions.w" type="number" min="0" placeholder="W"
                        class="w-full px-4 py-3 rounded-2xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
                    </div>
                    <div>
                      <label class="block text-xs text-slate-400 mb-1">Height</label>
                      <input v-model="form.dimensions.h" type="number" min="0" placeholder="H"
                        class="w-full px-4 py-3 rounded-2xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- ── Section 5: Tags ───────────────────────────────────────── -->
              <div v-show="activeTab === 'tags'" class="space-y-5">
                <div>
                  <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Tags</label>
                  <p class="text-xs text-slate-400 mb-3">Press Enter or comma to add tags</p>
                  <input v-model="tagInput" type="text" id="product-tags" placeholder="e.g. wireless, premium, audio"
                    class="w-full px-4 py-3 rounded-2xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    @keydown="handleTagKeydown" @blur="addTag" />
                </div>

                <!-- Tag chips -->
                <div v-if="form.tags.length" class="flex flex-wrap gap-2">
                  <span
                    v-for="tag in form.tags"
                    :key="tag"
                    class="flex items-center gap-1.5 px-3 py-1.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-xl text-xs font-bold"
                  >
                    {{ tag }}
                    <button type="button" @click="removeTag(tag)" class="text-primary-400 hover:text-primary-600 transition-colors">
                      <svg viewBox="0 0 16 16" fill="currentColor" class="w-3 h-3"><path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"/></svg>
                    </button>
                  </span>
                </div>

                <div v-else class="py-8 text-center text-slate-400 text-sm">
                  No tags added yet. Tags help with search and filtering.
                </div>
              </div>
            </div>
          </div>

          <!-- Drawer Footer -->
          <div class="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-900/50">
            <button
              class="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              @click="closeDrawer"
            >
              {{ drawerMode === 'view' ? 'Close' : 'Cancel' }}
            </button>
            <button
              v-if="drawerMode === 'view'"
              class="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 hover:scale-[1.02] active:scale-95 transition-all"
              @click="drawerMode = 'edit'"
            >
              Edit Product
            </button>
            <button
              v-else
              id="btn-save-product"
              :disabled="saving"
              class="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              @click="handleSubmit"
            >
              <svg v-if="saving" class="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              {{ saving ? 'Saving...' : (editingProduct ? 'Update Product' : 'Save Product') }}
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
