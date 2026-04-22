---
doc_type: ui-spec
status: draft
owner: TBD
last_reviewed: 2026-04-22
---

# Founding Rate Lock — Launch offer (frontend UX)

> Frontend (Angular app) behaviour for the launch-time Founding Rate Lock offer. Backend contract: `ats-fit-backend/docs/specs/10-founding-rate-lock-offer.md`. Marketing copy: `ats-fit-coming-soon-landing/docs/founding-rate-lock-offer.md`.

## Offer summary

First **100 waitlist signups** lock **Pro Monthly at $7.20/mo (40% off $12)** for the lifetime of the account. Redemption window: **7 days after launch (May 22, 2026)**. Rate persists across cancel/resume cycles.

## User-facing flows

### 1. Redemption flow (first-time Founding checkout)

**Entry points:**
- Deep link from launch email: `/founders?code=FOUND-XXXXX` → sign-in or sign-up, then redeem.
- Pricing page: authenticated Founding user sees `Apply my Founding code` CTA.

**Redemption page (`/founders`):**
- Hero: "Your Founding Rate — $7.20/mo for life."
- Countdown to `founding_code_expires_at` (real, from API; datetime displayed in user's timezone).
- Single primary CTA: `Activate my Founding Rate` → starts Pro Monthly checkout with `founding_code` in body.
- Error states (per backend error codes): `FOUNDING_CODE_INVALID`, `FOUNDING_CODE_EXPIRED`, `FOUNDING_ALREADY_REDEEMED`, `FOUNDING_TIER_FULL`. Each maps to a clear user message; no raw error codes shown.

### 2. Pricing page (post-redemption, Founding user)

- Pro Monthly card displays `$7.20/mo` as the primary price with `$12.00` struck through above it.
- Badge on the card: `Your Founding Rate — locked for life`.
- Tooltip on the badge: "This rate applies to every resumed subscription on this account."
- Pro Annual card shows standard pricing (Founding discount does not apply to annual).

### 3. Pricing page (non-Founding user)

- Standard $12/mo display. No Founding messaging visible after launch — the offer is closed to the public.
- If a non-Founding user lands on `/founders` without a valid code: show `This page was for waitlist members. Founding access is closed; here's what's available today →` with a link to `/pricing`.

### 4. Settings → Billing (Founding user)

- Subscription row shows `$7.20/mo (Founding Rate)` with the same "locked for life" badge.
- Cancel flow includes reassurance copy: "Your Founding Rate is preserved. Resubscribe any time at $7.20/mo."
- Resubscribe CTA appears in settings when there is no active Pro subscription — wording makes clear the rate is preserved.

### 5. Cancel → Resume cycle

- User cancels → subscription status `cancelled`, Founding badge/tag remains visible in Settings.
- Weeks or months later, user clicks `Resubscribe to Pro` in Settings or pricing page.
- Checkout automatically prices Pro Monthly at $7.20/mo based on `founding_rate_locked = true` from the plans API.
- No code re-entry required.

## Component breakdown (Angular)

| Component / Route | Responsibility |
|---|---|
| `/founders` route | Hero, countdown, redemption CTA, error states |
| `FoundingBadgeComponent` | Reusable badge: "Founding Rate — locked for life" |
| `PricingPlanCardComponent` | Accepts `displayPrice` / `standardPrice` from plans API; shows strikethrough when both are present |
| `CheckoutService` | Includes `founding_code` in `POST /subscriptions/checkout` body when present in query string or user state |
| `BillingSettingsComponent` | Renders Founding badge on active subscription; preserves messaging on cancel and resume |
| `LaunchCountdownPipe` / `LaunchCountdownComponent` | Formats `founding_code_expires_at` into `X days, Y hours` in user timezone |

## API dependencies (from frontend)

- `GET /subscriptions/plans` — expects `displayPrice` + `standardPrice` fields for Founding-locked users.
- `POST /subscriptions/checkout` — accepts optional `founding_code`.
- `GET /waitlist/counter` — **used only on the coming-soon landing, not the app**; listed here for reference.

## Error handling

Map backend error codes to user-facing messages:

| Backend code | User message |
|---|---|
| `FOUNDING_CODE_INVALID` | "This code isn't valid. Check the launch email, or contact support if you believe this is an error." |
| `FOUNDING_CODE_EXPIRED` | "The 7-day Founding redemption window has closed. Pro Monthly is available at standard pricing." |
| `FOUNDING_ALREADY_REDEEMED` | "Your Founding Rate is already active on this account. Head to billing to manage your subscription." |
| `FOUNDING_TIER_FULL` | "All 100 Founding slots are claimed. Standard Pro pricing is available." |

No error surface shows internal terms like "flag," "webhook," or database state.

## Visual / copy conventions

- Use the existing teal (`#0f766e`) for positive Founding affordances, consistent with landing-page branding.
- Never present Founding pricing as a "sale" or "discount" in-app post-redemption — it is **the user's locked rate**, not a promotion. Copy: "Your rate" / "Founding Rate" rather than "You save $X."
- Never show a Founding-rate banner to users without `founding_rate_locked = true`.

## Out of scope (frontend)

- Admin dashboards for Founding-slot management (handled by backend/admin tooling if implemented separately).
- Email rendering / delivery of the launch code (handled by backend + transactional email provider).
- A/B tests on the Founding landing page (handled in `ats-fit-coming-soon-landing`).

## Acceptance criteria

- [ ] **AC-FE-FRL-01:** `/founders?code=...` deep-link completes a successful redemption checkout end-to-end for an eligible user.
- [ ] **AC-FE-FRL-02:** Pricing page reflects `$7.20/mo` with `$12.00` strikethrough for authenticated Founding users only.
- [ ] **AC-FE-FRL-03:** Settings → Billing shows the Founding badge for active and cancelled Founding subscriptions.
- [ ] **AC-FE-FRL-04:** Cancel → resubscribe flow restores the subscription at $7.20/mo without code re-entry.
- [ ] **AC-FE-FRL-05:** Expired / invalid / tier-full states render the mapped user-facing messages and do **not** leak backend error codes.
- [ ] **AC-FE-FRL-06:** Non-Founding authenticated users see no Founding messaging anywhere in the app.

## Related docs

- Backend contract: `ats-fit-backend/docs/specs/10-founding-rate-lock-offer.md`
- Marketing / landing copy: `ats-fit-coming-soon-landing/docs/founding-rate-lock-offer.md`
- Full strategy rationale: `ats-fit-coming-soon-landing/LAUNCH_OFFER_STRATEGY.md`
