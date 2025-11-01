// Simple in-memory cache
const cache = new Map();

export const cacheService = {
  get: (key) => {
    const item = cache.get(key);
    if (item && item.expiry > Date.now()) {
      return item.value;
    }
    cache.delete(key);
    return null;
  },

  set: (key, value, ttl = 5 * 60 * 1000) => {
    cache.set(key, {
      value,
      expiry: Date.now() + ttl,
    });
  },

  clear: (key) => {
    cache.delete(key);
  },

  clearAll: () => {
    cache.clear();
  },
};
