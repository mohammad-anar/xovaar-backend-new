import { Request, Response, NextFunction } from "express";
import { getRedisClient } from "../config/redis";
import ApiError from "../utils/ApiError";

// Sliding window configuration: 20 requests per 10 seconds per IP
const WINDOW_SIZE_IN_SECONDS = 10;
const MAX_REQUESTS = 20;

// In-memory fallback if Redis is not connected
const inMemoryStore = new Map<string, number[]>();

export const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "127.0.0.1";

  const key = `ratelimit:${ip}`;
  const now = Date.now();
  const windowStart = now - WINDOW_SIZE_IN_SECONDS * 1000;

  const redis = getRedisClient();

  if (redis) {
    try {
      const pipeline = redis.pipeline();
      // Remove timestamps outside window
      pipeline.zremrangebyscore(key, 0, windowStart);
      // Add current timestamp
      pipeline.zadd(key, now, `${now}-${Math.random()}`);
      // Count requests in current window
      pipeline.zcard(key);
      // Set TTL for key
      pipeline.expire(key, WINDOW_SIZE_IN_SECONDS);

      const results = await pipeline.exec();
      const count = (results?.[2]?.[1] as number) || 0;

      res.setHeader("X-RateLimit-Limit", MAX_REQUESTS);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, MAX_REQUESTS - count));

      if (count > MAX_REQUESTS) {
        return next(
          new ApiError(
            429,
            "Too many requests! Rate limit exceeded. Please wait a few seconds before trying again."
          )
        );
      }
      return next();
    } catch {
      // Fall through to in-memory fallback on any Redis error
    }
  }

  // In-Memory Sliding Window Fallback
  const timestamps = inMemoryStore.get(ip) || [];
  const validTimestamps = timestamps.filter((t) => t > windowStart);
  validTimestamps.push(now);
  inMemoryStore.set(ip, validTimestamps);

  res.setHeader("X-RateLimit-Limit", MAX_REQUESTS);
  res.setHeader("X-RateLimit-Remaining", Math.max(0, MAX_REQUESTS - validTimestamps.length));

  if (validTimestamps.length > MAX_REQUESTS) {
    return next(
      new ApiError(
        429,
        "Too many requests! Rate limit exceeded. Please wait a few seconds before trying again."
      )
    );
  }

  next();
};

export default rateLimiter;
