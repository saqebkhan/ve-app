// ─── Route Names ─────────────────────────────────────────────────────────────
export const ROUTE_NAMES = {
  // Auth
  LOGIN: 'Login',
  REGISTER: 'Register',
  FORGOT_PASSWORD: 'ForgotPassword',
  RESET_PASSWORD: 'ResetPassword',
  VERIFY_EMAIL: 'VerifyEmail',
  ONBOARD: 'Onboard',

  // Dashboard
  DASHBOARD: 'Dashboard',
  INVENTORY: 'Inventory',
  ORDERS: 'Orders',
  CUSTOMERS: 'Customers',
  ANALYTICS: 'Analytics',
  PROMOTIONS: 'Promotions',
  SHIPPING: 'Shipping',
  STOREFRONT: 'Storefront',
  REVIEWS: 'Reviews',
  RETURNS: 'Returns',
  FINANCE: 'Finance',
  SETTINGS: 'Settings',
} as const;

export type RouteName = (typeof ROUTE_NAMES)[keyof typeof ROUTE_NAMES];

// ─── API URLs ─────────────────────────────────────────────────────────────────
export const API_URLS = {
  // Auth
  REGISTER: '/api/auth/register',
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  REFRESH: '/api/auth/refresh',
  ME: '/api/auth/me',
  UPDATE_PROFILE: '/api/auth/me',
  VERIFY_EMAIL: '/api/auth/verify-email',
  FORGOT_PASSWORD: '/api/auth/forgot-password',
  RESET_PASSWORD: '/api/auth/reset-password',
  RESEND_VERIFICATION: '/api/auth/resend-verification',

  // Inventory
  INVENTORY: '/api/inventory',
  INVENTORY_BY_ID: (id: string) => `/api/inventory/${id}`,
  INVENTORY_STOCK: (id: string) => `/api/inventory/${id}/stock`,

  // Team / Invitations
  TEAM_INVITE: '/api/team/invite',
  TEAM_MEMBERS: '/api/team/members',
  TEAM_MEMBER_BY_ID: (id: string) => `/api/team/members/${id}`,
  TEAM_INVITE_BY_ID: (id: string) => `/api/team/invite/${id}`,
  TEAM_VERIFY_INVITE: '/api/team/invite/verify',
  TEAM_ONBOARD: '/api/team/invite/onboard',

  // Activity Log
  ACTIVITY_LOGS: '/api/activity/logs',
} as const;

// ─── Categories ───────────────────────────────────────────────────────────────
export const PRODUCT_CATEGORIES = [
  'Electronics',
  'Clothing',
  'Food & Beverage',
  'Home & Garden',
  'Beauty',
  'Sports',
  'Books',
  'Other',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

// ─── Product Status ───────────────────────────────────────────────────────────
export const PRODUCT_STATUSES = ['active', 'draft', 'archived'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

// ─── Currency ─────────────────────────────────────────────────────────────────
export const DEFAULT_CURRENCY = 'INR';
export const CURRENCY_SYMBOL = '₹';

// ─── Nav Links ────────────────────────────────────────────────────────────────
export interface NavLink {
  name: RouteName;
  label: string;
  icon: string;
  implemented: boolean;
}

export const NAV_LINKS: NavLink[] = [
  { name: ROUTE_NAMES.DASHBOARD,   label: 'Dashboard',  icon: '📊', implemented: true },
  { name: ROUTE_NAMES.INVENTORY,   label: 'Inventory',  icon: '📦', implemented: true },
  { name: ROUTE_NAMES.ORDERS,      label: 'Orders',     icon: '🛍️',  implemented: false },
  { name: ROUTE_NAMES.CUSTOMERS,   label: 'Customers',  icon: '👥', implemented: false },
  { name: ROUTE_NAMES.ANALYTICS,   label: 'Analytics',  icon: '📈', implemented: false },
  { name: ROUTE_NAMES.PROMOTIONS,  label: 'Promotions', icon: '🎁', implemented: false },
  { name: ROUTE_NAMES.SHIPPING,    label: 'Shipping',   icon: '🚚', implemented: false },
  { name: ROUTE_NAMES.STOREFRONT,  label: 'Storefront', icon: '🏪', implemented: false },
  { name: ROUTE_NAMES.REVIEWS,     label: 'Reviews',    icon: '⭐', implemented: false },
  { name: ROUTE_NAMES.RETURNS,     label: 'Returns',    icon: '🔄', implemented: false },
  { name: ROUTE_NAMES.FINANCE,     label: 'Finance',    icon: '💰', implemented: false },
  { name: ROUTE_NAMES.SETTINGS,    label: 'Settings',   icon: '⚙️',  implemented: true },
];
