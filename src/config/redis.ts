import Redis from "ioredis";
import config from "./index";

let redisClient: Redis | null = null;
let isRedisConnected = false;

try {
  redisClient = new Redis(config.redis_url, {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 2) {
        // Stop reconnecting if Redis is not running locally during dev
        return null;
      }
      return 1000;
    },
    lazyConnect: true,
  });

  redisClient.connect().then(() => {
    isRedisConnected = true;
    console.log("✅ [XOVAAR Redis] Connected to Redis successfully");
  }).catch((err) => {
    isRedisConnected = false;
    console.warn("⚠️ [XOVAAR Redis] Redis offline or REDIS_URL not reached. Falling back to in-memory sliding window rate limiter.");
  });

  redisClient.on("error", () => {
    isRedisConnected = false;
  });
} catch {
  isRedisConnected = false;
}

export const getRedisClient = () => (isRedisConnected ? redisClient : null);
export default redisClient;
