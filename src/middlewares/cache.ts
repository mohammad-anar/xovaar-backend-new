import { Request, Response, NextFunction } from "express";
import { getRedisClient } from "../config/redis";

interface MemoryCacheEntry {
  data: any;
  expiresAt: number;
}

// In-memory fallback cache when Redis is offline
const memoryCache = new Map<string, MemoryCacheEntry>();

// Purge expired memory cache entries every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expiresAt < now) {
      memoryCache.delete(key);
    }
  }
}, 60 * 1000).unref();

export const CacheService = {
  get: async (key: string): Promise<any | null> => {
    const redis = getRedisClient();
    if (redis) {
      try {
        const raw = await redis.get(key);
        if (raw) {
          return JSON.parse(raw);
        }
        return null;
      } catch (err) {
        console.warn(`[XOVAAR Cache] Redis get error on key "${key}":`, err);
      }
    }

    // Fallback to memory
    const entry = memoryCache.get(key);
    if (entry) {
      if (entry.expiresAt > Date.now()) {
        return entry.data;
      }
      memoryCache.delete(key);
    }
    return null;
  },

  set: async (key: string, data: any, ttlSeconds = 300): Promise<void> => {
    const redis = getRedisClient();
    if (redis) {
      try {
        await redis.set(key, JSON.stringify(data), "EX", ttlSeconds);
        return;
      } catch (err) {
        console.warn(`[XOVAAR Cache] Redis set error on key "${key}":`, err);
      }
    }

    // Fallback to memory
    memoryCache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  },

  invalidate: async (prefixes: string[]): Promise<void> => {
    const redis = getRedisClient();

    for (const prefix of prefixes) {
      const cleanPrefix = prefix.toLowerCase();

      // Clear matching keys from memory
      for (const key of memoryCache.keys()) {
        if (key.toLowerCase().includes(cleanPrefix)) {
          memoryCache.delete(key);
        }
      }

      // Clear matching keys from Redis
      if (redis) {
        try {
          const keys = await redis.keys(`*${cleanPrefix}*`);
          if (keys.length > 0) {
            await redis.del(...keys);
          }
        } catch (err) {
          console.warn(`[XOVAAR Cache] Redis invalidation error for prefix "${prefix}":`, err);
        }
      }
    }
  },

  flushAll: async (): Promise<void> => {
    memoryCache.clear();
    const redis = getRedisClient();
    if (redis) {
      try {
        const keys = await redis.keys("xovaar:cache:*");
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } catch (err) {
        console.warn("[XOVAAR Cache] Redis flush error:", err);
      }
    }
  },
};

/**
 * Express middleware for caching GET responses
 * @param ttlSeconds Cache duration in seconds (default: 300s / 5 minutes)
 */
export const cacheMiddleware = (ttlSeconds = 300) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET") {
      return next();
    }

    const userId = (req as any).user?.userId || "public";
    const cacheKey = `xovaar:cache:${req.originalUrl || req.url}:${userId}`;

    try {
      const cachedData = await CacheService.get(cacheKey);
      if (cachedData) {
        res.setHeader("X-Cache", "HIT");
        return res.status(200).json(cachedData);
      }
    } catch {
      // Proceed without cache if any error occurs
    }

    res.setHeader("X-Cache", "MISS");

    // Hook res.json to cache response on success
    const originalJson = res.json.bind(res);

    res.json = (body: any) => {
      if (res.statusCode >= 200 && res.statusCode < 300 && body) {
        CacheService.set(cacheKey, body, ttlSeconds).catch(() => {});
      }
      return originalJson(body);
    };

    next();
  };
};

/**
 * Express middleware for invalidating cache keys on successful mutations (POST, PUT, PATCH, DELETE)
 * @param prefixes Array of key substrings to invalidate (e.g. ['product', 'analytics'])
 */
export const invalidateCache = (prefixes: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    res.on("finish", () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        CacheService.invalidate(prefixes).catch(() => {});
      }
    });
    next();
  };
};

export default cacheMiddleware;
