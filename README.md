# 🍕 Pizza Master G

An **awwward-winning**, high-performance e-commerce and POS (Point of Sale) platform built for **Pizza Master G**. Completely rebuilt with a premium Pizza Parlor aesthetic, fluid animations, and a secure, role-based backend architecture.

![Next.js](https://img.shields.io/badge/Next.js-14%2B-black?style=for-the-badge&logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-SSR_Auth-3ECF8E?style=for-the-badge&logo=supabase)
![TailwindCSS](https://img.shields.io/badge/Tailwind_v4-38B2AC?style=for-the-badge&logo=tailwind-css)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-Animations-0055FF?style=for-the-badge&logo=framer)

## ✨ Features

- **Awwward-Winning UI**: Deep dark backgrounds, warm accents, and stunning typography utilizing **Outfit**, **Plus Jakarta Sans**, and **Caveat**.
- **Fluid UX**: Buttery smooth scrolling powered by **Lenis** and physics-based layout animations via **Framer Motion**.
- **Secure Architecture**: Server-Side Rendering (SSR) Supabase integration with strictly enforced Row-Level Security (RLS) and cryptographically verified JWT sessions.
- **Robust State Management**: Hydration-safe, high-speed cart and global state managed seamlessly by **Zustand**.
- **Role-Based Dashboards**: 
  - 🛒 **Customer App**: Browsing, ordering, cart drawer, and order tracking.
  - 👨‍🍳 **Kitchen Dashboard**: Real-time order queues, TAT tracking, and rider management.
  - 📈 **Admin Dashboard**: Analytics, revenue calculators, inventory management, and branch-level KPI leaderboards.

## 🚀 Tech Stack

- **Framework**: [Next.js (App Router)](https://nextjs.org/)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **State**: [Zustand](https://github.com/pmndrs/zustand)
- **Animation**: [Framer Motion](https://www.framer.com/motion/) & [Lenis](https://lenis.studiofreight.com/)

## 📦 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/AreebIqbal6/pizzamasterg.git
cd pizzamasterg
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 4. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🛡️ Security

This project employs strict security practices:
- **No Client-Side Role Forging**: All sensitive actions rely on `supabase.auth.getUser()` server-side checks.
- **XSS Protection**: User inputs and WYSIWYG data are sanitized heavily using `isomorphic-dompurify`.
- **Protected Routes**: Next.js `middleware.ts` securely intercepts unauthorized access to `/admin-dashboard` and `/kitchen-dashboard`.

## 📜 Documentation
For in-depth architectural decisions, specs, and development logs, please reference the `docs/` directory containing the PRD, SRS, and internal learning journals.
