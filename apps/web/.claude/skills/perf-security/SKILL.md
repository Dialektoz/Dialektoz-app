---
name: perf-security
description: >-
  Dialektoz performance + security discipline. Invoke when writing or reviewing
  any feature that touches data fetching, auth, RLS, Server Components, the
  middleware, database migrations, or Supabase RPCs — i.e. almost every change.
  Push performance to the limit WITHOUT ever weakening security. Applies to the
  Next.js 16 (App Router, RSC) + Supabase + Cloudflare R2 + Vercel stack.
---

# Performance + Security discipline (Dialektoz)

The rule that dominates every trade-off: **chase the performance ceiling, but never
trade away security to get there.** If a speed-up requires loosening RLS, exposing a
`SECURITY DEFINER` function, skipping `auth.getUser()` validation, or trusting client
input, it is not allowed — find another way or stop.

Read this before touching data fetching, auth, the middleware, RSC boundaries,
migrations, or RPCs. It encodes decisions already made in this repo; follow them
instead of re-deriving.

---

## 0. Measure before optimizing

- Never "optimize" on a hunch. Before claiming a perf win, know the actual cost:
  is it a network round-trip, an unindexed scan, a client waterfall, or a region
  mismatch? The biggest real latency lever is usually **Supabase↔Vercel region
  co-location**, not a single indexed query.
- After ANY schema/DDL change run both advisors and treat the output as the
  source of truth, not intuition:
  - `mcp__supabase__get_advisors { type: "performance" }`
  - `mcp__supabase__get_advisors { type: "security" }`
- An indexed single-row PK lookup is cheap. Don't rewrite critical auth code to
  shave one of those; do eliminate client-side waterfalls and duplicate fetches.

---

## 1. Data fetching — kill round-trips, never correctness

**Fetch on the server, deduplicate per render.**

- Prefer async Server Components over client-side fetching. A client component that
  fetches its own user/profile causes extra round-trips AND a content flash on every
  navigation. See the sidebar pattern: `Sidebar.tsx` (async server wrapper) →
  `SidebarClient.tsx` (interactive shell, receives `{name, role}` as props).
- Share session reads through the request-scoped cache helpers in
  `src/utils/supabase/session.ts`:
  - `getCurrentUser()` — cached `auth.getUser()`.
  - `getCurrentProfile()` — cached profile (id, role, name, email, avatarUrl).
  - `cache()` dedups within ONE server render pass. The page and the sidebar both
    calling `getCurrentProfile()` = a single DB fetch, not two. Always route page-level
    user/profile needs through these helpers rather than a fresh `supabase.auth.getUser()`.
  - If a page needs extra profile columns not in `getCurrentProfile`, keep its own
    targeted query for those columns but still get the user via `getCurrentUser()`.
- Parallelize independent queries with `Promise.all` — never `await` them in series.
- `cache()` does NOT cross execution contexts: the middleware and the RSC render are
  separate, so the middleware's `getUser()` is not deduped with the page's. Don't try
  to bridge them.

**Non-negotiable:** `supabase.auth.getUser()` validates the token and is the correct
SSR pattern. Never replace it with `getSession()` alone to "save a call" in a security
decision — `getSession` does not revalidate.

---

## 2. Middleware — it runs on every navigation

- Keep it lean: every line runs per request. Remove dead work (e.g. headers that are
  set but never read).
- Do NOT put logic between `createServerClient` and `auth.getUser()` — it can silently
  log users out. This warning is in the file; respect it.
- The per-navigation `profiles` query (role + onboarding gating) stays unless the team
  explicitly adopts a JWT custom-access-token hook. That hook is the only way to remove
  it, but it touches critical auth, depends on a dashboard toggle, and risks onboarding
  redirect loops — treat it as an opt-in with a DB-query fallback, never a silent rewrite.

---

## 3. Security — the floor that performance never breaches

- **RLS is mandatory** on every table holding user data. A faster query that bypasses
  RLS is a vulnerability, not an optimization.
- Write RLS with the init-plan optimization: wrap auth calls in a scalar subquery so
  they evaluate once per query, not once per row — `using ((select auth.uid()) = user_id)`.
  This is a pure win: same security, far less per-row cost. Apply it to every policy.
- `SECURITY DEFINER` functions:
  - Must guard internally with `auth.uid()` / `is_staff()` — never assume the caller is
    trusted just because the function is definer.
  - Revoke `EXECUTE` from `public`/`anon`/`authenticated` on anything not meant to be an
    RPC endpoint (trigger functions especially).
  - A definer function that is *intentionally* public (e.g. `verify_certificate` for the
    `/verify` page) or intentionally authenticated (leaderboard RPCs) will still show as
    an advisor WARN. That is acceptable **only** when the exposure is deliberate and the
    function is safe to call — document why. Never silence a WARN you don't understand.
- Never trust client input for authorization or grading. Exam grading, progress, and
  scoring happen server-side (`src/lib/exam/grading.ts`, `record_progress` RPC).
- Prohibited actions (entering credentials, moving money, etc.) and secrets handling
  follow the global safety rules — no exceptions for "performance".

---

## 4. Database

- Cover every foreign key used in a hot path with an index. New FK → add its index in
  the same migration.
- Version all schema changes as migration files under `supabase/migrations/` — never
  hand-edit the remote schema so it drifts from the repo.
- "Unused index" INFO advisories on a low-traffic / pre-launch project are expected
  (the index is empty, not wrong). Don't drop indexes that exist to serve scale.

---

## 5. Media / R2

- Uploads go through presigned PUTs; deletes clean up the object (see `src/lib/r2.ts`,
  `api/uploads/*`). When content is removed or replaced, delete the old R2 object so
  storage doesn't leak.
- Content upload signing is staff-only; avatars are per-user (`avatars/<uid>/`). Keep
  authorization on the server route, not the client.

---

## 6. Frontend perf

- Server Components by default; add `'use client'` only for genuine interactivity, and
  push it as far down the tree as possible (a small client leaf, not a whole page).
- Pass server-fetched data down as props instead of refetching on the client.
- Use `Promise.all` for independent awaits; avoid request waterfalls in layouts/pages.

---

## Definition of done for a change

1. `npx tsc --noEmit` clean.
2. `npm run build` clean (compiles + generates all static pages).
3. If DDL changed: both advisors run, no new ERROR, and every remaining WARN is
   understood and either fixed or justified in writing.
4. No security control was weakened to gain speed. If a trade-off between speed and
   security appeared, security won.
5. User-only dashboard actions (region co-location, leaked-password protection, auth
   hooks) are surfaced explicitly to the user — they are not code and must not be
   silently assumed done.
