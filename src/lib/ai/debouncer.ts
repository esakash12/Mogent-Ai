import Redis from "ioredis";

// Optional Redis client with local in-memory fallback
let redisClient: Redis | null = null;

if (process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 2,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 100, 1000)),
    });
    redisClient.on("error", (err) => {
      console.warn("[Debouncer] Redis unavailable, using local memory fallback:", err.message);
    });
  } catch {
    redisClient = null;
  }
}

// In-Memory Session State
export interface BurstPayload {
  text?: string;
  imageUrl?: string;
  voiceTranscript?: string;
}

export interface AggregatedBurst {
  aggregatedText: string;
  imageUrls: string[];
}

interface LocalBurstEntry {
  messages: string[];
  imageUrls: string[];
  pendingMediaCount: number;
  isExecuting: boolean;
  timer: NodeJS.Timeout | null;
  callback: (aggregated: AggregatedBurst) => Promise<void>;
}

const localBurstMap = new Map<string, LocalBurstEntry>();
const DEBOUNCE_QUIET_WINDOW_MS = 2500; // 2.5s quiet window for human typing & multi-attachment bursts

/**
 * Registers that an async media task (e.g. voice transcription or image download)
 * is in progress for this session. Prevents the quiet timer from firing before all
 * concurrent media tasks finish.
 *
 * Returns a release callback to call when the async media processing completes.
 */
export function registerPendingMedia(sessionKey: string): () => void {
  let entry = localBurstMap.get(sessionKey);
  if (!entry) {
    entry = {
      messages: [],
      imageUrls: [],
      pendingMediaCount: 0,
      isExecuting: false,
      timer: null,
      callback: async () => {},
    };
    localBurstMap.set(sessionKey, entry);
  }

  entry.pendingMediaCount++;

  // Pause any ticking quiet timer while media is actively processing
  if (entry.timer) {
    clearTimeout(entry.timer);
    entry.timer = null;
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;

    const current = localBurstMap.get(sessionKey);
    if (current) {
      current.pendingMediaCount = Math.max(0, current.pendingMediaCount - 1);
      // If all media finished and we have buffered messages/images waiting, start quiet countdown
      if (current.pendingMediaCount === 0 && (current.messages.length > 0 || current.imageUrls.length > 0) && !current.isExecuting) {
        scheduleQuietWindow(sessionKey, current);
      }
    }
  };
}

function scheduleQuietWindow(sessionKey: string, entry: LocalBurstEntry) {
  if (entry.timer) {
    clearTimeout(entry.timer);
  }

  entry.timer = setTimeout(async () => {
    const current = localBurstMap.get(sessionKey);
    if (!current) return;

    // Do not fire if any media is still being transcribed/processed
    if (current.pendingMediaCount > 0) return;

    // Do not fire if already running AI inference
    if (current.isExecuting) return;

    if (current.messages.length === 0 && current.imageUrls.length === 0) {
      localBurstMap.delete(sessionKey);
      return;
    }

    current.isExecuting = true;
    const messagesToProcess = [...current.messages];
    const imagesToProcess = [...current.imageUrls];
    current.messages = []; // Clear current batch for inference
    current.imageUrls = [];

    try {
      const unified = unifyBurstMessages(messagesToProcess);
      await current.callback({ aggregatedText: unified, imageUrls: imagesToProcess });
    } catch (err) {
      console.error("[Debouncer callback execution error]:", err);
    } finally {
      current.isExecuting = false;
      // If new messages arrived while AI was generating the response, schedule another quiet window
      if (current.messages.length > 0 || current.imageUrls.length > 0) {
        scheduleQuietWindow(sessionKey, current);
      } else if (current.pendingMediaCount === 0) {
        localBurstMap.delete(sessionKey);
      }
    }
  }, DEBOUNCE_QUIET_WINDOW_MS);
}

/**
 * Intelligent Burst Message Aggregator:
 * Gathers split colloquial customer messages, images, and rapid consecutive voice messages,
 * triggering exactly 1 unified AI inference run after quiet window resolution.
 */
export async function debounceIncomingMessage(
  sessionKey: string, // tenantId:channel:senderId
  payload: string | BurstPayload,
  onQuietWindowResolved: (aggregated: AggregatedBurst) => Promise<void>
): Promise<void> {
  const text = typeof payload === "string" ? payload.trim() : (payload.text?.trim() || "");
  const imageUrl = typeof payload === "object" && payload.imageUrl ? payload.imageUrl.trim() : null;

  if (!text && !imageUrl) return;

  // 1. Redis Implementation (Distributed fallback when Redis is active)
  if (redisClient && redisClient.status === "ready") {
    try {
      const bufferKey = `burst_buf:${sessionKey}`;
      const imgBufferKey = `burst_img:${sessionKey}`;
      const lockKey = `burst_lock:${sessionKey}`;

      if (text) {
        await redisClient.rpush(bufferKey, text);
        await redisClient.expire(bufferKey, 30);
      }
      if (imageUrl) {
        await redisClient.rpush(imgBufferKey, imageUrl);
        await redisClient.expire(imgBufferKey, 30);
      }
      await redisClient.set(lockKey, Date.now().toString(), "PX", DEBOUNCE_QUIET_WINDOW_MS);

      setTimeout(async () => {
        try {
          if (!redisClient) return;
          const currentLock = await redisClient.get(lockKey);
          if (currentLock) {
            const timeSince = Date.now() - parseInt(currentLock, 10);
            if (timeSince >= DEBOUNCE_QUIET_WINDOW_MS - 200) {
              const allMessages = await redisClient.lrange(bufferKey, 0, -1);
              const allImages = await redisClient.lrange(imgBufferKey, 0, -1);
              await redisClient.del(bufferKey);
              await redisClient.del(imgBufferKey);
              await redisClient.del(lockKey);

              if ((allMessages && allMessages.length > 0) || (allImages && allImages.length > 0)) {
                const unified = unifyBurstMessages(allMessages || []);
                await onQuietWindowResolved({
                  aggregatedText: unified,
                  imageUrls: Array.from(new Set(allImages || [])),
                });
              }
            }
          }
        } catch (err) {
          console.error("[Debouncer Redis Window Error]", err);
        }
      }, DEBOUNCE_QUIET_WINDOW_MS);
      return;
    } catch {
      // Fall through to in-memory
    }
  }

  // 2. In-Memory Implementation
  let entry = localBurstMap.get(sessionKey);
  if (!entry) {
    entry = {
      messages: [],
      imageUrls: [],
      pendingMediaCount: 0,
      isExecuting: false,
      timer: null,
      callback: onQuietWindowResolved,
    };
    localBurstMap.set(sessionKey, entry);
  }

  // Update latest callback closure & append text/image
  entry.callback = onQuietWindowResolved;
  if (text) {
    entry.messages.push(text);
  }
  if (imageUrl && !entry.imageUrls.includes(imageUrl)) {
    entry.imageUrls.push(imageUrl);
  }

  // If another media message is still downloading/transcribing, wait for it
  if (entry.pendingMediaCount > 0) {
    if (entry.timer) {
      clearTimeout(entry.timer);
      entry.timer = null;
    }
    return;
  }

  // If already executing an AI inference run, the new message remains queued in entry.messages/imageUrls
  if (entry.isExecuting) {
    return;
  }

  // Schedule or reset quiet window countdown
  scheduleQuietWindow(sessionKey, entry);
}

/**
 * Merges colloquial burst messages, intelligently combining consecutive voice transcripts into one coherent statement.
 */
export function unifyBurstMessages(messages: string[]): string {
  if (!messages || messages.length === 0) return "";
  if (messages.length === 1) return messages[0].trim();

  const collectedVoiceTranscripts: string[] = [];
  const cleanOtherLines: string[] = [];

  for (const rawMsg of messages) {
    const lines = rawMsg.split("\n");
    for (const line of lines) {
      const match = /\[কাস্টমার (?:একটি )?ভয়েস মেসেজ পাঠিয়েছেন। ট্রান্সক্রিপ্ট\]:\s*"([^"]+)"/.exec(line);
      if (match) {
        collectedVoiceTranscripts.push(match[1].trim());
      } else if (line.trim()) {
        cleanOtherLines.push(line.trim());
      }
    }
  }

  // Filter out redundant placeholder lines like "[কাস্টমার একটি ছবি পাঠিয়েছেন]"
  // if actual customer text or voice transcripts are present (the actual image bytes are already passed in multimodal payload)
  const hasRealText = cleanOtherLines.some((l) => !l.startsWith("[কাস্টমার একটি"));
  const finalOtherLines = hasRealText
    ? cleanOtherLines.filter((l) => !l.startsWith("[কাস্টমার একটি"))
    : cleanOtherLines;

  // If customer sent multiple audio messages in a row, merge them into a single coherent statement
  if (collectedVoiceTranscripts.length > 1) {
    const joinedVoice = collectedVoiceTranscripts.reduce((acc, curr) => {
      if (!acc) return curr;
      const endsWithPunctuation = /[।?!,]$/.test(acc.trim());
      return endsWithPunctuation ? `${acc.trim()} ${curr.trim()}` : `${acc.trim()}। ${curr.trim()}`;
    }, "");

    const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    const countBn = collectedVoiceTranscripts.length
      .toString()
      .replace(/\d/g, (d) => bnDigits[parseInt(d, 10)]);

    const voiceBlock = `[কাস্টমার টানা ${countBn}টি ভয়েস মেসেজ পাঠিয়েছেন। অডিওগুলোর যৌথ বক্তব্য]: "${joinedVoice}"`;
    if (finalOtherLines.length > 0) {
      return [...finalOtherLines, voiceBlock].join("\n");
    }
    return voiceBlock;
  }

  if (collectedVoiceTranscripts.length === 1) {
    const voiceBlock = `[কাস্টমার একটি ভয়েস মেসেজ পাঠিয়েছেন। ট্রান্সক্রিপ্ট]: "${collectedVoiceTranscripts[0]}"`;
    if (finalOtherLines.length > 0) {
      return [...finalOtherLines, voiceBlock].join("\n");
    }
    return voiceBlock;
  }

  return finalOtherLines.join("\n");
}
