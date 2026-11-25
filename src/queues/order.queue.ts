import { Queue, Worker, QueueEvents, Job, ConnectionOptions } from "bullmq";
import config from "../config";

let connectionOptions: ConnectionOptions;

try {
  const parsedUrl = new URL(config.redis_url || "redis://localhost:6379");
  connectionOptions = {
    host: parsedUrl.hostname || "localhost",
    port: parseInt(parsedUrl.port || "6379", 10),
    username: parsedUrl.username || undefined,
    password: parsedUrl.password || undefined,
    maxRetriesPerRequest: null,
    retryStrategy: (times: number) => {
      if (times > 3) return null;
      return 1000;
    },
  };
} catch {
  connectionOptions = {
    host: "localhost",
    port: 6379,
    maxRetriesPerRequest: null,
  };
}

let orderQueue: Queue | null = null;
let orderWorker: Worker | null = null;
let orderQueueEvents: QueueEvents | null = null;
let isQueueActive = false;

/**
 * Initializes BullMQ Queue and Worker for atomic Order & Invoice creation
 */
export const initOrderQueue = (
  processOrderFn: (payload: any) => Promise<any>
) => {
  try {
    orderQueue = new Queue("xovaar-order-queue", {
      connection: connectionOptions,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    });

    orderQueueEvents = new QueueEvents("xovaar-order-queue", {
      connection: connectionOptions,
    });

    orderWorker = new Worker(
      "xovaar-order-queue",
      async (job: Job) => {
        console.log(`⚡ [XOVAAR BullMQ] Processing order & invoice job #${job.id}`);
        return await processOrderFn(job.data);
      },
      {
        connection: connectionOptions,
        concurrency: 1, // Atomic sequential processing to avoid order number & inventory collisions
      }
    );

    orderWorker.on("completed", (job) => {
      console.log(`✅ [XOVAAR BullMQ] Order job #${job.id} completed successfully`);
    });

    orderWorker.on("failed", (job, err) => {
      console.error(`❌ [XOVAAR BullMQ] Order job #${job?.id} failed:`, err);
    });

    orderWorker.on("error", (err) => {
      isQueueActive = false;
    });

    orderQueue
      .waitUntilReady()
      .then(() => {
        isQueueActive = true;
        console.log("✅ [XOVAAR BullMQ] Order & Invoice creation queue is ready (Concurrency: 1)");
      })
      .catch(() => {
        isQueueActive = false;
      });
  } catch (err) {
    console.warn("⚠️ [XOVAAR BullMQ] Redis queue unavailable, using resilient direct fallback.");
    isQueueActive = false;
  }
};

/**
 * Enqueues an order creation task into BullMQ.
 * If Redis/BullMQ is offline, falls back to direct execution so orders never fail.
 */
export const enqueueOrder = async (
  payload: any,
  directFallbackFn: (payload: any) => Promise<any>
): Promise<any> => {
  if (isQueueActive && orderQueue && orderQueueEvents) {
    try {
      const job = await orderQueue.add("create-order-invoice", payload);
      const result = await job.waitUntilFinished(orderQueueEvents, 12000);
      return result;
    } catch (queueErr) {
      console.warn("⚠️ [XOVAAR BullMQ] Queue execution timed out or failed, falling back to direct processing:", queueErr);
      return await directFallbackFn(payload);
    }
  }

  // Resilient fallback when Redis is offline or starting
  return await directFallbackFn(payload);
};

export const closeOrderQueue = async () => {
  try {
    if (orderWorker) await orderWorker.close();
    if (orderQueueEvents) await orderQueueEvents.close();
    if (orderQueue) await orderQueue.close();
  } catch {
    // Ignore close errors
  }
};
