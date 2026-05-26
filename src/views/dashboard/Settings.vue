<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';
import { API_URLS } from '@/constants';
import api from '@/services/api';
import BaseModal from '@/components/common/BaseModal.vue';
import BaseConfirm from '@/components/common/BaseConfirm.vue';
import type { User, Invitation, ActivityLog } from '@/types';

const authStore = useAuthStore();
const notification = useNotificationStore();

// Current User Role checking helpers
const currentUser = computed(() => authStore.user);
const isOwner = computed(() => currentUser.value?.role === 'owner' || currentUser.value?.role === 'seller');
const isAdmin = computed(() => currentUser.value?.role === 'admin');
const isEditor = computed(() => currentUser.value?.role === 'editor');
const isViewer = computed(() => currentUser.value?.role === 'viewer');
const canInvite = computed(() => isOwner.value || isAdmin.value);
const canManage = computed(() => isOwner.value); // Only owner can remove/revoke

// Tabs State
const activeTab = ref<'profile' | 'store' | 'team' | 'activity'>('profile');

// File input reference
const fileInput = ref<HTMLInputElement | null>(null);

const handleLogoUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    notification.error('File size too large. Max is 2MB.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    shopLogo.value = e.target?.result as string;
  };
  reader.readAsDataURL(file);
};

const removeLogo = () => {
  shopLogo.value = '';
};

// ─── Activity Log State ───
const activityLogs = ref<ActivityLog[]>([]);
const loadingLogs = ref(false);
const filterAction = ref<'all' | 'product_created' | 'product_updated' | 'product_deleted'>('all');
const logPagination = ref({ page: 1, totalPages: 1, total: 0 });
const expandedLogs = ref<Record<string, boolean>>({});

const fetchLogs = async (page = 1, append = false) => {
  loadingLogs.value = true;
  try {
    const { data } = await api.get<{
      success: boolean;
      data: { logs: ActivityLog[]; pagination: { total: number; page: number; limit: number; totalPages: number } };
    }>(`${API_URLS.ACTIVITY_LOGS}?page=${page}&limit=10`);

    if (data.success) {
      if (append) {
        activityLogs.value = [...activityLogs.value, ...data.data.logs];
      } else {
        activityLogs.value = data.data.logs;
      }
      logPagination.value = data.data.pagination;
    }
  } catch (err) {
    console.error('Failed to load activity logs', err);
  } finally {
    loadingLogs.value = false;
  }
};

const handleLoadMoreLogs = () => {
  if (logPagination.value.page < logPagination.value.totalPages) {
    const nextPage = logPagination.value.page + 1;
    fetchLogs(nextPage, true);
  }
};

const filteredLogs = computed(() => {
  if (filterAction.value === 'all') return activityLogs.value;
  return activityLogs.value.filter(log => log.action === filterAction.value);
});

const toggleLogExpand = (id: string) => {
  expandedLogs.value[id] = !expandedLogs.value[id];
};

const timeAgo = (dateStr: string) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return 'just now';
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatFieldName = (field: string) => {
  const names: Record<string, string> = {
    name: 'Product Name',
    sku: 'SKU Identifier',
    sellingPrice: 'Selling Price',
    purchasePrice: 'Purchase Price',
    stock: 'Stock Count',
    status: 'Publishing Status',
    category: 'Product Category',
    brand: 'Product Brand',
  };
  return names[field] || field;
};

const formatFieldValue = (field: string, val: any) => {
  if (val === null || val === undefined) return 'None';
  if (field === 'sellingPrice' || field === 'purchasePrice') {
    return `₹${Number(val).toLocaleString('en-IN')}`;
  }
  return String(val);
};

// ─── Profile Form ───
const profileName = ref('');
const profileEmail = ref('');
const savingProfile = ref(false);

// ─── Store Form ───
const shopName = ref('');
const shopLogo = ref('');
const savingStore = ref(false);

// ─── Team / Members State ───
const teamMembers = ref<User[]>([]);
const pendingInvites = ref<Invitation[]>([]);
const loadingTeam = ref(false);

// ─── Invite Member Modal State ───
const showInviteModal = ref(false);
const inviteEmail = ref('');
const inviteRole = ref<'admin' | 'editor' | 'viewer'>('viewer');
const sendingInvite = ref(false);

// ─── Confirmations State ───
const showRemoveConfirm = ref(false);
const memberToRemove = ref<User | null>(null);
const removingMember = ref(false);

const showRevokeConfirm = ref(false);
const inviteToRevoke = ref<Invitation | null>(null);
const revokingInvite = ref(false);

// Initialize fields from authStore user
const initFields = () => {
  if (currentUser.value) {
    profileName.value = currentUser.value.name;
    profileEmail.value = currentUser.value.email;
    shopName.value = currentUser.value.shopName;
    shopLogo.value = currentUser.value.shopLogo || '';
  }
};

onMounted(() => {
  initFields();
  fetchLogs();
  if (canInvite.value || isViewer.value || isEditor.value) {
    fetchTeamData();
  }
});

// Watch for user data loads/changes
onMounted(() => {
  authStore.fetchMe().then(() => {
    initFields();
  });
});

// Update profile endpoint call
const handleUpdateProfile = async () => {
  if (!profileName.value.trim()) {
    notification.error('Name field cannot be empty.');
    return;
  }
  savingProfile.value = true;
  try {
    const { data } = await api.patch<{ success: boolean; data: User; message: string }>(
      API_URLS.UPDATE_PROFILE,
      { name: profileName.value.trim(), email: profileEmail.value.trim() }
    );
    if (data.success) {
      authStore.user = data.data;
      notification.success('Success', 'Your profile details have been updated.');
    }
  } catch (err: any) {
    notification.error(err.response?.data?.message || 'Failed to update profile.');
  } finally {
    savingProfile.value = false;
  }
};

// Update store details endpoint call
const handleUpdateStore = async () => {
  if (!shopName.value.trim()) {
    notification.error('Store name cannot be empty.');
    return;
  }
  savingStore.value = true;
  try {
    const { data } = await api.patch<{ success: boolean; data: User; message: string }>(
      API_URLS.UPDATE_PROFILE,
      { shopName: shopName.value.trim(), shopLogo: shopLogo.value.trim() }
    );
    if (data.success) {
      authStore.user = data.data;
      notification.success('Success', 'Store configurations updated.');
    }
  } catch (err: any) {
    notification.error(err.response?.data?.message || 'Failed to update store configurations.');
  } finally {
    savingStore.value = false;
  }
};

// Fetch members and invitations
const fetchTeamData = async () => {
  loadingTeam.value = true;
  try {
    const { data } = await api.get<{
      success: boolean;
      data: { members: User[]; pendingInvites: Invitation[] };
    }>(API_URLS.TEAM_MEMBERS);
    if (data.success) {
      teamMembers.value = data.data.members;
      pendingInvites.value = data.data.pendingInvites;
    }
  } catch (err: any) {
    console.error('Failed to load team data', err);
  } finally {
    loadingTeam.value = false;
  }
};

// Send team member invitation
const handleSendInvite = async () => {
  if (!inviteEmail.value.trim()) {
    notification.error('Email field is required.');
    return;
  }
  sendingInvite.value = true;
  try {
    const { data } = await api.post<{ success: boolean; message: string }>(
      API_URLS.TEAM_INVITE,
      { email: inviteEmail.value.trim().toLowerCase(), role: inviteRole.value }
    );
    if (data.success) {
      notification.success('Invite Sent', data.message);
      showInviteModal.value = false;
      inviteEmail.value = '';
      inviteRole.value = 'viewer';
      fetchTeamData();
    }
  } catch (err: any) {
    notification.error(err.response?.data?.message || 'Failed to send invitation.');
  } finally {
    sendingInvite.value = false;
  }
};

// Open Revoke dialog
const confirmRevokeInvite = (invite: Invitation) => {
  inviteToRevoke.value = invite;
  showRevokeConfirm.value = true;
};

// Revoke invitation call
const handleRevokeInvite = async () => {
  if (!inviteToRevoke.value) return;
  revokingInvite.value = true;
  try {
    const { data } = await api.delete<{ success: boolean; message: string }>(
      API_URLS.TEAM_INVITE_BY_ID(inviteToRevoke.value._id)
    );
    if (data.success) {
      notification.success('Revoked', data.message);
      showRevokeConfirm.value = false;
      inviteToRevoke.value = null;
      fetchTeamData();
    }
  } catch (err: any) {
    notification.error(err.response?.data?.message || 'Failed to revoke invitation.');
  } finally {
    revokingInvite.value = false;
  }
};

// Open Remove Member dialog
const confirmRemoveMember = (member: User) => {
  memberToRemove.value = member;
  showRemoveConfirm.value = true;
};

// Remove member call
const handleRemoveMember = async () => {
  if (!memberToRemove.value) return;
  removingMember.value = true;
  try {
    const { data } = await api.delete<{ success: boolean; message: string }>(
      API_URLS.TEAM_MEMBER_BY_ID(memberToRemove.value._id)
    );
    if (data.success) {
      notification.success('Removed', data.message);
      showRemoveConfirm.value = false;
      memberToRemove.value = null;
      fetchTeamData();
    }
  } catch (err: any) {
    notification.error(err.response?.data?.message || 'Failed to remove member.');
  } finally {
    removingMember.value = false;
  }
};

// Date formatter helper
const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    
    <!-- Title Section -->
    <div class="mb-8">
      <h1 class="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Store Settings</h1>
      <p class="text-slate-500 dark:text-slate-400 font-medium text-sm">
        Manage your profile, adjust store-wide settings, and collaborate with your team.
      </p>
    </div>

    <!-- Tabbed Selector -->
    <div class="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/60 rounded-2xl w-fit mb-8 border border-slate-200/50 dark:border-slate-700/30">
      <button 
        @click="activeTab = 'profile'"
        :class="['px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all', activeTab === 'profile' ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-md shadow-slate-200/50 dark:shadow-none' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200']">
        👤 Profile Details
      </button>
      <button 
        @click="activeTab = 'store'"
        :class="['px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all', activeTab === 'store' ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-md shadow-slate-200/50 dark:shadow-none' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200']">
        🏪 Store Details
      </button>
      <button 
        @click="activeTab = 'team'"
        :class="['px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all', activeTab === 'team' ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-md shadow-slate-200/50 dark:shadow-none' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200']">
        👥 Team Settings
      </button>
      <button 
        @click="activeTab = 'activity'"
        :class="['px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all', activeTab === 'activity' ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-md shadow-slate-200/50 dark:shadow-none' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200']">
        📋 Activity Log
      </button>
    </div>

    <!-- Active Panel Section -->
    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-xl shadow-slate-100/50 dark:shadow-none">
      
      <!-- PROFILE TAB -->
      <div v-if="activeTab === 'profile'" class="max-w-xl">
        <h2 class="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">My Profile</h2>
        <p class="text-slate-500 dark:text-slate-400 text-xs font-medium mb-6">Manage your contact name and logins</p>

        <form @submit.prevent="handleUpdateProfile" class="space-y-5">
          <div>
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Full Name</label>
            <input v-model="profileName" type="text"
              class="w-full px-4 py-3 rounded-2xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
          </div>

          <div>
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Email Address</label>
            <input v-model="profileEmail" type="email"
              class="w-full px-4 py-3 rounded-2xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
          </div>

          <div>
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Role Badge</label>
            <div class="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full">
              <span class="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
              <span class="text-xs font-black capitalize text-slate-700 dark:text-slate-300 tracking-wider">
                {{ currentUser?.role }}
              </span>
            </div>
          </div>

          <button type="submit" :disabled="savingProfile"
            class="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
            {{ savingProfile ? 'Saving...' : 'Save Profile Changes' }}
          </button>
        </form>
      </div>

      <!-- STORE DETAILS TAB -->
      <div v-else-if="activeTab === 'store'" class="max-w-xl">
        <h2 class="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Store Configuration</h2>
        <p class="text-slate-500 dark:text-slate-400 text-xs font-medium mb-6">Manage brand identities and storefront identifiers</p>

        <!-- Unauthorized disclaimer -->
        <div v-if="!isOwner" class="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-2xl flex items-start gap-3 mb-6">
          <span class="text-lg">⚠️</span>
          <div>
            <p class="text-xs font-bold text-amber-800 dark:text-amber-400 mb-0.5">Read-Only Mode</p>
            <p class="text-[11px] text-amber-700 dark:text-amber-500 leading-normal">
              You are signed in as an <strong>{{ currentUser?.role }}</strong>. Only the store owner account is authorized to modify shop parameters or branding layouts.
            </p>
          </div>
        </div>

        <form @submit.prevent="handleUpdateStore" class="space-y-5">
          <div>
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Store Shop Name</label>
            <input v-model="shopName" type="text" :disabled="!isOwner"
              class="w-full px-4 py-3 rounded-2xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:opacity-60 disabled:cursor-not-allowed" />
          </div>

          <div>
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Store Shop Logo</label>
            
            <div class="flex items-center gap-6 p-5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl">
              <div class="w-20 h-20 rounded-2xl border border-slate-300 dark:border-slate-650 object-cover overflow-hidden bg-white dark:bg-slate-900 flex items-center justify-center shrink-0 shadow-inner">
                <img v-if="shopLogo" :src="shopLogo" alt="Store Logo" class="w-full h-full object-cover" />
                <span v-else class="text-3xl text-slate-300 dark:text-slate-600">🏪</span>
              </div>
              
              <div class="space-y-2 flex-1" v-if="isOwner">
                <div class="flex gap-2">
                  <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleLogoUpload" />
                  <button type="button" @click="fileInput?.click()"
                    class="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold rounded-xl transition-all shadow-sm">
                    Choose File
                  </button>
                  <button v-if="shopLogo" type="button" @click="removeLogo"
                    class="px-4 py-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-650 dark:text-red-400 hover:bg-red-105 dark:hover:bg-red-900/40 text-xs font-bold rounded-xl transition-all">
                    Remove
                  </button>
                </div>
                <p class="text-[10px] text-slate-400 font-medium">PNG, JPG or SVG formats supported. Max size 2MB.</p>
              </div>
              <div v-else class="text-xs text-slate-450 italic">
                Uploading logo is only available to the store owner.
              </div>
            </div>
          </div>

          <button v-if="isOwner" type="submit" :disabled="savingStore"
            class="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
            {{ savingStore ? 'Saving...' : 'Save Store Details' }}
          </button>
        </form>
      </div>

      <!-- TEAM SETTINGS TAB -->
      <div v-else-if="activeTab === 'team'">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 class="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Collaborative Members</h2>
            <p class="text-slate-500 dark:text-slate-400 text-xs font-medium">Manage team invitations and role allocations</p>
          </div>
          
          <button v-if="canInvite" @click="showInviteModal = true"
            class="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.15em] shadow-lg shadow-primary-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2">
            <span>Invite Team Member</span>
            <span class="text-sm leading-none">+</span>
          </button>
        </div>

        <!-- LOADING STATE -->
        <div v-if="loadingTeam" class="py-12 flex justify-center">
          <div class="w-10 h-10 border-4 border-slate-100 border-t-primary-600 rounded-full animate-spin" />
        </div>

        <div v-else class="space-y-10">
          
          <!-- TEAM ROSTER LIST -->
          <div>
            <h3 class="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">Active Team ({{ teamMembers.length }})</h3>
            
            <div class="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-800/10">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/30">
                    <th class="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Name</th>
                    <th class="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Email</th>
                    <th class="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Access Role</th>
                    <th class="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Joined Date</th>
                    <th v-if="isOwner" class="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 text-right">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-150 dark:divide-slate-850">
                  <tr v-for="member in teamMembers" :key="member._id" class="hover:bg-slate-100/20 dark:hover:bg-slate-800/20 transition-all">
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-950/40 text-primary-700 dark:text-primary-400 flex items-center justify-center font-bold text-xs">
                          {{ member.name.charAt(0).toUpperCase() }}
                        </div>
                        <span class="text-sm font-bold text-slate-800 dark:text-slate-200">{{ member.name }}</span>
                      </div>
                    </td>
                    <td class="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 font-medium">{{ member.email }}</td>
                    <td class="px-6 py-4">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                        :class="[
                          member.role === 'owner' || member.role === 'seller' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' :
                          member.role === 'admin' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                          member.role === 'editor' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-450'
                        ]">
                        {{ member.role === 'seller' ? 'owner' : member.role }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-sm text-slate-400 dark:text-slate-500 font-medium">{{ formatDate(member.createdAt) }}</td>
                    <td v-if="isOwner" class="px-6 py-4 text-right">
                      <button v-if="member._id !== currentUser?._id && member.role !== 'owner' && member.role !== 'seller'" 
                        @click="confirmRemoveMember(member)"
                        class="text-xs font-bold text-red-500 hover:text-red-700 transition-colors bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/30 px-3 py-1.5 rounded-xl border border-red-200/30 dark:border-red-900/30">
                        Remove
                      </button>
                      <span v-else class="text-xs text-slate-400 font-medium italic">Creator</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- PENDING INVITATIONS LIST -->
          <div>
            <h3 class="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">Pending invitations ({{ pendingInvites.length }})</h3>
            
            <div v-if="pendingInvites.length === 0" class="border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center bg-slate-50/20 dark:bg-slate-900/10">
              <span class="text-3xl mb-3 block">📩</span>
              <p class="text-sm font-bold text-slate-700 dark:text-slate-300">No pending invitations</p>
              <p class="text-xs text-slate-450 mt-1">Invited team members who haven't completed onboarding will show up here.</p>
            </div>

            <div v-else class="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-800/10">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/30">
                    <th class="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Email Address</th>
                    <th class="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Invited Role</th>
                    <th class="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Expires At</th>
                    <th class="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Status</th>
                    <th v-if="canManage" class="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 text-right">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-150 dark:divide-slate-850">
                  <tr v-for="invite in pendingInvites" :key="invite._id" class="hover:bg-slate-100/20 dark:hover:bg-slate-800/20 transition-all">
                    <td class="px-6 py-4 text-sm font-bold text-slate-800 dark:text-slate-200">{{ invite.email }}</td>
                    <td class="px-6 py-4">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {{ invite.role }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-sm text-slate-450 dark:text-slate-500 font-medium">{{ formatDate(invite.expiresAt) }}</td>
                    <td class="px-6 py-4">
                      <span class="inline-flex items-center gap-1.5 text-xs text-amber-500 font-bold">
                        <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Pending
                      </span>
                    </td>
                    <td v-if="canManage" class="px-6 py-4 text-right">
                      <button @click="confirmRevokeInvite(invite)"
                        class="text-xs font-bold text-rose-500 hover:text-rose-700 transition-colors bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 px-3 py-1.5 rounded-xl border border-rose-200/30 dark:border-rose-900/30">
                        Revoke
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      <!-- COLLABORATIVE ACTIVITY LOG TAB -->
      <div v-else-if="activeTab === 'activity'">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 class="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-1">Collaborative Activity Feed</h2>
            <p class="text-slate-500 dark:text-slate-400 text-xs font-medium">Audit logs of operations performed on products in real-time.</p>
          </div>

          <!-- Action Filters -->
          <div class="flex flex-wrap gap-1.5 p-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/30">
            <button 
              v-for="flt in ([
                { label: 'All Operations', value: 'all' },
                { label: 'Creations', value: 'product_created' },
                { label: 'Edits', value: 'product_updated' },
                { label: 'Deletions', value: 'product_deleted' }
              ] as const)"
              :key="flt.value"
              @click="filterAction = flt.value"
              :class="[
                'px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all',
                filterAction === flt.value 
                  ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm' 
                  : 'text-slate-500 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200'
              ]"
            >
              {{ flt.label }}
            </button>
          </div>
        </div>

        <!-- Timeline activities -->
        <div v-if="filteredLogs.length === 0" class="flex flex-col items-center justify-center py-16 text-center">
          <div class="w-16 h-16 bg-slate-50 dark:bg-slate-800/40 rounded-full flex items-center justify-center text-2xl mb-4 border border-slate-100 dark:border-slate-800">
            📋
          </div>
          <h3 class="text-sm font-bold text-slate-700 dark:text-slate-350">No operations recorded</h3>
          <p class="text-xs text-slate-400 mt-1">Activities will show up here once team members perform write actions.</p>
        </div>

        <div v-else class="relative pl-6 border-l-2 border-slate-100 dark:border-slate-800 space-y-6 ml-2.5">
          <div v-for="log in filteredLogs" :key="log._id" class="relative group">
            
            <div class="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 bg-white dark:bg-slate-900 flex items-center justify-center"
              :class="[
                log.action === 'product_created' ? 'border-emerald-500' :
                log.action === 'product_deleted' ? 'border-red-500' :
                'border-amber-500'
              ]">
              <span class="w-1.5 h-1.5 rounded-full" 
                :class="[
                  log.action === 'product_created' ? 'bg-emerald-500' :
                  log.action === 'product_deleted' ? 'bg-red-500' :
                  'bg-amber-500'
                ]" />
            </div>

            <div class="bg-slate-50/50 dark:bg-slate-800/10 border border-slate-150 dark:border-slate-850 hover:border-slate-255 dark:hover:border-slate-800 rounded-2xl p-5 transition-all">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <p class="text-sm text-slate-700 dark:text-slate-300 font-medium">
                    <span class="font-black text-slate-950 dark:text-white">{{ log.userName }}</span>
                    <span class="text-xs text-slate-400 dark:text-slate-500 capitalize px-2 py-0.5 ml-1.5 mr-1 bg-slate-200/50 dark:bg-slate-800 border border-slate-250/20 dark:border-slate-700/50 rounded-full font-bold">
                      {{ (log.user as any)?.role || 'Member' }}
                    </span>
                    
                    <span v-if="log.action === 'product_created'">
                      added product
                      <span class="font-bold text-slate-900 dark:text-white bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                        {{ log.details.productName }}
                      </span>
                    </span>
                    
                    <span v-else-if="log.action === 'product_deleted'">
                      deleted product
                      <span class="font-bold text-slate-900 dark:text-white bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-lg border border-red-100 dark:border-red-900/30">
                        {{ log.details.productName }}
                      </span>
                    </span>

                    <span v-else>
                      updated product
                      <span class="font-bold text-slate-900 dark:text-white bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-lg border border-amber-100 dark:border-amber-900/30">
                        {{ log.details.productName }}
                      </span>
                    </span>
                  </p>
                  
                  <p v-if="log.details.sku" class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                    SKU: {{ log.details.sku }}
                  </p>
                </div>

                <span class="text-xs text-slate-400 dark:text-slate-500 font-medium shrink-0">
                  {{ timeAgo(log.createdAt) }}
                </span>
              </div>

              <!-- Changes diff detail -->
              <div v-if="log.action === 'product_updated' && log.details.changes && log.details.changes.length > 0" class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button @click="toggleLogExpand(log._id)" 
                  class="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-primary-650 transition-colors">
                  <span>{{ expandedLogs[log._id] ? 'Hide details' : 'Inspect change details' }}</span>
                  <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 transition-transform duration-200" :class="expandedLogs[log._id] ? 'rotate-180' : ''">
                    <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd"/>
                  </svg>
                </button>

                <Transition
                  enter-active-class="transition-all duration-200"
                  enter-from-class="opacity-0 -translate-y-2"
                  enter-to-class="opacity-100 translate-y-0"
                >
                  <div v-if="expandedLogs[log._id]" class="mt-3 overflow-hidden border border-slate-200/60 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/60 p-3.5 space-y-2">
                    <div v-for="change in log.details.changes" :key="change.field" class="flex flex-col sm:flex-row sm:items-center justify-between text-xs py-1 border-b border-slate-100/50 dark:border-slate-800 last:border-0 gap-1.5">
                      <span class="font-bold text-slate-600 dark:text-slate-400">{{ formatFieldName(change.field) }}</span>
                      <div class="flex items-center gap-2 font-medium">
                        <span class="px-2 py-0.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded border border-rose-100 dark:border-rose-900/20 line-through">
                          {{ formatFieldValue(change.field, change.oldVal) }}
                        </span>
                        <span class="text-slate-400">➔</span>
                        <span class="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded border border-emerald-100 dark:border-emerald-900/20">
                          {{ formatFieldValue(change.field, change.newVal) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </Transition>
              </div>

            </div>
          </div>

          <!-- Pagination load more -->
          <div v-if="logPagination.page < logPagination.totalPages" class="pt-4 flex justify-center">
            <button @click="handleLoadMoreLogs" :disabled="loadingLogs"
              class="px-6 py-2.5 border border-slate-250 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-400 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all hover:scale-102 flex items-center gap-2">
              <span v-if="loadingLogs" class="w-3.5 h-3.5 border-2 border-slate-350 border-t-slate-600 rounded-full animate-spin" />
              <span>{{ loadingLogs ? 'Loading Operations...' : 'Load previous operations' }}</span>
            </button>
          </div>
        </div>
      </div>

    </div>

    <!-- INVITE TEAM MEMBER MODAL -->
    <BaseModal v-model="showInviteModal" title="Invite Collaborator" max-width="max-w-md">
      <form @submit.prevent="handleSendInvite" class="space-y-5">
        <div>
          <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Member Email Address</label>
          <input v-model="inviteEmail" type="email" placeholder="collaborator@example.com" required
            class="w-full px-4 py-3 rounded-2xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
        </div>

        <div>
          <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Assigned Access Role</label>
          <div class="grid grid-cols-3 gap-2.5">
            <button v-for="roleOption in (['viewer', 'editor', 'admin'] as const)" :key="roleOption" type="button"
              @click="inviteRole = roleOption"
              :class="[
                'px-4 py-3 rounded-2xl border text-xs font-black capitalize tracking-wider transition-all',
                inviteRole === roleOption 
                  ? 'bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-950/30 dark:border-primary-500 dark:text-primary-400 shadow-md shadow-primary-500/5' 
                  : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
              ]">
              {{ roleOption }}
            </button>
          </div>

          <!-- Role Explanations -->
          <div class="mt-4 p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-850 rounded-2xl text-[11px] leading-normal text-slate-500 dark:text-slate-400">
            <p v-if="inviteRole === 'viewer'">
              🔒 <strong>Viewer</strong>: Read-only access across store analytics, dashboard updates, and catalogs. No authorization to add/edit/delete items or configurations.
            </p>
            <p v-if="inviteRole === 'editor'">
              ✍️ <strong>Editor</strong>: Authorized to add, modify, and delete inventory catalog listings. Cannot alter general store branding settings or team rosters.
            </p>
            <p v-if="inviteRole === 'admin'">
              🛡️ <strong>Admin</strong>: Complete dashboard controls. Authorized to list/manage products, alter settings configurations, and invite/manage viewer/editor team members.
            </p>
          </div>
        </div>

        <div class="pt-4 flex justify-end gap-3 border-t border-slate-150 dark:border-slate-800">
          <button type="button" @click="showInviteModal = false"
            class="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
            Cancel
          </button>
          <button type="submit" :disabled="sendingInvite"
            class="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary-500/20 disabled:opacity-60 disabled:cursor-not-allowed">
            {{ sendingInvite ? 'Inviting...' : 'Send Invitation' }}
          </button>
        </div>
      </form>
    </BaseModal>

    <!-- CONFIRM REMOVE MEMBER -->
    <BaseConfirm
      v-model="showRemoveConfirm"
      title="Remove Team Member?"
      :message="`Are you absolutely sure you want to revoke store access for ${memberToRemove?.name}? They will immediately lose access to this dashboard.`"
      confirm-text="Remove Member"
      type="danger"
      :loading="removingMember"
      @confirm="handleRemoveMember"
      @cancel="memberToRemove = null"
    />

    <!-- CONFIRM REVOKE INVITATION -->
    <BaseConfirm
      v-model="showRevokeConfirm"
      title="Revoke Invitation?"
      :message="`Are you sure you want to revoke the pending invitation sent to ${inviteToRevoke?.email}? The onboarding link will immediately become invalid.`"
      confirm-text="Revoke Invite"
      type="warning"
      :loading="revokingInvite"
      @confirm="handleRevokeInvite"
      @cancel="inviteToRevoke = null"
    />

  </div>
</template>
