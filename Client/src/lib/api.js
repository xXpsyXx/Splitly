// ✅ Determine API base URL
let API_URL = import.meta.env.VITE_API_URL;

// If missing (local dev or preview), detect environment
if (!API_URL) {
  const isBrowser = typeof window !== "undefined" && window?.location;

  if (isBrowser && window.location.hostname.includes("vercel.app")) {
    // On Vercel, call Railway backend
    API_URL = "https://splitly-production.up.railway.app/api";
  } else {
    // Local dev → your local backend OR Vercel serverless API
    API_URL = "";
  }
}

// Normalize API_URL: remove trailing /api to avoid duplicated paths when endpoints include /api
if (API_URL && API_URL.endsWith("/api")) {
  API_URL = API_URL.replace(/\/api\/?$/, "");
}

// ✅ Add token getter
const getAuthToken = () => localStorage.getItem("token");

// cache helper
import { cacheService } from "./cache";

// ✅ General API call wrapper
const apiCall = async (endpoint, options = {}) => {
  const token = getAuthToken();

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  // ✅ Ensure correct base URL format
  const url = `${API_URL}${endpoint}`;

  const response = await fetch(url, { ...options, headers });

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Server returned invalid response");
  }

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
};

// ✅ API FUNCTIONS
export const api = {
  // Auth
  login: (email, password) =>
    apiCall("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (name, email, password) =>
    apiCall("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),

  getCurrentUser: async () => {
    const key = "currentUser";
    const cached = cacheService.get(key);
    if (cached) {
      // revalidate in background
      apiCall("/api/auth/me")
        .then((d) => cacheService.set(key, d))
        .catch(() => {});
      return cached;
    }
    const data = await apiCall("/api/auth/me");
    cacheService.set(key, data);
    return data;
  },

  // Friends
  getFriends: async () => {
    const key = "friends";
    const cached = cacheService.get(key);
    if (cached) {
      apiCall("/api/friends")
        .then((d) => cacheService.set(key, d))
        .catch(() => {});
      return cached;
    }
    const data = await apiCall("/api/friends");
    cacheService.set(key, data);
    return data;
  },
  sendFriendRequest: (email) =>
    apiCall("/api/friends/request", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  acceptFriendRequest: (id) =>
    apiCall(`/api/friends/accept/${id}`, { method: "PUT" }),
  getPendingRequests: () => apiCall("/api/friends/pending"),

  // Groups
  getGroups: async () => {
    const key = "groups";
    const cached = cacheService.get(key);
    if (cached) {
      apiCall("/api/groups")
        .then((d) => cacheService.set(key, d))
        .catch(() => {});
      return cached;
    }
    const data = await apiCall("/api/groups");
    cacheService.set(key, data);
    return data;
  },

  getGroup: async (id) => {
    const key = `group:${id}`;
    const cached = cacheService.get(key);
    if (cached) {
      apiCall(`/api/groups/${id}`)
        .then((d) => cacheService.set(key, d))
        .catch(() => {});
      return cached;
    }
    const data = await apiCall(`/api/groups/${id}`);
    cacheService.set(key, data);
    return data;
  },

  createGroup: async (name, description, memberIds) => {
    const data = await apiCall("/api/groups", {
      method: "POST",
      body: JSON.stringify({ name, description, memberIds }),
    });
    // invalidate related caches
    cacheService.clear("groups");
    return data;
  },
  addGroupMember: async (groupId, userId) => {
    const data = await apiCall(`/api/groups/${groupId}/members`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
    cacheService.clear("groups");
    cacheService.clear(`group:${groupId}`);
    return data;
  },

  removeGroupMember: async (groupId, userId) => {
    const data = await apiCall(`/api/groups/${groupId}/members/${userId}`, {
      method: "DELETE",
    });
    cacheService.clear("groups");
    cacheService.clear(`group:${groupId}`);
    return data;
  },

  // Expenses
  getExpenses: async (groupId) => {
    const key = `expenses:${groupId || "all"}`;
    const cached = cacheService.get(key);
    const endpoint = groupId
      ? `/api/expenses?groupId=${groupId}`
      : "/api/expenses";
    if (cached) {
      apiCall(endpoint)
        .then((d) => cacheService.set(key, d))
        .catch(() => {});
      return cached;
    }
    const data = await apiCall(endpoint);
    cacheService.set(key, data);
    return data;
  },
  getExpense: (id) => apiCall(`/api/expenses/${id}`),
  createExpense: async (expenseData) => {
    const data = await apiCall("/api/expenses", {
      method: "POST",
      body: JSON.stringify(expenseData),
    });
    // invalidate expenses cache for the group (if present)
    if (expenseData?.groupId) {
      cacheService.clear(`expenses:${expenseData.groupId}`);
    }
    return data;
  },
  deleteExpense: (id) => apiCall(`/api/expenses/${id}`, { method: "DELETE" }),

  // Transactions
  getTransactions: (groupId, status) => {
    const params = new URLSearchParams();
    if (groupId) params.append("groupId", groupId);
    if (status) params.append("status", status);
    return apiCall(`/api/transactions?${params.toString()}`);
  },
  getBalanceSummary: () => apiCall("/api/transactions/summary"),
  settleTransaction: (id) =>
    apiCall(`/api/transactions/${id}/settle`, { method: "PUT" }),
};
