# Mogent AI Master Migration Task Plan (v14.0 Production Blueprint)

## Core Architectural Principle
Refactor and upgrade the existing SaaS into the bulletproof, zero-fallback, production-grade Mogent AI engine without breaking running instances or touching `Dont Edit or write/`.

---

## Migration Inventory Matrix

### What to Keep & Refine
- `Dont Edit or write/`: Completely untouched (Frozen).
- `src/lib/meta/`: Retain OAuth token exchange & Webhook pipeline; strengthen HMAC verification.
- `src/lib/couriers/`: Retain Steadfast and Pathao client APIs; upgrade to support strict COD formula and Post-Booking Cancel Hook.
- `src/components/`: Keep UI structure; eliminate robotic AI jargon; bind to dynamic real-time data.

### What to Modify & Upgrade
- `prisma/schema.prisma`: Add `stock_locks`, `appointment_slots`, `refund_ledger`, vector embeddings, and RLS directives.
- `src/lib/db.ts`: Implement tenant context injector (`SET LOCAL app.current_tenant_id`).
- `src/lib/ai/prompts.ts` & `src/lib/ai/agent.ts`: Enforce Zero Prompt Injection, Zod function schemas, 3.5s burst debouncer hook, and colloquial Bengali persona.
- `src/app/api/webhooks/`: Harden HMAC-SHA256 signature verifications for Meta, WhatsApp, Telegram, and Couriers.

### What to Add / Build Fresh
- **PostgreSQL RLS Migration SQL**: Kernel-level row security policies for `products`, `orders`, `stock_locks`, `appointment_slots`, `refund_ledger`.
- **Redis 3.5s Burst Debouncer**: Grouping conversational fragments before AI inference.
- **Microservice / Worker Layer**:
  - `Track A`: Fastify API Gateway / hardened REST and Webhooks engine.
  - `Track B`: WebSocket Voice Engine (Port 5000) with 3s Bengali Telecom AMD.
  - `Track C`: BullMQ Worker service (9:01 AM Leaky Bucket, 2h Zombie Stock Releaser, 12h Partial Refund Sweeper).
- **Hardened Business Logistics**:
  - Courier COD Formula: `max(0, (Product + Delivery) - Advance Received)`.
  - Instant Payer Pre-emption ("Cash is King") over unconfirmed night COD locks.
  - 5-Minute Atomic Slot Mutex for Doctors & Salons.
- **No-AI-Slop Polish**: Elimination of all AI buzzwords and robotic corporate speak from UI and prompts.

---

## Phased Master Task Checklist

### Phase 1: Project Mapping & Memory Initialization
- [x] Scan existing SaaS directory and catalog assets.
- [x] Create `findings.md` documenting gap analysis.
- [x] Create `task_plan.md` defining migration boundaries and steps.
- [x] Create `progress.md` tracking real-time status.

### Phase 2: Secure Infrastructure Setup & Refactoring
- [x] Upgrade Prisma schema with RLS tables: `stock_locks`, `appointment_slots`, `refund_ledger`, `tenant_credentials`.
- [x] Generate & apply PostgreSQL Row-Level Security (RLS) SQL scripts (`prisma/migrations/rls_policies.sql`).
- [x] Set up Tenant-isolated database client (`SET LOCAL app.current_tenant_id`).
- [x] Implement Redis-backed 3.5s Burst Message Debouncer (`src/lib/ai/debouncer.ts`).
- [x] Run SkillSpector / security check on external integrations & webhook HMAC verification.

### Phase 3: Heavy Development & Multi-Agent Autopilot
- [x] **Track A: Gateway, Webhooks & Hardened Business Engine**
  - [x] Implement strict HMAC-SHA256 verification on all webhooks (Meta, WhatsApp, Telegram, Couriers).
  - [x] Implement Courier COD mathematical integrity formula: `max(0, (Product + Delivery) - Advance Received)`.
  - [x] Implement Night DND, 50% cap, and Instant Payer Pre-emption ("Cash is King").
  - [x] Implement Post-Booking Cancellation Hook (query Steadfast/Pathao in real-time).
  - [x] Implement 5-Minute Atomic Slot Mutex (`SELECT FOR UPDATE`) for clinics/salons.
- [x] **Track B: WebSocket SIP Voice Engine & Telecom AMD**
  - [x] Implement Voice Engine server with G.711 to 24kHz PCM audio bridge (`src/lib/voice/voice-server.ts`).
  - [x] Implement 3-Second Spectral Acoustic & Bengali Keyword AMD Filter (`src/lib/voice/amd-detector.ts`).
- [x] **Track C: Distributed BullMQ Workers**
  - [x] Build 9:01 AM Leaky Bucket Priority Queue (3-5 calls/min, max 5 channels/store).
  - [x] Build 2-Hour Zombie Stock Releaser (`Stock + 1`).
  - [x] Build 12-Hour Abandoned Partial Advance & Refund Ledger Sweeper.
  - [x] Build BullMQ queue manager and worker scheduler (`src/lib/worker/queue-manager.ts`).

### Phase 4: Dashboard UI & Persona Polish (No-AI-Slop)
- [x] Audit & polish all Bengali prompt files (`src/lib/ai/prompts.ts`, persona engines) with colloquial, empathetic tone.
- [x] Audit all merchant dashboard strings and notifications; strip corporate fluff ("delve", "streamline", "revolutionize").
- [x] Verify build integrity (`npx next build` and clean TypeScript diagnostics).
- [x] Final end-to-end verification and operational documentation.
