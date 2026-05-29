import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import { ROUTE_NAMES } from "@/constants";
import { useAuthStore } from "@/stores/auth";

// ─── Route Definitions ────────────────────────────────────────────────────────
const routes: RouteRecordRaw[] = [
  // ── Redirect root ──────────────────────────────────────────────────────────
  {
    path: "/",
    redirect: { name: ROUTE_NAMES.DASHBOARD },
  },

  // ── Auth Routes ────────────────────────────────────────────────────────────
  {
    path: "/login",
    name: ROUTE_NAMES.LOGIN,
    component: () => import("@/views/auth/Login.vue"),
    meta: { requiresGuest: true, title: "Sign In — ve-admin" },
  },
  {
    path: "/register",
    name: ROUTE_NAMES.REGISTER,
    component: () => import("@/views/auth/Register.vue"),
    meta: { requiresGuest: true, title: "Create Account — ve-admin" },
  },
  {
    path: "/forgot-password",
    name: ROUTE_NAMES.FORGOT_PASSWORD,
    component: () => import("@/views/auth/ForgotPassword.vue"),
    meta: { requiresGuest: true, title: "Forgot Password — ve-admin" },
  },
  {
    path: "/reset-password",
    name: ROUTE_NAMES.RESET_PASSWORD,
    component: () => import("@/views/auth/ResetPassword.vue"),
    meta: { requiresGuest: true, title: "Reset Password — ve-admin" },
  },
  {
    path: "/verify-email",
    name: ROUTE_NAMES.VERIFY_EMAIL,
    component: () => import("@/views/auth/VerifyEmail.vue"),
    meta: { title: "Verify Email — ve-admin" },
  },
  {
    path: "/onboard",
    name: ROUTE_NAMES.ONBOARD,
    component: () => import("@/views/auth/Onboard.vue"),
    meta: { requiresGuest: true, title: "Join Team — ve-admin" },
  },

  // ── Dashboard Routes ───────────────────────────────────────────────────────
  {
    path: "/dashboard",
    component: () => import("@/components/layout/DashboardLayout.vue"),
    meta: { requiresAuth: true },
    children: [
      {
        path: "",
        name: ROUTE_NAMES.DASHBOARD,
        component: () => import("@/views/dashboard/Home.vue"),
        meta: {
          requiresAuth: true,
          title: "Dashboard — ve-admin",
          breadcrumb: "Dashboard",
        },
      },
      {
        path: "inventory",
        name: ROUTE_NAMES.INVENTORY,
        component: () => import("@/views/dashboard/Inventory.vue"),
        meta: {
          requiresAuth: true,
          title: "Inventory — ve-admin",
          breadcrumb: "Inventory",
        },
      },
      {
        path: "orders",
        name: ROUTE_NAMES.ORDERS,
        component: () => import("@/views/dashboard/Orders.vue"),
        meta: {
          requiresAuth: true,
          title: "Orders — ve-admin",
          breadcrumb: "Orders",
        },
      },
      {
        path: "customers",
        name: ROUTE_NAMES.CUSTOMERS,
        component: () => import("@/views/dashboard/Customers.vue"),
        meta: {
          requiresAuth: true,
          title: "Customers — ve-admin",
          breadcrumb: "Customers",
        },
      },
      {
        path: "analytics",
        name: ROUTE_NAMES.ANALYTICS,
        component: () => import("@/views/dashboard/Analytics.vue"),
        meta: {
          requiresAuth: true,
          title: "Analytics — ve-admin",
          breadcrumb: "Analytics",
        },
      },
      {
        path: "promotions",
        name: ROUTE_NAMES.PROMOTIONS,
        component: () => import("@/views/dashboard/Promotions.vue"),
        meta: {
          requiresAuth: true,
          title: "Promotions — ve-admin",
          breadcrumb: "Promotions",
        },
      },
      {
        path: "shipping",
        name: ROUTE_NAMES.SHIPPING,
        component: () => import("@/views/dashboard/Shipping.vue"),
        meta: {
          requiresAuth: true,
          title: "Shipping — ve-admin",
          breadcrumb: "Shipping",
        },
      },
      {
        path: "storefront",
        name: ROUTE_NAMES.STOREFRONT,
        component: () => import("@/views/dashboard/Storefront.vue"),
        meta: {
          requiresAuth: true,
          title: "Storefront — ve-admin",
          breadcrumb: "Storefront",
        },
      },
      {
        path: "reviews",
        name: ROUTE_NAMES.REVIEWS,
        component: () => import("@/views/dashboard/Reviews.vue"),
        meta: {
          requiresAuth: true,
          title: "Reviews — ve-admin",
          breadcrumb: "Reviews",
        },
      },
      {
        path: "returns",
        name: ROUTE_NAMES.RETURNS,
        component: () => import("@/views/dashboard/Returns.vue"),
        meta: {
          requiresAuth: true,
          title: "Returns — ve-admin",
          breadcrumb: "Returns",
        },
      },
      {
        path: "finance",
        name: ROUTE_NAMES.FINANCE,
        component: () => import("@/views/dashboard/Finance.vue"),
        meta: {
          requiresAuth: true,
          title: "Finance — ve-admin",
          breadcrumb: "Finance",
        },
      },
      {
        path: "settings",
        name: ROUTE_NAMES.SETTINGS,
        component: () => import("@/views/dashboard/Settings.vue"),
        meta: {
          requiresAuth: true,
          title: "Settings — ve-admin",
          breadcrumb: "Settings",
        },
      },
    ],
  },

  // ── 404 ─────────────────────────────────────────────────────────────────────
  {
    path: "/:pathMatch(.*)*",
    redirect: { name: ROUTE_NAMES.DASHBOARD },
  },
];

// ─── Router ───────────────────────────────────────────────────────────────────
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0, behavior: "smooth" }),
});

// ─── Navigation Guards ────────────────────────────────────────────────────────
router.beforeEach(async (to) => {
  const authStore = useAuthStore();

  // Update document title
  if (to.meta.title) {
    document.title = to.meta.title as string;
  }

  // Special handling for onboard with invite token — clear any existing auth
  if (to.name === ROUTE_NAMES.ONBOARD && to.query.token) {
    authStore.$reset();
    authStore.markInitialized();
    return true;
  }

  // Initialize session on first navigation
  if (!authStore.initialized) {
    await authStore.initialize();
  }

  const isAuthenticated = authStore.isAuthenticated;

  // Require auth → redirect to login
  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: ROUTE_NAMES.LOGIN, query: { redirect: to.fullPath } };
  }

  // Guest-only pages → redirect to dashboard if logged in
  if (to.meta.requiresGuest && isAuthenticated) {
    return { name: ROUTE_NAMES.DASHBOARD };
  }

  return true;
});

export default router;
