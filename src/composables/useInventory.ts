import { ref, computed } from 'vue';
import api from '@/services/api';
import { API_URLS } from '@/constants';
import { useNotificationStore } from '@/stores/notification';
import type {
  Product,
  ProductForm,
  ProductListResponse,
  Pagination,
  InventoryStats,
} from '@/types';

// ─── Query State ──────────────────────────────────────────────────────────────
export interface InventoryQuery {
  page: number;
  limit: number;
  search: string;
  category: string;
  status: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export const useInventory = () => {
  const notif = useNotificationStore();

  // ─── State ─────────────────────────────────────────────────────────────────
  const products = ref<Product[]>([]);
  const pagination = ref<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const stats = ref<InventoryStats>({ total: 0, drafts: 0, outOfStock: 0, lowStock: 0 });
  const loading = ref(false);
  const saving = ref(false);
  const deleting = ref(false);

  const query = ref<InventoryQuery>({
    page: 1,
    limit: 20,
    search: '',
    category: '',
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // ─── Computed ───────────────────────────────────────────────────────────────
  const isEmpty = computed(() => !loading.value && products.value.length === 0);

  // ─── Fetch Products ─────────────────────────────────────────────────────────
  const fetchProducts = async (): Promise<void> => {
    loading.value = true;
    try {
      const params: Record<string, string | number> = {
        page: query.value.page,
        limit: query.value.limit,
        sortBy: query.value.sortBy,
        sortOrder: query.value.sortOrder,
      };

      if (query.value.search) params.search = query.value.search;
      if (query.value.category) params.category = query.value.category;
      if (query.value.status) params.status = query.value.status;

      const { data } = await api.get<{ success: boolean; data: ProductListResponse }>(
        API_URLS.INVENTORY,
        { params }
      );

      products.value = data.data.products;
      pagination.value = data.data.pagination;
      stats.value = data.data.stats;
    } catch {
      // Error already handled by Axios interceptor
    } finally {
      loading.value = false;
    }
  };

  // ─── Create Product ─────────────────────────────────────────────────────────
  const createProduct = async (form: ProductForm): Promise<Product | null> => {
    saving.value = true;
    try {
      const payload = buildPayload(form);
      const { data } = await api.post<{ success: boolean; data: Product; message: string }>(
        API_URLS.INVENTORY,
        payload
      );
      notif.success(data.message || 'Product created successfully!');
      await fetchProducts();
      return data.data;
    } catch {
      return null;
    } finally {
      saving.value = false;
    }
  };

  // ─── Update Product ─────────────────────────────────────────────────────────
  const updateProduct = async (id: string, form: ProductForm): Promise<Product | null> => {
    saving.value = true;
    try {
      const payload = buildPayload(form);
      const { data } = await api.put<{ success: boolean; data: Product; message: string }>(
        API_URLS.INVENTORY_BY_ID(id),
        payload
      );
      notif.success(data.message || 'Product updated successfully!');
      await fetchProducts();
      return data.data;
    } catch {
      return null;
    } finally {
      saving.value = false;
    }
  };

  // ─── Delete Product ─────────────────────────────────────────────────────────
  const deleteProduct = async (id: string): Promise<boolean> => {
    deleting.value = true;
    try {
      const { data } = await api.delete<{ success: boolean; message: string }>(
        API_URLS.INVENTORY_BY_ID(id)
      );
      notif.success(data.message || 'Product archived.');
      await fetchProducts();
      return true;
    } catch {
      return false;
    } finally {
      deleting.value = false;
    }
  };

  // ─── Patch Stock ────────────────────────────────────────────────────────────
  const patchStock = async (id: string, stock: number, variantId?: string): Promise<boolean> => {
    try {
      await api.patch(API_URLS.INVENTORY_STOCK(id), { stock, variantId });
      notif.success('Stock updated');
      await fetchProducts();
      return true;
    } catch {
      return false;
    }
  };

  // ─── Pagination Helpers ─────────────────────────────────────────────────────
  const goToPage = async (page: number): Promise<void> => {
    query.value.page = page;
    await fetchProducts();
  };

  const setSearch = async (search: string): Promise<void> => {
    query.value.search = search;
    query.value.page = 1;
    await fetchProducts();
  };

  const setFilter = async (key: 'category' | 'status', value: string): Promise<void> => {
    query.value[key] = value;
    query.value.page = 1;
    await fetchProducts();
  };

  // ─── Build Payload ──────────────────────────────────────────────────────────
  const buildPayload = (form: ProductForm): Record<string, unknown> => {
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      sku: form.sku.trim().toUpperCase() || undefined,
      description: form.description.trim() || undefined,
      category: form.category,
      brand: form.brand.trim() || undefined,
      status: form.status,
      purchasePrice: Number(form.purchasePrice),
      sellingPrice: Number(form.sellingPrice),
      discountedPrice: form.hasDiscountedPrice && form.discountedPrice
        ? Number(form.discountedPrice)
        : undefined,
      stock: Number(form.stock),
      lowStockThreshold: Number(form.lowStockThreshold),
      trackInventory: form.trackInventory,
      hasVariants: form.hasVariants,
      variants: form.hasVariants ? form.variants : [],
      tags: form.tags,
      images: form.images,
      weight: form.weight ? Number(form.weight) : undefined,
      dimensions:
        form.dimensions.l || form.dimensions.w || form.dimensions.h
          ? { l: Number(form.dimensions.l), w: Number(form.dimensions.w), h: Number(form.dimensions.h) }
          : undefined,
    };

    // Remove undefined keys
    Object.keys(payload).forEach((k) => {
      if (payload[k] === undefined) delete payload[k];
    });

    return payload;
  };

  return {
    // State
    products,
    pagination,
    stats,
    loading,
    saving,
    deleting,
    query,
    isEmpty,
    // Actions
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    patchStock,
    goToPage,
    setSearch,
    setFilter,
  };
};
