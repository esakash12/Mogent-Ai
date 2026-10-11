# Compound Engineering Learnings & Architecture Memory

## Learning 01: PostgreSQL Row-Level Security (RLS) with Prisma
- **Problem:** Standard Prisma queries execute in connection pools where session variables can bleed across concurrent requests if set at the session level.
- **Solution:** Enforce RLS at transaction scope using `SET LOCAL app.current_tenant_id = :tenantId` inside `prisma.$transaction()`. `SET LOCAL` automatically resets when the transaction commits or rolls back, guaranteeing zero cross-tenant contamination even under high connection pool multiplexing.

## Learning 02: 3.5s Burst Message Debouncing Strategy
- **Context:** Bangladeshi customer behavior involves multi-message typing bursts (e.g. "ভাইয়া", "আছেন?", "L সাইজ আছে?").
- **Solution:** Designed `debounceIncomingMessage` with Redis key `burst_buf:<sessionKey>` and a sliding expiration timer (`DEBOUNCE_QUIET_WINDOW_MS = 3500`). Added automatic in-memory fallback so local testing on Windows works without a live Redis container.

## Learning 03: Preservation of Untouchable Assets
- **Directive:** The directory `Dont Edit or write/` must remain completely untouched. The production landing page in `src/app/page.tsx` must stay aligned with `Dont Edit or write/index.html`.

## Learning 04: WebSocket Audio Resampling & 3-Second AMD Telecom Guard
- **Context:** Bangladeshi telecom providers (Grameenphone, Banglalink, Robi, Teletalk) bill outbound SIP calls the moment the line connects to an automated voice prompt or voicemail.
- **Solution:** Implemented 3-second spectral acoustic & Bengali keyword AMD filter in `src/lib/voice/amd-detector.ts`. If an IVR/operator tone or announcement is detected within 3000ms, the WebSocket engine terminates immediately, keeping billable duration at 0. G.711 mu-law 8kHz audio is bidirectionally resampled to 24kHz 16-bit linear PCM for low-latency streaming to Gemini Live.

## Learning 05: BullMQ Worker Orchestration with Local Interval Graceful Fallback
- **Context:** Background jobs (zombie stock release, refund ledger sweep, leaky call queue) require reliable execution regardless of whether an external Redis service is configured locally.
- **Solution:** Created dual-engine worker manager in `src/lib/worker/queue-manager.ts` using BullMQ with automatic fallback to Node.js interval runners, guaranteeing high availability in development and production environments.

## Learning 06: Deterministic COD & Stock Pre-emption Logic ("Cash is King")
- **Context:** Inventory held under night COD soft-locks can block paying customers.
- **Solution:** Instant prepaid checkouts (bKash/Nagad PGW) pre-empt night COD soft-locks immediately. The COD formula `max(0, (Product + Delivery) - Advance Received)` eliminates courier collection discrepancy, with any excess advance routed directly to `RefundLedger`.
