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

  getCurrentUser: () => apiCall("/api/auth/me"),

  // Friends
  getFriends: () => apiCall("/api/friends"),
  sendFriendRequest: (email) =>
    apiCall("/api/friends/request", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  acceptFriendRequest: (id) =>
    apiCall(`/api/friends/accept/${id}`, { method: "PUT" }),
  getPendingRequests: () => apiCall("/api/friends/pending"),

  // Groups
  getGroups: () => apiCall("/api/groups"),
  getGroup: (id) => apiCall(`/api/groups/${id}`),
  createGroup: (name, description, memberIds) =>
    apiCall("/api/groups", {
      method: "POST",
      body: JSON.stringify({ name, description, memberIds }),
    }),
  addGroupMember: (groupId, userId) =>
    apiCall(`/api/groups/${groupId}/members`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),
  removeGroupMember: (groupId, userId) =>
    apiCall(`/api/groups/${groupId}/members/${userId}`, { method: "DELETE" }),

  // Expenses
  getExpenses: (groupId) =>
    apiCall(groupId ? `/api/expenses?groupId=${groupId}` : "/api/expenses"),
  getExpense: (id) => apiCall(`/api/expenses/${id}`),
  createExpense: (expenseData) =>
    apiCall("/api/expenses", {
      method: "POST",
      body: JSON.stringify(expenseData),
    }),
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
