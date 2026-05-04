# Quota-Reached UX Redesign — Design Spec

**Date:** 2026-05-04
**Status:** Approved (ready for implementation plan)
**Owner:** Frontend
**Related backend:** No backend changes required — all data already exposed.

---

## 1 · Problem

Today, when a user hits a per-feature monthly quota for an AI action (Tailor Resume, Cover Letter, Batch Tailoring), the backend returns:

- HTTP `403`
- Body: `{ errorCode: 'ERR_RATE_LIMIT_EXCEEDED', currentUsage, limit, remaining, resetDate, feature, userType, plan }`

The frontend has no specific handling for this error code. It falls through to a generic `SnackbarService.showError(err.error?.message)` toast, which surfaces the raw backend message *"Rate limit exceeded for resume_generation"* — not human-readable, not actionable, no upgrade path. Premium users get the same toast as freemium users despite paying. Beta users on a 1-month trial get the same toast as everyone else, missing the conversion moment.

The current toast is the wrong primitive entirely.

## 2 · Goals

1. Replace the toast with an in-context, in-place experience on the same surface where the user just tried to act.
2. Differentiate copy and CTA by tier (freemium / beta-active / beta-expiring / paid premium).
3. Add lightweight prevention so users see usage approaching the limit before they crash into it.
4. Make the pattern reusable so adding a 4th rate-limited feature is drop-in, not a rewrite.
5. Don't require any backend changes — all needed data is already exposed.

### Non-goals

- One-time top-up purchases (defer; significant Stripe + accounting work).
- Higher-tier (Pro / Enterprise) plans (no plan tier above `PREMIUM` exists today).
- Inline quota visibility for `job_application_tracking` (low limit-hit rate; same components reusable for it later).
- Polling or background refresh of quota state.

## 3 · Tier model

Every authenticated user resolves to exactly one tier at any moment. The frontend already has all the inputs (`UserState.isPremiumUser`, `BetaState.isBetaUser`, `BetaStatus.betaAccessUntil`).

```
isBetaUser && betaAccessUntil > now
  ├── daysUntilExpiry > 7    → beta_active
  └── daysUntilExpiry ≤ 7    → beta_expiring_soon

isPremium && !isBetaUser     → premium_paid

(everything else)            → freemium
                                (includes ex-beta users whose trial expired
                                — system already downgraded them via cron)
```

`userTier` is a derived signal — it recomputes automatically when underlying state changes (e.g., a beta user's trial expires mid-session).

## 4 · Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  QuotaService          (new, signal-based, derives from existing    │
│                         UserState + BetaState — no new HTTP)        │
│   • quotaFor(feature)   →  Signal<FeatureQuotaState | null>         │
│   • userTier            →  Signal<UserTier>                         │
│   • betaDaysRemaining   →  Signal<number | null>                    │
├─────────────────────────────────────────────────────────────────────┤
│  QuotaInterceptor      (new HTTP interceptor)                       │
│   • Catches 403 + errorCode === 'ERR_RATE_LIMIT_EXCEEDED'           │
│   • Updates QuotaService cache with backend's authoritative numbers │
│   • Wraps as QuotaExceededError sentinel for callers to ignore      │
│   • Existing readHttpApiError helper recognizes sentinel and        │
│     returns null → existing snackbar.showError(...) calls become    │
│     no-ops automatically. ZERO changes in caller components.        │
├─────────────────────────────────────────────────────────────────────┤
│  Two new shared UI components:                                      │
│   • <app-feature-usage-chip>     (proactive — visible at ≥80%)      │
│   • <app-quota-reached-card>     (reactive — replaces action when 0)│
├─────────────────────────────────────────────────────────────────────┤
│  appQuotaGate directive (host-side integration glue)                │
│   • Wraps the action area of any AI feature button                  │
│   • Auto-swaps in <app-quota-reached-card> when remaining === 0     │
│   • Default content (button + chip) renders otherwise               │
├─────────────────────────────────────────────────────────────────────┤
│  QUOTA_COPY constant table (single source of truth — tier × feature)│
└─────────────────────────────────────────────────────────────────────┘

         used by:
            ↓
  • Tailor Resume modal       (resume_generation)
  • Cover letter component    (cover_letter)
  • Batch tailoring modal     (resume_batch_generation)
```

## 5 · Data model

### 5.1 · `FeatureQuotaState` (frontend-derived)

```typescript
interface FeatureQuotaState {
  feature: FeatureType;
  used: number;
  allowed: number;
  remaining: number;
  percentage: number;          // 0–100
  resetDate: Date;
  daysToReset: number;
  status: 'healthy' | 'approaching' | 'exhausted';
  // status mapping:
  //   percentage < 80          → healthy
  //   80 ≤ percentage < 100    → approaching
  //   remaining === 0          → exhausted
}
```

### 5.2 · `UserTier` enum

```typescript
type UserTier =
  | 'freemium'
  | 'beta_active'
  | 'beta_expiring_soon'
  | 'premium_paid';
```

### 5.3 · `QuotaExceededError`

```typescript
class QuotaExceededError extends Error {
  readonly isQuotaExceeded = true as const;
  constructor(
    public readonly feature: FeatureType,
    public readonly tier: UserTier,
    public readonly resetDate: Date,
    public readonly originalResponse: unknown,
  ) {
    super(`Quota exceeded for ${feature}`);
  }
}
```

`readHttpApiError` recognizes this and returns `null` so existing toast calls become no-ops.

## 6 · Copy matrix

Body copy substitutes:
- `{used}`, `{allowed}` — current usage and limit (e.g., 5, 5)
- `{resetDate}` — short month + day format (e.g., "May 31")
- `{daysToReset}` — integer days
- `{betaExpiryDate}` — short format
- `{betaDaysRemaining}` — integer days

Feature noun substitution:
- `resume_generation` → "Tailor"
- `cover_letter` → "cover letter"
- `resume_batch_generation` → "batch tailor"

| Tier | Headline | Body | Primary CTA | Secondary CTA |
|---|---|---|---|---|
| **freemium** | You're out of free {feature} credits | You've used **{used}/{allowed}** this month. Resets **{resetDate}** ({daysToReset}d). | **Upgrade to Premium** → `/billing` | View plans (link to `/billing`) |
| **beta_active** | Premium quota reached | You've used **{used}/{allowed}** this month. Quota resets **{resetDate}**. Your beta ends **{betaExpiryDate}** — upgrade now to keep premium quotas. | **Upgrade plan** → `/billing` | Maybe later (dismiss) |
| **beta_expiring_soon** | Your beta ends in **{betaDaysRemaining}** days | You've used your full premium quota. After your trial ends you'll revert to freemium with a smaller monthly allowance. Upgrade now to keep premium. | **Upgrade now** → `/billing` (warning-styled) | — |
| **premium_paid** | You've reached this month's limit | You've used **{used}/{allowed}** of your monthly quota. Resets **{resetDate}** ({daysToReset}d). | (none — passive) | Need more? **Contact us** (mailto) |

### Tone principles

- No exclamation marks. No "Oops!" No emojis (matches existing project convention).
- Numbers are bold for scannability.
- Reset date always shown both as absolute date and relative days — different users care about different framings.
- Premium-paid never sees an "upgrade" button. They already paid; pushing further is rude.
- Beta urgency only kicks in within the last 7 days. Earlier = informational, later = action-oriented.

## 7 · UI components

### 7.1 · `<app-feature-usage-chip [feature]="...">`

Quiet status pill that lives next to the action button. Hidden until usage ≥ 80%.

**Visual:**
```
┌──────────────────────────┐
│  4 / 5 used · resets 6d  │   ← amber tint at 80–99%, red tint at 100%
└──────────────────────────┘
```

**Behavior:**
- `hidden` if `quota.percentage < 80%`. Always rendered when ≥ 80%.
- `approaching` (80–99%): amber background tint (`hsl(36 100% 96%)`), amber-700 text.
- `exhausted` (100%): red tint, kept visible alongside the disabled action area for context.
- Position: inline-flex pill, rendered by the parent next to the primary action.
- `role="status"` so screen readers announce when it appears.
- No interactive behavior. Purely informational.

### 7.2 · `<app-quota-reached-card [feature]="...">`

Inline empty state that **replaces** the action area when `remaining === 0`. Single component, four visual variants (one per tier).

**Visual baseline:**
```
┌─────────────────────────────────────────────────────────────┐
│   [icon]   You're out of free Tailor credits                │
│            You've used 5/5 this month.                      │
│            Resets May 31 (27d).                             │
│                                                             │
│            ┌──────────────────────┐  ┌──────────────────┐   │
│            │  Upgrade to Premium  │  │   View plans     │   │
│            └──────────────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Per-tier visual treatment:**
- **freemium / beta_active:** soft slate-50 surface, slate-200 border, neutral icon (sparkles outline). Primary CTA brand-blue.
- **beta_expiring_soon:** same surface + amber accent (`border-l-4` amber-400, amber icon). Primary CTA amber-600 — urgency without alarm.
- **premium_paid:** soft surface, calm clock icon, no primary CTA — secondary "Contact us" only.

**Layout rules:**
- Padding/border-radius matches existing card surfaces.
- Width fills the action area's container.
- No close/dismiss button (the state is intrinsic to "you can't do this right now").

### 7.3 · `appQuotaGate` directive

Host-side glue. Hosts touch nothing else.

**Usage:**
```html
<div appQuotaGate feature="resume_generation">
  <button>Tailor resume</button>
  <app-feature-usage-chip feature="resume_generation" />
</div>
```

The directive subscribes to `QuotaService.quotaFor(feature)` and:
- When `status !== 'exhausted'`: renders default content (button + chip).
- When `status === 'exhausted'`: renders `<app-quota-reached-card>` instead.

This hides swap logic in one place — hosts never write `@if (quota.exhausted) { card } @else { button + chip }`. Eliminates drift between hosts.

## 8 · Reactive + pre-emptive strategy

### 8.1 · Pre-emptive (local-first)

When the host renders the gate, the directive reads `QuotaService.quotaFor(feature)`. If `remaining === 0`, the card renders immediately — user never gets a click to fail.

Catches the common case: user lands on dashboard, opens Tailor modal, modal already knows quota is gone.

### 8.2 · Reactive (interceptor backstop)

For when local state is stale (e.g., two tabs both showed `remaining: 1`, both clicked):

1. `QuotaInterceptor` catches 403 + matching errorCode.
2. Updates `QuotaService` cache with backend's authoritative numbers (`currentUsage`, `limit` from response payload).
3. Wraps as `QuotaExceededError` sentinel.
4. The directive's signal-bound view recomputes — card swaps in.
5. `readHttpApiError` recognizes the sentinel and returns `null` — existing `showError(...)` calls are no-ops.

User experience: click → brief loading → button area transforms into card. No toast, no jarring jump.

### 8.3 · When the toast still fires

The interceptor only suppresses the toast when **all three** match:
- HTTP status `403`
- Response body has `errorCode === 'ERR_RATE_LIMIT_EXCEEDED'`
- The feature in the response payload is one we have a quota gate for

Anything else — auth errors, validation, server errors — passes through unchanged. **No regression in unrelated paths.**

### 8.4 · Refresh strategy

- **On login / page load:** existing flow already loads `featureUsage` with the user. No change.
- **After a successful AI action:** decrement local `remaining` optimistically (`-1`); silent re-fetch of `users/feature-usage` after action settles.
- **On 403 quota error:** force-set `remaining: 0` in local state (interceptor does this).
- **No polling.** Quota changes are tied to user actions.

## 9 · Edge cases

| Case | Behavior |
|---|---|
| Zero quota AND user clicks anyway (race) | Backend 403 → interceptor catches → card renders. Same outcome as pre-emptive. |
| Beta expires mid-session | `BetaState.betaAccessUntil` already exposed. `userTier` recomputes; user reclassifies to `freemium` immediately. No ghost beta upsells. |
| `featureUsage` data missing/undefined | `quotaFor(feature)` returns `null` → directive renders default (button + chip). Fail-open. |
| Mid-flow batch operation hits limit | Interceptor force-updates state; batch result UI shows the quota card for un-attempted items. |
| `allowed: 0` (feature disabled for tier, e.g. `resume_batch_generation` for freemium) | Same UI as exhausted, but copy: "Not included in your plan." Primary CTA: Upgrade. |
| User in two tabs both hit limit at once | Both tabs receive 403; both interceptors update local state; both render card. Correct. |
| Backend response is malformed (missing fields) | Interceptor falls back to a generic exhausted state with copy: "You've reached your monthly limit." No crash. |

## 10 · Affected surfaces (initial implementation)

Three integration points in v1:

1. **Tailor Resume modal** — `src/app/features/tailor-apply/tailor-apply-modal.component.ts` (and child step components where the action button lives). Feature: `resume_generation`.
2. **Cover letter generator** — `src/app/features/tailor-apply/components/cover-letter-preview/cover-letter-preview.component.ts` (or wherever the generation trigger lives). Feature: `cover_letter`.
3. **Batch tailoring modal** — `src/app/features/tailor-apply/batch-tailoring-modal.component.ts`. Feature: `resume_batch_generation`.

Each integration is the same shape: wrap the action area with `[appQuotaGate]` and drop in `<app-feature-usage-chip>`.

## 11 · Testing

### Unit tests

- **`QuotaService.userTier`** — every classification: freemium, beta_active (>7d), beta_expiring_soon (≤7d), beta_expired-now-freemium, premium_paid.
- **`QuotaService.quotaFor(feature)`** — returns null for missing data; computes correct status thresholds (79/80/99/100%).
- **`QuotaInterceptor`** — 403 + matching errorCode + matching feature triggers suppression and state update; other 403s pass through unchanged.
- **`appQuotaGate` directive** — renders default content when healthy; renders card when exhausted; reacts to signal changes.
- **`<app-quota-reached-card>`** — renders correct copy + CTA per tier; no upgrade button for `premium_paid`.

### Manual / E2E

For each tier (seeded backend data + fake-clock):
1. Open Tailor Resume modal with `remaining > 0` → button works, chip hidden.
2. Open with `remaining === 1` and `allowed === 5` (80%) → chip visible (amber).
3. Open with `remaining === 0` → card visible, button NOT rendered, no toast on subsequent attempts.
4. Click upgrade → routes to `/billing` correctly.
5. (Beta only) Trigger fake clock to push `betaAccessUntil` from >7d to ≤7d → urgency variant kicks in on next render.

## 12 · Migration / rollout

Single PR. No phased rollout, no feature flag — the new error path is strictly an upgrade over the existing toast (existing toast becomes a no-op for these specific errors only).

**Rollback safety:** if `QuotaInterceptor` is removed, behavior reverts to the previous toast — no broken state. The new components are additive; nothing existing is renamed or removed.

## 13 · Out of scope (deferred)

- One-time top-up purchases for paid premium users hitting cap.
- Higher tier (Pro / Enterprise) — currently no plan above `PREMIUM` in the system.
- `job_application_tracking` quota gate integration. Components are reusable; this is one-line opt-in when needed.
- Quota analytics / instrumentation (capturing how often users hit limits, conversion rate from quota-card to upgrade).
- Email notifications on approaching quota.
