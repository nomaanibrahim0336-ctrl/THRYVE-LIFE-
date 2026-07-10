# Vitalis

> Working codename. **Do not ship this name** until a real USPTO / EUIPO trademark
> search clears it — "Vitalis" is heavily used in health/wellness/pharma classes.

An offline-first mobile wellness app built around one thing: the **daily loop** —
**mood → habits → weekly AI reflection**. Everything else (nutrition, sleep,
wearables, community, PDF reports) is deliberately deferred until this core loop
retains users.

## Stack

- **React Native + Expo (TypeScript)** — Expo Router for file-based navigation.
- **SQLite (`expo-sqlite`)** — offline-first; every write lands on-device instantly.
- **Supabase** — Postgres + Auth + Row-Level Security + Edge Functions.
- **Zustand + TanStack Query** — state.
- **Claude (via a Supabase Edge Function)** — weekly reflection; the API key stays server-side.

The app runs **fully without a backend** ("local-only mode"): mood + habits work
against SQLite and reflections fall back to a local heuristic. Wire up Supabase to
add auth, cloud sync, and AI reflections.

## Project layout

```
app/                      Expo Router screens
  _layout.tsx             Providers (SafeArea, Query, theme, status bar)
  (tabs)/                 Bottom-tab navigator: Home | Mood | Habits | Reflect | Profile
src/
  components/ui.tsx       Themed Card / Button / typography
  features/
    mood/                 moodStore (SQLite-backed), scale metadata
    habits/               habitStore, streak engine, Heatmap
    reflect/              week summary + reflection (AI or local fallback)
  lib/
    db.ts                 SQLite schema + migrations (WAL, sync flags)
    supabase.ts           client + isSupabaseConfigured guard
    id.ts                 uid / date helpers
  theme/                  light/dark tokens + useTheme
supabase/
  migrations/0001_init.sql  Postgres schema mirroring SQLite, with RLS
  functions/reflect/        Edge function: Claude call + safety guardrails
```

## Getting started

```bash
npm install
cp .env.example .env        # optional — leave blank to run local-only
npm start                   # then press i (iOS), a (Android), or scan the QR
```

### Wiring up Supabase (optional, enables auth + sync + AI)

1. Create a project at supabase.com and put the URL + anon key in `.env`.
2. Apply the schema: run `supabase/migrations/0001_init.sql` (SQL editor or CLI).
3. Deploy the reflection function and set the key:
   ```bash
   supabase functions deploy reflect
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   ```

## Scope guardrails (read before adding features)

This is an **MVP scaffold**, intentionally minimal. Two product decisions are baked in:

1. **Wellness, not medical.** The reflection prompt and UI never diagnose or treat.
   Keep it that way — it shapes App Store review answers and liability.
2. **The loop is the product.** Resist feature bloat. Ship, get ~20 real users,
   then decide what Phase 2 earns its place.

## Auth, sync, reminders (built)

- **Email OTP sign-in** (`app/(auth)/login.tsx`, `src/features/auth/authStore.ts`) —
  request a code, verify, done. An auth gate in `app/_layout.tsx` routes signed-out
  users to `/login`. In local-only mode auth is skipped entirely.
- **Two-way sync engine** (`src/lib/sync.ts`) — **push**: drains `synced = 0` rows
  to Supabase (upsert on `id`, timestamp-wins). **pull**: downloads the user's cloud
  rows into SQLite, overwriting a local row only when the remote `updated_at` is newer.
  Runs on login, app foreground, after each write, and on reconnect (NetInfo).
- **Two-way deletes via tombstones** — moods, habits, and check-ins carry a `deleted`
  flag instead of being hard-removed, so unchecking a habit or deleting an entry
  propagates across devices. Long-press to delete a mood entry or a habit.
- **Local daily reminders** (`src/features/notifications/`) — optional morning
  check-in and evening reflection, each with a time picker, scheduled as repeating
  daily local notifications (no push server). Configured in Profile.

## Tests

`npm test` (Jest + jest-expo). Covers the two pieces of real logic:
- `streak.ts` — the consecutive-day streak engine (edge cases: gaps, today-not-yet-done).
- `summary.ts` — the local reflection copy (tone + never-clinical safety check).

## What's not built yet (next steps)

- **Backend wiring** — create the Supabase project, fill `.env`, run the migration,
  deploy the `reflect` function. Until then the app runs local-only. (See "Wiring up
  Supabase" above.)
- Pull-side reconciliation for check-in id divergence across 3+ devices (rare).
