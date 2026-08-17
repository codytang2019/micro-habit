# Micro Habit

A tiny habit tracker built with Next.js (App Router) and Supabase (database + auth, including Google sign-in).

## Stack

- Next.js 15 (App Router, TypeScript)
- Tailwind CSS
- Supabase (Postgres database, Auth with email/password + Google OAuth)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase project values (Dashboard -> Project Settings -> API):

```bash
cp .env.local.example .env.local
```

### 3. Run the database migrations

In the Supabase Dashboard, open **SQL Editor** and run the files in `supabase/migrations/` in order:

1. `0001_profiles.sql` — creates the `profiles` table linked to `auth.users`, with row-level security and a trigger that auto-creates a profile on sign-up.
2. `0002_habits.sql` — creates `habits` and `habit_logs` tables, RLS-protected per user.

(If you have the Supabase CLI linked to this project, `supabase db push` will apply them instead.)

### 4. Enable Google sign-in

In the Supabase Dashboard:

1. Go to **Authentication -> Providers -> Google** and enable it.
2. Create OAuth credentials in the [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
   - Application type: **Web application**
   - Authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`
3. Paste the Google **Client ID** and **Client Secret** into the Supabase provider settings and save.
4. In **Authentication -> URL Configuration**, add your site URLs (e.g. `http://localhost:3000` and your Vercel production URL) to **Redirect URLs**.

### 5. Run locally

```bash
npm run dev
```

Visit `http://localhost:3000`.

## Deploying to Vercel

1. Push this repo to GitHub (already connected to the `micro-habit-prototype` Vercel project).
2. In Vercel -> Project -> Settings -> Environment Variables, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (your production URL, e.g. `https://micro-habit-prototype.vercel.app`)
3. Redeploy.
4. Make sure the production URL is also added to Supabase's **Redirect URLs** (step 5 above) and that the Google OAuth consent screen is configured for production use if needed.

## How auth works here

- `src/lib/supabase/client.ts` — Supabase client for Client Components.
- `src/lib/supabase/server.ts` — Supabase client for Server Components / Route Handlers / Server Actions.
- `src/middleware.ts` + `src/lib/supabase/middleware.ts` — refreshes the auth session on every request and redirects signed-out users away from `/dashboard`.
- `src/app/login` — sign-in/sign-up page with email+password and "Continue with Google".
- `src/app/auth/callback/route.ts` — handles the redirect back from Supabase after OAuth or email confirmation.
- `src/app/dashboard` — example protected page that reads the signed-in user's profile.
