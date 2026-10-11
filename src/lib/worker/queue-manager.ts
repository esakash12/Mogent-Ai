import { Queue, Worker, Job } from "bullmq";
import { releaseExpiredZombieLocks } from "./zombie-stock-releaser";
import { sweepAbandonedAdvanceLedger } from "./refund-ledger-sweeper";
import { scheduleMorningLeakyCalls } from "./leaky-call-scheduler";

const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379", 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

const connection = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
};

export const MOGENT_QUEUE_NAME = "mogent-background-workers";

let workerQueue: Queue | null = null;
let backgroundWorker: Worker | null = null;

/**
 * Initializes BullMQ Queues and Workers with graceful fallback
 */
export function initWorkerQueue() {
  try {
    workerQueue = new Queue(MOGENT_QUEUE_NAME, { connection });

    backgroundWorker = new Worker(
      MOGENT_QUEUE_NAME,
      async (job: Job) => {
        switch (job.name) {
          case "zombie-stock-release":
            return await releaseExpiredZombieLocks();

          case "sweep-refund-ledger":
            return await sweepAbandonedAdvanceLedger();

          case "leaky-call-scheduler":
            return await scheduleMorningLeakyCalls();

          default:
            console.warn(`[Worker] Unknown job name: ${job.name}`);
        }
      },
      { connection, concurrency: 5 }
    );

    backgroundWorker.on("completed", (job) => {
      console.log(`[Worker] Job ${job.id} (${job.name}) completed successfully.`);
    });

    backgroundWorker.on("failed", (job, err) => {
      console.error(`[Worker] Job ${job?.id} (${job?.name}) failed:`, err);
    });

    console.log("[Worker] BullMQ Worker initialized connected to Redis.");
  } catch (err) {
    console.warn(
      "[Worker] Redis connection failed, falling back to local timer interval execution:",
      err
    );
    initLocalFallbackIntervals();
  }
}

/**
 * Fallback interval execution if standalone Redis is not running
 */
function initLocalFallbackIntervals() {
  console.log("[Worker] Running background workers via local setInterval fallback.");

  // Zombie stock releaser runs every 5 minutes
  setInterval(async () => {
    try {
      await releaseExpiredZombieLocks();
    } catch (e) {
      console.error("[FallbackWorker] Zombie release error:", e);
    }
  }, 5 * 60 * 1000);

  // Refund ledger sweeper runs every 30 minutes
  setInterval(async () => {
    try {
      await sweepAbandonedAdvanceLedger();
    } catch (e) {
      console.error("[FallbackWorker] Refund sweep error:", e);
    }
  }, 30 * 60 * 1000);

  // Leaky call scheduler runs every minute
  setInterval(async () => {
    try {
      const now = new Date();
      // Check BD time: UTC+6. Hours: 9 AM to 11 AM BD time
      const utcHours = now.getUTCHours();
      const bdHours = (utcHours + 6) % 24;
      if (bdHours >= 9 && bdHours < 21) {
        await scheduleMorningLeakyCalls();
      }
    } catch (e) {
      console.error("[FallbackWorker] Leaky call scheduler error:", e);
    }
  }, 60 * 1000);
}
