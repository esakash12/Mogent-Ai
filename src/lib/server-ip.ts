/**
 * Resolves the server's public outbound IP address.
 * Used to assist Super Admin when whitelisting IPs with local providers (Greenweb SMS, AmberIT/BTCL SIP).
 */
let cachedIp: string | null = null;
let lastFetched = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function getServerOutboundIp(): Promise<string> {
  // 1. Explicit Environment Variable Override
  if (process.env.SERVER_STATIC_IP && process.env.SERVER_STATIC_IP.trim()) {
    return process.env.SERVER_STATIC_IP.trim();
  }

  // 2. Return cached IP if valid
  const now = Date.now();
  if (cachedIp && now - lastFetched < CACHE_TTL_MS) {
    return cachedIp;
  }

  // 3. Attempt external IP resolution with 3-second timeout
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch("https://api.ipify.org?format=json", {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.ip) {
        cachedIp = data.ip;
        lastFetched = now;
        return data.ip;
      }
    }
  } catch {
    // If offline or external resolution fails, fallback gracefully
  }

  return cachedIp || "127.0.0.1 (Local Development)";
}
