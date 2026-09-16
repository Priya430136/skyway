# SkyWay — Production Integration Pass

## What the audit found

- **~50 routes** across landing, `/app` (passenger), `/ops`, `/support`, `/admin`.
- **Auth is fake**: `src/lib/auth.tsx` stores a role in `localStorage`. Any email works, roles are self-selected, protected pages guard only in the browser, and nothing is tied to the backend. Real user accounts, sign-up, sessions and role checks do not exist.
- **Data is split-brain**: `/ops` reads real tables (flights, airports, aircraft, delays, notifications). Passenger, support and admin pages read hardcoded mock files (`src/lib/admin/mock.ts`, `src/lib/support/mock.ts`, inline arrays in `src/lib/passenger-pages.tsx`). There are **no tables** for bookings, passengers, seats, meals, baggage, payments, refunds, tickets, or user notifications.
- **Dead buttons are widespread**: nearly every admin page and most support/ops pages render buttons with no handler (e.g. `admin.flights` 5 buttons / 0 handlers, `support.tickets` 2 / 0, `ops.index` 2 / 0). Only ticket detail, copilot, ops flights and disruption manager have real handlers.
- **Booking flow is not a flow**: search, seat, meal, baggage, payment and boarding pass screens exist as separate demo screens with no shared state and no persisted booking.

Making all of this genuinely functional is a multi-stage build, not one edit. Below is the order I recommend, each stage leaving the app working.

## Stage 1 — Real accounts, roles, and route protection

- Replace localStorage auth with real backend auth: email/password sign-up + sign-in, plus Google.
- `profiles` table and a separate `user_roles` table (`passenger | ops | support | admin`) with a `has_role` check — roles assigned server-side, never chosen at the login screen.
- Move `/app`, `/ops`, `/support`, `/admin` under a real auth gate; add per-role guards, an `/unauthorized` page, a loading state while the session resolves, and correct post-login redirect per role.
- Landing page header reflects the live session; sign-out clears cached data.

## Stage 2 — Core data model

One migration creating the missing backbone, all with row-level security:

`bookings`, `booking_passengers`, `booking_segments`, `seat_assignments`, `meal_selections`, `baggage_items`, `payments`, `refunds`, `notifications`, `support_tickets`, `ticket_messages`, `ticket_events`.

Everything links to the existing `flights` / `aircraft` / `airports` tables so a change in one place is visible everywhere. Seeded with realistic rows so no screen is empty.

## Stage 3 — Passenger booking journey

Search → select flight → passenger details → seats → meals → baggage → review → payment → confirmation, carried through one persisted draft booking. Generates a real booking reference, appears immediately in My Trips, dashboard, notifications. Then check-in → boarding pass rendered from the actual booking, plus cancellation with refund record and fee calculation.

## Stage 4 — Operations wired to passengers

Ops controllers can actually change flight status, gate, delay, aircraft and cancellations. Each write updates the flight row and fans out notifications to affected bookings, so passenger Flight Status, dashboard, booking details and boarding pass reflect it live (realtime subscriptions on the flights and notifications tables).

Disruption Manager reads real flights, computes impact from real booking counts, and approving a recommendation performs the operational write.

## Stage 5 — Support and admin write paths

- Support tickets backed by the database, linked to passenger + booking + flight, with assign / priority / reply / note / escalate / resolve / reopen all persisted, and refunds and compensation creating real records.
- Admin CRUD for flights, aircraft, airports, routes, pricing, users/roles, announcements — writes go to the same tables ops and passengers read.
- AI features (Copilot, disruption AI, support AI) fed the actual queried rows instead of generic prompts.

## Stage 6 — Audit sweep and polish

Page-by-page pass: every remaining button either wired, converted to a link, or removed; every filter, sort, search field and table actually operating on its data; validation, loading, empty, error and unauthorized states on every data page; global search across flights, bookings, passengers, tickets, aircraft, airports; responsive check at mobile/tablet/desktop; dead code and duplicate pages removed. Then a full four-role walkthrough.

## Technical notes

Stays on the existing stack — TanStack Start routes, TanStack Query, existing backend and its generated client, server functions for writes, existing AI gateway for AI. No second database, no second auth system, no new API layer.

## How I suggest we run it

Each stage is a separate build, verified before the next. Stage 1 and 2 are prerequisites for everything else — real functionality is impossible while auth and the data model are fake. I'd start there unless you want a different entry point.
