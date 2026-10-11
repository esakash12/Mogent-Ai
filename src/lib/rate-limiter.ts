interface RateLimitRecord {
  timestamps: number[];
}

// Bounded in-memory store for sliding window rate limiting
const MAX_ENTRIES = 5000;
const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up stale records periodically (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    rateLimitStore.forEach((record, key) => {
      record.timestamps = record.timestamps.filter((ts: number) => now - ts < 5 * 60 * 1000);
      if (record.timestamps.length === 0) {
        rateLimitStore.delete(key);
      }
    });
  }, 5 * 60 * 1000);
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Memory-safe sliding window rate limit checker
 * Enforces a strict 5,000 max-entries boundary to prevent heap exhaustion attacks.
 * 
 * @param key Unique key (e.g. IP address or IP + endpoint)
 * @param limit Max allowed requests within the window
 * @param windowSeconds Window duration in seconds
 */
export function checkRateLimit(
  key: string,
  limit: number = 60,
  windowSeconds: number = 60
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const threshold = now - windowMs;

  // Prevent memory exhaustion: prune oldest if size exceeds MAX_ENTRIES
  if (rateLimitStore.size > MAX_ENTRIES) {
    const keysToEvict = Array.from(rateLimitStore.keys()).slice(0, 500);
    keysToEvict.forEach((k) => rateLimitStore.delete(k));
  }

  let record = rateLimitStore.get(key);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(key, record);
  }

  // Filter out timestamps outside the sliding window
  record.timestamps = record.timestamps.filter((ts) => ts > threshold);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const resetInSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetInSeconds,
    };
  }

  // Record current request timestamp
  record.timestamps.push(now);

  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - record.timestamps.length),
    resetInSeconds: windowSeconds,
  };
}

/**
 * Strict rate limiter for Authentication (Login / Register)
 * Limit: Max 5 attempts per 60 seconds per IP
 */
export function checkAuthRateLimit(ip: string): RateLimitResult {
  return checkRateLimit(`auth:${ip}`, 5, 60);
}

/**
 * Rate limiter for Public Chat & Widget API
 * Limit: Max 20 requests per 60 seconds per IP
 */
export function checkChatRateLimit(ip: string): RateLimitResult {
  return checkRateLimit(`chat:${ip}`, 20, 60);
}
