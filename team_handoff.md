# Pizza Master G - Team Handoff Document

## Section 1: Architecture Summary
This application is built on a modern, high-performance stack:
- **Frontend Framework**: Next.js (App Router)
- **Backend & Database**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase SSR Auth with Google OAuth and Email/Password
- **Mapping & Location**: Leaflet Maps
- **SMS & Verification**: Twilio OTP
- **Data Integrity**: ACID-compliant RPCs for transactions (Logistics, Orders, Inventory)

## Section 2: The Current Blocker
The UI and backend are finished, but the authentication state is currently clashing. Previous attempts to use isolated multi-tenant cookies corrupted the routing. Your first task is to restore strict, single-session Supabase SSR Auth and fix the Next.js hydration race conditions on the login pages.

## Section 3: Setup Instructions
To get this project running locally, follow these steps:

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Environment Variables**:
   Copy the example environment file and fill in your credentials.
   ```bash
   cp .env.example .env.local
   ```
3. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Access the application at `http://localhost:3000`.
