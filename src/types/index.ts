// ─── User ─────────────────────────────────────────────────────────────────────
export interface User {
  _id: string;
  name: string;
  email: string;
  shopName: string;
  shopLogo?: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer' | 'seller';
  sellerId?: string;
  isEmailVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Team / Invitations ───────────────────────────────────────────────────────
export interface Invitation {
  _id: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  token: string;
  invitedBy: string | User;
  sellerId: string;
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Activity Logs ────────────────────────────────────────────────────────────
export interface ActivityChange {
  field: string;
  oldVal: any;
  newVal: any;
}

export interface ActivityLog {
  _id: string;
  sellerId: string;
  user: string | User;
  userName: string;
  action: 'product_created' | 'product_updated' | 'product_deleted';
  details: {
    productId: string;
    productName: string;
    sku?: string;
    changes?: ActivityChange[];
  };
  createdAt: string;
}

export interface OnboardForm {
  name: string;
  password: string;
  confirmPassword: string;
}

// ─── Product Variant ──────────────────────────────────────────────────────────
export interface IProductVariant {
  _id?: string;
  size?: string;
  color?: string;
  stock: number;
  sku?: string;
  purchasePrice?: number;
  sellingPrice?: number;
}

// ─── Product Dimensions ───────────────────────────────────────────────────────
export interface IProductDimensions {
  l: number;
  w: number;
  h: number;
}

// ─── Product ──────────────────────────────────────────────────────────────────
export interface Product {
  _id: string;
  sellerId: string;
  name: string;
  sku: string;
  description?: string;
  category: string;
  brand?: string;
  images: string[];

  // Pricing
  purchasePrice: number;
  sellingPrice: number;
  discountedPrice?: number;
  currency: string;

  // Stock
  stock: number;
  lowStockThreshold: number;
  trackInventory: boolean;

  // Variants
  hasVariants: boolean;
  variants: IProductVariant[];

  // Metadata
  status: 'active' | 'draft' | 'archived';
  tags: string[];
  weight?: number;
  dimensions?: IProductDimensions;

  createdAt: string;
  updatedAt: string;
}

// ─── Product Form ─────────────────────────────────────────────────────────────
export interface ProductForm {
  name: string;
  sku: string;
  description: string;
  category: string;
  brand: string;
  status: 'active' | 'draft' | 'archived';

  purchasePrice: number | string;
  sellingPrice: number | string;
  discountedPrice: number | string;
  hasDiscountedPrice: boolean;

  stock: number | string;
  lowStockThreshold: number | string;
  trackInventory: boolean;

  hasVariants: boolean;
  variants: IProductVariant[];

  weight: number | string;
  dimensions: IProductDimensions;

  tags: string[];
  images: string[];
}

// ─── Notification ─────────────────────────────────────────────────────────────
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  dismissing?: boolean;
}

// ─── API Response ─────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ─── Inventory Stats ──────────────────────────────────────────────────────────
export interface InventoryStats {
  total: number;
  totalStock: number;
  drafts: number;
  outOfStock: number;
  lowStock: number;
}

// ─── Paginated Product Response ───────────────────────────────────────────────
export interface ProductListResponse {
  products: Product[];
  pagination: Pagination;
  stats: InventoryStats;
}

// ─── Form Errors ──────────────────────────────────────────────────────────────
export type FormErrors<T> = Partial<Record<keyof T, string>>;

// ─── Auth Forms ───────────────────────────────────────────────────────────────
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  shopName: string;
}

export interface ForgotPasswordForm {
  email: string;
}

export interface ResetPasswordForm {
  password: string;
  confirmPassword: string;
}
