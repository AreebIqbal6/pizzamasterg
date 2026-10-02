# Learning Journal: Pizza Master G Rebuild

## Overview
This journal documents the "whys and hows" of the architecture, design decisions, and technical implementation of the Pizza Master G rebuild. 

## 1. Project Initialization
**Why:** The original project had authentication issues, caching bugs, and structural flaws. The user requested an "award-winning," "smooth," and "error-free" rewrite utilizing clean code practices.
**How:** We established a strict Spec-Driven Workflow (PRD and SRS created first). The tech stack chosen is Next.js 14, React 19, TypeScript, and Supabase. Next.js provides the best blend of SEO, performance, and API route capabilities, while Supabase offers robust real-time database and auth features crucial for a POS system.

## 2. Resolving Caching Issues
**Why:** Next.js App Router has an aggressive caching mechanism which often leads to stale data being shown to users (e.g., outdated cart items or old menu prices).
**How:** 
- We are using `export const dynamic = 'force-dynamic'` on routes that require real-time data (like Dashboards and Checkout).
- We utilize **Zustand** for client-side state management (like the Cart) to ensure state is snappy, reactive, and not subject to server-side cache invalidation delays.

## 3. Resolving Authentication Issues
**Why:** Authentication state desync is a common issue in SSR applications.
**How:** 
- Implementing `@supabase/ssr` to securely set HttpOnly cookies.
- Creating robust middleware (`middleware.ts`) to intercept and protect routes based on session data and user roles seamlessly before page render.

## 4. Addressing Security Vulnerabilities
**Why:** The user explicitly outlined several advanced attack vectors (SSTI, ReDoS, LPDoS, Secret Leak, SQLi, Clipboard, Replay) that must be mitigated.
**How:**
- **SQLi:** Enforced via PostgreSQL parameterized queries (Supabase SDK) and strict Row Level Security (RLS) policies.
- **SSTI:** JSX natively escapes HTML, preventing template injection.
- **ReDoS:** Using simple, audited `Zod` schemas for validation.
- **Replay Attacks:** Implementing idempotency keys during the checkout phase so a user can't double-charge by resubmitting a request.

*(More entries will be added as the build progresses)*
