import { createClient } from "redis";
import "dotenv/config";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

let redisClient = null;
let useFallback = false;
const inMemoryCache = new Map();

let loggedErrorOnce = false;

try {
  redisClient = createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 2) {
          if (!loggedErrorOnce) {
            console.warn("⚠️ Redis connection retries exhausted. Staying on in-memory fallback.");
            loggedErrorOnce = true;
          }
          useFallback = true;
          return false; // Stop reconnecting
        }
        return 1000; // Retry after 1s
      }
    }
  });

  redisClient.on("error", (err) => {
    if (!useFallback && !loggedErrorOnce) {
      console.warn("⚠️ Redis client error, switching to in-memory fallback cache:", err.message);
      loggedErrorOnce = true;
    }
    useFallback = true;
  });

  redisClient.on("connect", () => {
    console.log("🚀 Redis client successfully connected!");
    useFallback = false;
    loggedErrorOnce = false;
  });
} catch (err) {
  console.warn("⚠️ Failed to initialize Redis client, using in-memory fallback:", err.message);
  useFallback = true;
}

// Wrapper to support Redis commands with in-memory fallback
const clientWrapper = {
  connect: async () => {
    if (!redisClient) {
      useFallback = true;
      return;
    }
    try {
      await redisClient.connect();
    } catch (err) {
      console.warn("⚠️ Redis connection failed, using in-memory fallback cache.");
      useFallback = true;
    }
  },
  
  // hGetAll wrapper
  hGetAll: async (key) => {
    if (useFallback || !redisClient?.isOpen) {
      return inMemoryCache.get(key) || {};
    }
    try {
      return await redisClient.hGetAll(key);
    } catch (err) {
      useFallback = true;
      return inMemoryCache.get(key) || {};
    }
  },

  // hGet wrapper
  hGet: async (key, field) => {
    if (useFallback || !redisClient?.isOpen) {
      const data = inMemoryCache.get(key) || {};
      return data[field] || null;
    }
    try {
      return await redisClient.hGet(key, String(field));
    } catch (err) {
      useFallback = true;
      const data = inMemoryCache.get(key) || {};
      return data[field] || null;
    }
  },

  // hSet wrapper
  hSet: async (key, field, value) => {
    // Update local cache
    let localData = inMemoryCache.get(key) || {};
    localData[field] = String(value);
    inMemoryCache.set(key, localData);

    if (useFallback || !redisClient?.isOpen) {
      return 1;
    }
    try {
      return await redisClient.hSet(key, String(field), String(value));
    } catch (err) {
      useFallback = true;
      return 1;
    }
  },

  // hDel wrapper
  hDel: async (key, field) => {
    let localData = inMemoryCache.get(key) || {};
    delete localData[field];
    inMemoryCache.set(key, localData);

    if (useFallback || !redisClient?.isOpen) {
      return 1;
    }
    try {
      return await redisClient.hDel(key, String(field));
    } catch (err) {
      useFallback = true;
      return 1;
    }
  },

  // del wrapper
  del: async (key) => {
    inMemoryCache.delete(key);
    if (useFallback || !redisClient?.isOpen) {
      return 1;
    }
    try {
      return await redisClient.del(key);
    } catch (err) {
      useFallback = true;
      return 1;
    }
  }
};

export default clientWrapper;
