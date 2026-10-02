# Software Requirements Specification (SRS)
## Pizza Master G Rebuild

### 1. Technology Stack
- **Framework**: Next.js 14+ (App Router) with React 19.
- **Language**: TypeScript (Strict mode enabled).
- **Styling**: Tailwind CSS v4, Shadcn UI, Framer Motion / GSAP for animations (smooth, award-winning UI).
- **State Management**: Zustand (for robust global state like Cart, avoiding Next.js cache conflicts).
- **Backend/Database**: Supabase (PostgreSQL, Supabase Auth, Realtime Subscriptions).
- **Data Fetching**: React Query or native Next.js fetch with strict caching strategies (no stale data).
- **Icons**: Lucide React.
- **Testing**: Playwright (E2E) and Vitest (Unit).

### 2. File Structure & Clean Code Rules
- **`/app`**: Next.js App Router pages and API routes.
- **`/components`**: Reusable UI components grouped by feature (e.g., `/auth`, `/cart`, `/admin`, `/ui`).
- **`/lib`**: Utility functions, Supabase clients, constants, and types.
- **`/stores`**: Zustand state stores.
- **`/hooks`**: Custom React hooks.
- **`/types`**: Global TypeScript definitions.

### 3. Functional Requirements
#### 3.1 Authentication (Supabase Auth)
- Email/Password login and registration.
- Role-based access control (RBAC): `admin`, `kitchen`, `customer`.
- Secure session management using server-side cookies (`@supabase/ssr`).

#### 3.2 Ordering System
- Branch-specific inventory and pricing.
- Real-time cart updates (synced across tabs via local storage/Zustand).
- Checkout flow generating unique Order IDs and creating records in `orders` and `order_items` tables.

#### 3.3 Dashboards
- **Kitchen**: Subscribes to Supabase Realtime for instant order injection. Push notifications / audio alerts.
- **Admin**: Full CRUD capabilities on the `menu`, `categories`, and `branches` tables. Role management via Supabase custom claims or a user profiles table.

### 4. Security Specifications
The platform MUST be hardened against the following identified attack vectors:
- **SSTI (Server-Side Template Injection)**: Handled inherently by React/Next.js JSX rendering which escapes values. No raw template engines will be used.
- **ReDoS (Regular Expression Denial of Service)**: Avoid complex regex for form validation; rely on established libraries (like Zod).
- **LPDoS (Long Polling Denial of Service)**: Use WebSocket-based Supabase Realtime instead of long polling to minimize server connection exhaustion.
- **Secret Key Leaks**: All secrets (Supabase anon keys, service roles) stored in `.env.local`. CI/CD pipelines will use injected environment variables.
- **NoSQL/SQL Injection**: Supabase utilizes PostgreSQL. All queries will use the Supabase ORM/SDK which parameterizes queries automatically. Row Level Security (RLS) policies will strictly enforce data access.
- **Clipboard Attack**: Sensitive information (like passwords or reset tokens) will not be copyable via JS without explicit UI interaction. Inputs sanitized against pasting malicious payloads.
- **Replay Attack**: Idempotency keys used on checkout endpoints. Nonces on auth actions to prevent payload re-submission.

### 5. Performance & Reliability (No Cache Issues)
- Bypass aggressive caching for authenticated or dynamic routes (`export const dynamic = 'force-dynamic'`).
- Use React 19 `useOptimistic` or Zustand for instantaneous UI feedback without waiting for network roundtrips.
- Strict cache invalidation on mutations (e.g., when an admin updates the menu).
