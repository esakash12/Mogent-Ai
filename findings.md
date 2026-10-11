# Mogent AI Architecture & Migration Findings

## 1. Executive Summary & Existing SaaS Inspection
- **Current Technology Stack:**
  - Next.js 14 App Router (`src/app/`, `src/components/`, `src/lib/`)
  - Prisma ORM (`prisma/schema.prisma`) connected to PostgreSQL
  - Tailwind CSS & Lucide React UI
  - Meta OAuth & Webhooks implemented in `src/app/api/webhooks/meta` & `src/lib/meta/`
  - Couriers (Steadfast & Pathao) implemented in `src/lib/couriers/`
  - Gemini AI model switcher & prompts in `src/lib/ai/`
  - WhatsApp & SMS client in `src/lib/`
  - Untouchable directory: `Dont Edit or write/` (Preserve 100% untouched)

## 2. Gap Analysis Against "Mogent AI Blueprint v14.0"
| Architectural Component | Existing State | Target Blueprint State | Action Required |
| :--- | :--- | :--- | :--- |
| **Database Isolation** | Prisma tenantId application filters | PostgreSQL 16 Kernel-level Row Level Security (RLS) (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`, `SET LOCAL app.current_tenant_id`) | Add SQL RLS migrations & RLS Prisma/pg client hook |
| **Context-Aware Stock Locks** | In-memory / Basic order creation | Dedicated `stock_locks` table with night DND extension, 50% night cap, instant payer pre-emption | Implement `stock_locks` schema, Redis mutex, and pre-emption logic |
| **Burst Message Debouncer** | Direct webhook message processing | 3.5s quiet window Redis debouncer aggregating split messages ("ভাইয়া", "আছেন?") | Build Redis-backed 3.5s burst aggregator & pipeline |
| **Voice Telephony & AMD** | Basic call trigger mock | WebSocket SIP / RTP Bridge + 3-second spectral acoustic & keyword AMD filter (G.711 to 24kHz PCM) | Build Voice Engine on WebSocket (Port 5000) with Bengali AMD |
| **Distributed Queue Workers** | Standard sync execution | BullMQ + Redis for 9:01 AM Leaky Bucket, Zombie Stock Releaser (2h), and 12h Partial Advance Sweeper | Implement BullMQ worker cluster for scheduled logistics & DND calls |
| **Courier COD Formula** | Basic calculation | Strict `Courier COD Amount = max(0, (Product + Delivery) - Advance Received)` + Post-Booking Cancel Hook | Hardcode mathematical COD integrity & real-time courier cancel hook |
| **Doctor/Salon Atomic Slots** | Retail-only schema | `appointment_slots` with 5-minute atomic mutex (`SELECT FOR UPDATE`) | Add appointment slot concurrency for hybrid/clinic merchants |
| **Security & Sandbox** | Standard prompt construction | Zero Prompt Injection sandbox, deterministic Zod schema enforcement, HMAC-SHA256 webhooks | Enforce Zod structured tool output & HMAC signature validation |
| **No-AI-Slop Persona** | Standard AI assistant tone | Colloquial, empathetic Bengali persona; zero corporate buzzwords or AI filler | Polish all system prompts & dashboard notifications |

## 3. Preservation Guardrails
- `Dont Edit or write/`: Strictly preserve without modifications.
- Existing database credentials & tenant associations must be backward-compatible.
- Super Admin and Merchant cockpit interfaces remain intuitive and responsive.
