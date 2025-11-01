// Determine API base URL:
// - Prefer explicit VITE_API_URL when provided at build time
// - If not provided and we're running in browser on Vercel, default to Railway backend
// - Otherwise fall back to relative "/api" (good for same-origin serverless functions)
let API_URL = import.meta.env.VITE_API_URL || "";

if (!API_URL) {
  // runtime-detect in the browser
  const isBrowser = typeof window !== "undefined" && window?.location;
  if (isBrowser) {
    const host = window.location.hostname || "";
    // if deployed on vercel, point to the Railway production backend you provided
    if (host.includes("vercel.app")) {
      API_URL = "https://splitly-production.up.railway.app/api";
    } else {
      // default for other hosts: call same-origin serverless functions
      API_URL = "/api";
    }
  } else {
    // server/build-time fallback
    API_URL = "/api";
  }
}

const getAuthToken = () => {
  return localStorage.getItem("token");
};

const apiCall = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "Request failed");
  }

  return response.json();
};

export const api = {
  // Auth
  login: (email, password) =>
    apiCall("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (name, email, password) =>
    apiCall("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),

  getCurrentUser: () => apiCall("/auth/me"),

  // Friends
  getFriends: () => apiCall("/friends"),
  sendFriendRequest: (email) =>
    apiCall("/friends/request", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  acceptFriendRequest: (id) =>
    apiCall(`/friends/accept/${id}`, { method: "PUT" }),
  getPendingRequests: () => apiCall("/friends/pending"),

  // Groups
  getGroups: () => apiCall("/groups"),
  getGroup: (id) => apiCall(`/groups/${id}`),
  createGroup: (name, description, memberIds) =>
    apiCall("/groups", {
      method: "POST",
      body: JSON.stringify({ name, description, memberIds }),
    }),
  addGroupMember: (groupId, userId) =>
    apiCall(`/groups/${groupId}/members`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),
  removeGroupMember: (groupId, userId) =>
    apiCall(`/groups/${groupId}/members/${userId}`, { method: "DELETE" }),

  // Expenses
  getExpenses: (groupId) =>
    apiCall(groupId ? `/expenses?groupId=${groupId}` : "/expenses"),
  getExpense: (id) => apiCall(`/expenses/${id}`),
  createExpense: (expenseData) =>
    apiCall("/expenses", {
      method: "POST",
      body: JSON.stringify(expenseData),
    }),
  deleteExpense: (id) => apiCall(`/expenses/${id}`, { method: "DELETE" }),

  // Transactions
  getTransactions: (groupId, status) => {
    const params = new URLSearchParams();
    if (groupId) params.append("groupId", groupId);
    if (status) params.append("status", status);
    return apiCall(`/transactions?${params.toString()}`);
  },
  getBalanceSummary: () => apiCall("/transactions/summary"),
  settleTransaction: (id) =>
    apiCall(`/transactions/${id}/settle`, { method: "PUT" }),
};
