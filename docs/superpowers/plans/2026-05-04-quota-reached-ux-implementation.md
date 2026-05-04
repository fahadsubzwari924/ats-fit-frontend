# Quota-Reached UX Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-05-04-quota-reached-ux-design.md`

**Goal:** Replace the raw "rate limit exceeded" toast with an in-place, tier-aware quota-reached experience (proactive usage chip + reactive empty-state card) across the three AI features (resume tailoring, cover letter, batch tailoring).

**Architecture:** Signal-based `QuotaService` derives state from existing `UserState` + `BetaState`. A functional `QuotaInterceptor` catches `403 ERR_RATE_LIMIT_EXCEEDED`, refreshes local quota, and wraps as a sentinel `QuotaExceededError` so the existing `readHttpApiError` helper auto-suppresses toasts. Two visual components (`<app-feature-usage-chip>`, `<app-quota-reached-card>`) and an `appQuotaGate` directive provide the UI surface. Integration is one-line at each call site.

**Tech Stack:** Angular 19 (standalone, signals, OnPush), TypeScript, SCSS with design tokens.

**Repo:** `/Users/fahadsubzwari924/Documents/sideProjects/ATS_FIT/ats-fit-frontend`
**Branch:** `feat/job-application-frontend-redesign` (continue current branch)

---

## Conventions for this plan

- **No unit tests.** Verification is build-clean + manual exercising of the UI states.
- **No per-task commits.** Stage changes locally, but **do not run `git commit` between tasks.** All work lands in a single review-and-commit pass at the end (Task 15) once the user has reviewed.
- **Build check after every task.** `npm run build` must produce zero errors before moving on.

---

## File map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/app/core/enums/feature-type.enum.ts` | **Create** | Frontend mirror of backend `FeatureType` enum |
| `src/app/core/models/quota/user-tier.type.ts` | **Create** | `UserTier` discriminated union |
| `src/app/core/models/quota/feature-quota-state.model.ts` | **Create** | `FeatureQuotaState` interface + status helpers |
| `src/app/core/errors/quota-exceeded.error.ts` | **Create** | `QuotaExceededError` sentinel class |
| `src/app/core/states/quota.state.ts` | **Create** | `QuotaState` (derived signals: `userTier`, `quotaFor()`, `betaDaysRemaining`) |
| `src/app/core/interceptors/quota.interceptor.ts` | **Create** | Functional HTTP interceptor for 403 quota errors |
| `src/app/features/applications/lib/read-http-api-error.ts` | **Modify** | Recognize `QuotaExceededError` → return `undefined` |
| `src/app/app.config.ts` | **Modify** | Register `quotaInterceptor` in interceptor chain |
| `src/app/shared/constants/quota-copy.constant.ts` | **Create** | Tier × feature copy matrix |
| `src/app/shared/components/feature-usage-chip/feature-usage-chip.component.ts` | **Create** | Quiet status pill, hidden < 80% |
| `src/app/shared/components/quota-reached-card/quota-reached-card.component.ts` | **Create** | Inline empty-state replacement card |
| `src/app/shared/directives/quota-gate.directive.ts` | **Create** | `appQuotaGate` — auto-swaps default content with card |
| `src/app/features/tailor-apply/tailor-apply-modal.component.{ts,html}` | **Modify** | Wrap action area with `appQuotaGate` |
| `src/app/features/tailor-apply/components/cover-letter-preview/cover-letter-preview.component.{ts,html}` | **Modify** | Wrap action area with `appQuotaGate` |
| `src/app/features/tailor-apply/batch-tailoring-modal.component.{ts,html}` | **Modify** | Wrap action area with `appQuotaGate` |

---

## Task 1 — `FeatureType` enum (frontend mirror)

**path:** `src/app/core/enums/feature-type.enum.ts`

**intent:** Provide a typed identifier for AI-rate-limited features so components, services, and the interceptor share a single source of truth. Mirrors backend `FeatureType` enum string values exactly.

**verify:** `cd /Users/fahadsubzwari924/Documents/sideProjects/ATS_FIT/ats-fit-frontend && npm run build 2>&1 | grep -E "ERROR|error TS"` → no output.

**agency:** `Frontend Developer` · `@agency-frontend-developer.mdc`

**docs:**
- `docs/superpowers/specs/2026-05-04-quota-reached-ux-design.md` §5
- Backend reference (string values must match exactly): `src/database/entities/usage-tracking.entity.ts` → `FeatureType` enum

---

- [ ] **Step 1: Create the file with all four feature values**

```typescript
// src/app/core/enums/feature-type.enum.ts
/**
 * Mirrors backend `FeatureType` enum (string values must match exactly).
 * Identifies AI features that are rate-limited per billing cycle.
 */
export enum FeatureType {
  RESUME_GENERATION = 'resume_generation',
  COVER_LETTER = 'cover_letter',
  RESUME_BATCH_GENERATION = 'resume_batch_generation',
  JOB_APPLICATION_TRACKING = 'job_application_tracking',
}
```

- [ ] **Step 2: Build check**

```bash
cd /Users/fahadsubzwari924/Documents/sideProjects/ATS_FIT/ats-fit-frontend
npm run build 2>&1 | tail -5
```
Expected: `Application bundle generation complete.` with no `ERROR` lines.

---

## Task 2 — `UserTier` type + `FeatureQuotaState` interface

**path:**
- `src/app/core/models/quota/user-tier.type.ts`
- `src/app/core/models/quota/feature-quota-state.model.ts`

**intent:** Define the four tier classifications and the per-feature quota snapshot shape that `QuotaState` will return to consumers.

**verify:** `npm run build 2>&1 | grep -E "ERROR|error TS"` → no output.

**agency:** `Frontend Developer` · `@agency-frontend-developer.mdc`

**docs:**
- `docs/superpowers/specs/2026-05-04-quota-reached-ux-design.md` §3, §5

---

- [ ] **Step 1: Create the `UserTier` type**

```typescript
// src/app/core/models/quota/user-tier.type.ts
/**
 * Classification of a user for quota messaging purposes.
 *
 * - `freemium`            — never paid, or beta trial expired (system already downgraded).
 * - `beta_active`         — beta_access_until > now, > 7 days remaining.
 * - `beta_expiring_soon`  — beta_access_until > now, ≤ 7 days remaining.
 * - `premium_paid`        — plan === PREMIUM and not currently in beta.
 */
export type UserTier =
  | 'freemium'
  | 'beta_active'
  | 'beta_expiring_soon'
  | 'premium_paid';

export const BETA_EXPIRING_SOON_THRESHOLD_DAYS = 7;
```

- [ ] **Step 2: Create the `FeatureQuotaState` interface**

```typescript
// src/app/core/models/quota/feature-quota-state.model.ts
import { FeatureType } from '@core/enums/feature-type.enum';

export type FeatureQuotaStatus = 'healthy' | 'approaching' | 'exhausted';

/** Threshold at which the proactive usage chip becomes visible. */
export const QUOTA_APPROACHING_THRESHOLD_PERCENT = 80;

/**
 * Per-feature snapshot consumed by the chip, card, and directive.
 * Computed by `QuotaState.quotaFor(feature)` from `UserState.featureUsage`.
 */
export interface FeatureQuotaState {
  feature: FeatureType;
  used: number;
  allowed: number;
  remaining: number;
  /** Integer 0–100. */
  percentage: number;
  resetDate: Date;
  daysToReset: number;
  status: FeatureQuotaStatus;
}

/**
 * Pure status classifier. Exposed so consumers (and edge-case branches
 * like `allowed === 0`) can call it directly.
 */
export function classifyQuotaStatus(
  remaining: number,
  percentage: number,
): FeatureQuotaStatus {
  if (remaining <= 0) return 'exhausted';
  if (percentage >= QUOTA_APPROACHING_THRESHOLD_PERCENT) return 'approaching';
  return 'healthy';
}
```

- [ ] **Step 3: Build check**

```bash
npm run build 2>&1 | tail -5
```
Expected: zero errors.

---

## Task 3 — `QuotaExceededError` sentinel class

**path:** `src/app/core/errors/quota-exceeded.error.ts`

**intent:** A typed sentinel error that the interceptor wraps quota-exhaustion responses in. Existence of this class is what `readHttpApiError` (Task 5) checks to suppress the toast — no string-matching, no error-code grepping in callers.

**verify:** `npm run build 2>&1 | grep -E "ERROR|error TS"` → no output.

**agency:** `Frontend Developer` · `@agency-frontend-developer.mdc`

**docs:**
- `docs/superpowers/specs/2026-05-04-quota-reached-ux-design.md` §5.3

---

- [ ] **Step 1: Create the error class with type guard**

```typescript
// src/app/core/errors/quota-exceeded.error.ts
import { FeatureType } from '@core/enums/feature-type.enum';
import { UserTier } from '@core/models/quota/user-tier.type';

/**
 * Thrown by QuotaInterceptor when backend returns 403 + ERR_RATE_LIMIT_EXCEEDED.
 * Has a tagged literal `isQuotaExceeded: true` so consumers (`readHttpApiError`,
 * components catching errors) can recognize it without instanceof, which can
 * fail across module boundaries / lazy chunks.
 */
export class QuotaExceededError extends Error {
  readonly isQuotaExceeded = true as const;

  constructor(
    public readonly feature: FeatureType,
    public readonly tier: UserTier,
    public readonly used: number,
    public readonly allowed: number,
    public readonly resetDate: Date,
    public readonly originalResponse: unknown,
  ) {
    super(`Quota exceeded for ${feature}`);
    this.name = 'QuotaExceededError';
  }
}

export function isQuotaExceededError(err: unknown): err is QuotaExceededError {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { isQuotaExceeded?: unknown }).isQuotaExceeded === true
  );
}
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | tail -5
```
Expected: zero errors.

---

## Task 4 — `QuotaState` service (signal-based)

**path:** `src/app/core/states/quota.state.ts`

**intent:** Single signal-based source of truth for tier classification and per-feature quota lookups. Pure derivation from `UserState` + `BetaState` — no HTTP, no side effects except the explicit `markFeatureExhausted(feature, used, allowed, resetDate)` method invoked by the interceptor.

**verify:** `npm run build 2>&1 | grep -E "ERROR|error TS"` → no output.

**agency:** `Frontend Developer` · `@agency-frontend-developer.mdc`

**docs:**
- `docs/superpowers/specs/2026-05-04-quota-reached-ux-design.md` §3, §5
- `src/app/core/states/beta.state.ts` (mirror this signal-service pattern)
- `src/app/core/states/user.state.ts` (existing `featureUsage` signal)
- `src/app/core/models/user/feature-usage.model.ts` (`FeatureUsage` shape)
- `src/app/core/models/beta/beta-status.model.ts` (`betaAccessUntil` field)

---

- [ ] **Step 1: Create the service**

```typescript
// src/app/core/states/quota.state.ts
import { computed, inject, Injectable, Signal, signal } from '@angular/core';
import { UserState } from './user.state';
import { BetaState } from './beta.state';
import { FeatureType } from '@core/enums/feature-type.enum';
import { FeatureUsage } from '@core/models/user/feature-usage.model';
import {
  classifyQuotaStatus,
  FeatureQuotaState,
} from '@core/models/quota/feature-quota-state.model';
import {
  BETA_EXPIRING_SOON_THRESHOLD_DAYS,
  UserTier,
} from '@core/models/quota/user-tier.type';

const MS_PER_DAY = 86_400_000;

/**
 * Single source of truth for quota classification and lookup.
 * Pure derivation from UserState + BetaState — no HTTP, no side effects
 * except the explicit `markFeatureExhausted()` method invoked by the interceptor.
 */
@Injectable({ providedIn: 'root' })
export class QuotaState {
  private readonly userState = inject(UserState);
  private readonly betaState = inject(BetaState);

  /** Server-forced overrides keyed by feature, applied on top of userState.featureUsage. */
  private readonly overrides = signal<Map<FeatureType, FeatureQuotaState>>(new Map());

  /** Days until beta expires; null if not in beta or already expired. */
  readonly betaDaysRemaining: Signal<number | null> = computed(() => {
    const status = this.betaState.betaStatus();
    if (!status?.isBetaUser || !status.betaAccessUntil) return null;
    const ms = status.betaAccessUntil.getTime() - Date.now();
    if (ms <= 0) return null;
    return Math.ceil(ms / MS_PER_DAY);
  });

  /** Tier classification — recomputes when underlying signals change. */
  readonly userTier: Signal<UserTier> = computed(() => {
    const days = this.betaDaysRemaining();
    if (days !== null) {
      return days > BETA_EXPIRING_SOON_THRESHOLD_DAYS
        ? 'beta_active'
        : 'beta_expiring_soon';
    }
    return this.userState.isPremiumUser() ? 'premium_paid' : 'freemium';
  });

  /**
   * Returns a signal of the per-feature quota snapshot, or null if data unavailable.
   * Each call returns a *new* computed signal — cache the reference at the consumer.
   */
  quotaFor(feature: FeatureType): Signal<FeatureQuotaState | null> {
    return computed(() => {
      const override = this.overrides().get(feature);
      if (override) return override;

      const usage = this.userState.featureUsage();
      if (!usage) return null;

      const entry = usage.find((u) => u.feature === feature);
      if (!entry) return null;

      return this.fromFeatureUsage(feature, entry);
    });
  }

  /**
   * Force a feature into exhausted state with authoritative backend numbers.
   * Called by QuotaInterceptor on 403 ERR_RATE_LIMIT_EXCEEDED.
   */
  markFeatureExhausted(
    feature: FeatureType,
    used: number,
    allowed: number,
    resetDate: Date,
  ): void {
    const next = new Map(this.overrides());
    next.set(feature, {
      feature,
      used,
      allowed,
      remaining: 0,
      percentage: 100,
      resetDate,
      daysToReset: this.daysUntil(resetDate),
      status: 'exhausted',
    });
    this.overrides.set(next);
  }

  /** Clear an override (e.g., after a fresh /users/feature-usage fetch). */
  clearOverride(feature: FeatureType): void {
    if (!this.overrides().has(feature)) return;
    const next = new Map(this.overrides());
    next.delete(feature);
    this.overrides.set(next);
  }

  // ── Private helpers ─────────────────────────────────────────────────────

  private fromFeatureUsage(
    feature: FeatureType,
    u: FeatureUsage,
  ): FeatureQuotaState {
    const allowed = u.allowed ?? 0;
    const used = u.used ?? 0;
    const remaining = u.remaining ?? Math.max(0, allowed - used);
    const percentage = allowed === 0 ? 100 : Math.min(100, Math.round((used / allowed) * 100));
    const resetDate = new Date(u.resetDate);
    return {
      feature,
      used,
      allowed,
      remaining,
      percentage,
      resetDate,
      daysToReset: u.daysRemaining ?? this.daysUntil(resetDate),
      status: classifyQuotaStatus(remaining, percentage),
    };
  }

  private daysUntil(d: Date): number {
    const ms = d.getTime() - Date.now();
    return ms <= 0 ? 0 : Math.ceil(ms / MS_PER_DAY);
  }
}
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | tail -5
```
Expected: zero errors.

---

## Task 5 — Update `readHttpApiError` to recognize `QuotaExceededError`

**path:** `src/app/features/applications/lib/read-http-api-error.ts`

**intent:** Existing toast call sites use `snackbar.showError(readHttpApiError(err) ?? 'fallback')`. By making `readHttpApiError` return `undefined` for `QuotaExceededError`, every existing toast call automatically becomes a no-op for quota errors — zero changes in 12+ caller components. This is the keystone that makes the rest of the migration cheap.

**verify:** `npm run build 2>&1 | grep -E "ERROR|error TS"` → no output. Caller count unchanged: `grep -rn "readHttpApiError" src/app --include='*.ts' | grep -v spec | wc -l` should match the count before this change.

**agency:** `Frontend Developer` · `@agency-frontend-developer.mdc`

**docs:**
- Current file: `src/app/features/applications/lib/read-http-api-error.ts` (read it first — only 9 lines)
- `src/app/core/errors/quota-exceeded.error.ts` (Task 3)

---

- [ ] **Step 1: Read the current file**

Run `cat src/app/features/applications/lib/read-http-api-error.ts` and confirm it currently contains only the `readHttpApiError` function returning `string | undefined`.

- [ ] **Step 2: Update the helper to recognize quota errors**

Replace the file contents with:

```typescript
// src/app/features/applications/lib/read-http-api-error.ts
import { isQuotaExceededError } from '@core/errors/quota-exceeded.error';

/**
 * Best-effort message extraction from Angular HttpClient / Nest error bodies.
 *
 * Special-case: returns `undefined` for QuotaExceededError so existing
 * `showError(readHttpApiError(err) ?? 'fallback')` patterns become silent
 * no-ops on quota exhaustion. The QuotaInterceptor surfaces the UI
 * separately through QuotaState.
 */
export function readHttpApiError(err: unknown): string | undefined {
  if (isQuotaExceededError(err)) {
    return undefined;
  }
  if (!err || typeof err !== 'object' || !('error' in err)) {
    return undefined;
  }
  const e = err as { error?: { message?: string }; message?: string };
  return e.error?.message ?? e.message;
}
```

- [ ] **Step 3: Build check**

```bash
npm run build 2>&1 | tail -5
```
Expected: zero errors.

- [ ] **Step 4: Verify caller count unchanged**

```bash
grep -rn "readHttpApiError" /Users/fahadsubzwari924/Documents/sideProjects/ATS_FIT/ats-fit-frontend/src/app --include='*.ts' | grep -v spec | wc -l
```
Expected: same count as before (≥ 5; we have not touched any caller).

---

## Task 6 — `QuotaInterceptor` (functional HTTP interceptor)

**path:** `src/app/core/interceptors/quota.interceptor.ts`

**intent:** Catch backend `403 ERR_RATE_LIMIT_EXCEEDED` responses, update `QuotaState` with authoritative numbers, and rewrap the error as `QuotaExceededError`. Pass everything else through untouched (no regression for unrelated error paths).

**verify:** `npm run build 2>&1 | grep -E "ERROR|error TS"` → no output. Manual smoke check (Task 15) confirms interceptor wires correctly.

**agency:** `Frontend Developer` · `@agency-frontend-developer.mdc`

**docs:**
- `docs/superpowers/specs/2026-05-04-quota-reached-ux-design.md` §4, §8.2
- `src/app/core/interceptors/auth.interceptor.ts` (functional interceptor pattern reference)

---

- [ ] **Step 1: Implement the interceptor**

```typescript
// src/app/core/interceptors/quota.interceptor.ts
import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpStatusCode,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { QuotaState } from '@core/states/quota.state';
import { QuotaExceededError } from '@core/errors/quota-exceeded.error';
import { FeatureType } from '@core/enums/feature-type.enum';

const RATE_LIMIT_ERROR_CODE = 'ERR_RATE_LIMIT_EXCEEDED';

/** Allowed feature strings — anything else falls through unchanged. */
const KNOWN_FEATURES = new Set<string>(Object.values(FeatureType));

interface RateLimitResponseBody {
  errorCode?: string;
  message?: string;
  details?: {
    feature?: string;
    currentUsage?: number;
    limit?: number;
    remaining?: number;
    resetDate?: string;
  };
}

export const quotaInterceptor: HttpInterceptorFn = (req, next) => {
  const quotaState = inject(QuotaState);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }
      if (error.status !== HttpStatusCode.Forbidden) {
        return throwError(() => error);
      }

      const body = error.error as RateLimitResponseBody | null | undefined;
      if (body?.errorCode !== RATE_LIMIT_ERROR_CODE) {
        return throwError(() => error);
      }

      const featureRaw = body.details?.feature;
      if (!featureRaw || !KNOWN_FEATURES.has(featureRaw)) {
        return throwError(() => error);
      }
      const feature = featureRaw as FeatureType;

      const used = body.details?.currentUsage ?? 0;
      const allowed = body.details?.limit ?? 0;
      const resetDate = body.details?.resetDate
        ? new Date(body.details.resetDate)
        : new Date();

      quotaState.markFeatureExhausted(feature, used, allowed, resetDate);

      return throwError(
        () =>
          new QuotaExceededError(
            feature,
            quotaState.userTier(),
            used,
            allowed,
            resetDate,
            error,
          ),
      );
    }),
  );
};
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | tail -5
```
Expected: zero errors.

---

## Task 7 — Wire `quotaInterceptor` into `app.config.ts`

**path:** `src/app/app.config.ts`

**intent:** Register the new interceptor in the chain. Order matters: `quotaInterceptor` must run **after** `tokenInterceptorFn` and `authInterceptor` so it sees authenticated, normalized errors.

**verify:** `npm run build 2>&1 | grep -E "ERROR|error TS"` → no output.

**agency:** `Frontend Developer` · `@agency-frontend-developer.mdc`

**docs:**
- Current `src/app/app.config.ts` (only ~25 lines — read it first)

---

- [ ] **Step 1: Read the current config**

```bash
cat /Users/fahadsubzwari924/Documents/sideProjects/ATS_FIT/ats-fit-frontend/src/app/app.config.ts
```

- [ ] **Step 2: Add the import and append `quotaInterceptor` to the chain**

Replace the file contents with:

```typescript
// src/app/app.config.ts
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { tokenInterceptorFn } from '@core/interceptors/token.interceptor';
import { authInterceptor } from '@core/interceptors/auth.interceptor';
import { quotaInterceptor } from '@core/interceptors/quota.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      })
    ),
    provideAnimations(),
    provideHttpClient(
      withFetch(),
      withInterceptors([tokenInterceptorFn, authInterceptor, quotaInterceptor])
    ),
  ],
};
```

- [ ] **Step 3: Build check**

```bash
npm run build 2>&1 | tail -5
```
Expected: zero errors.

---

## Task 8 — `QUOTA_COPY` constant table

**path:** `src/app/shared/constants/quota-copy.constant.ts`

**intent:** Single source of truth for all tier × feature copy. Components consume this — no copy inline anywhere else, so a copy revision is one PR touching one file.

**verify:** `npm run build 2>&1 | grep -E "ERROR|error TS"` → no output.

**agency:** `Frontend Developer` · `@agency-frontend-developer.mdc`

**docs:**
- `docs/superpowers/specs/2026-05-04-quota-reached-ux-design.md` §6 (copy matrix)

---

- [ ] **Step 1: Create the copy table file**

```typescript
// src/app/shared/constants/quota-copy.constant.ts
import { FeatureType } from '@core/enums/feature-type.enum';
import { UserTier } from '@core/models/quota/user-tier.type';

/** Variables available to every copy slot. Replaced via simple {token} substitution. */
export interface QuotaCopyVars {
  used: number;
  allowed: number;
  resetDate: string;          // pre-formatted "May 31"
  daysToReset: number;
  feature: string;            // pre-substituted noun (e.g., "Tailor")
  betaExpiryDate?: string;    // pre-formatted "Jun 4"
  betaDaysRemaining?: number;
}

export type QuotaCtaKind = 'upgrade' | 'view-plans' | 'contact' | 'dismiss' | 'none';

export interface QuotaCta {
  label: string;
  kind: QuotaCtaKind;
}

export interface QuotaCopyEntry {
  headline: string;
  body: string;
  primary: QuotaCta;
  secondary?: QuotaCta;
}

/** Feature → user-facing noun for in-copy substitution. */
export const FEATURE_NOUNS: Record<FeatureType, string> = {
  [FeatureType.RESUME_GENERATION]: 'Tailor',
  [FeatureType.COVER_LETTER]: 'cover letter',
  [FeatureType.RESUME_BATCH_GENERATION]: 'batch tailor',
  [FeatureType.JOB_APPLICATION_TRACKING]: 'application',
};

/** Tier × tier copy matrix. Per-feature differences are expressed via {feature} substitution. */
export const QUOTA_COPY: Record<UserTier, QuotaCopyEntry> = {
  freemium: {
    headline: "You're out of free {feature} credits",
    body:
      "You've used **{used}/{allowed}** this month. Resets **{resetDate}** ({daysToReset}d).",
    primary: { label: 'Upgrade to Premium', kind: 'upgrade' },
    secondary: { label: 'View plans', kind: 'view-plans' },
  },
  beta_active: {
    headline: 'Premium quota reached',
    body:
      "You've used **{used}/{allowed}** this month. Quota resets **{resetDate}**. Your beta ends **{betaExpiryDate}** — upgrade now to keep premium quotas.",
    primary: { label: 'Upgrade plan', kind: 'upgrade' },
    secondary: { label: 'Maybe later', kind: 'dismiss' },
  },
  beta_expiring_soon: {
    headline: 'Your beta ends in **{betaDaysRemaining}** days',
    body:
      "You've used your full premium quota. After your trial ends you'll revert to freemium with a smaller monthly allowance. Upgrade now to keep premium.",
    primary: { label: 'Upgrade now', kind: 'upgrade' },
  },
  premium_paid: {
    headline: "You've reached this month's limit",
    body:
      "You've used **{used}/{allowed}** of your monthly quota. Resets **{resetDate}** ({daysToReset}d).",
    primary: { label: '', kind: 'none' },
    secondary: { label: 'Need more? Contact us', kind: 'contact' },
  },
};

/** Substitute {token} placeholders in a copy string. Keeps **bold** markers intact for the renderer. */
export function substituteCopy(template: string, vars: QuotaCopyVars): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const v = (vars as Record<string, unknown>)[key];
    return v === undefined || v === null ? match : String(v);
  });
}
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | tail -5
```
Expected: zero errors.

---

## Task 9 — `<app-feature-usage-chip>` component

**path:** `src/app/shared/components/feature-usage-chip/feature-usage-chip.component.ts`

**intent:** Quiet status pill rendered next to AI action buttons. Hidden until usage ≥ 80%. Amber tint approaching, red tint exhausted. Pure presentational — reads `QuotaState.quotaFor(feature)`.

**verify:** `npm run build 2>&1 | grep -E "ERROR|error TS"` → no output. Manual visual check via dev server (validated in Task 15).

**agency:** `Frontend Developer` · `@agency-frontend-developer.mdc`

**docs:**
- `docs/superpowers/specs/2026-05-04-quota-reached-ux-design.md` §7.1
- `src/scss/_design-tokens.scss` (token names: `$spacing-*`, `$radius-*`, `$font-*`)

---

- [ ] **Step 1: Create the component file**

```typescript
// src/app/shared/components/feature-usage-chip/feature-usage-chip.component.ts
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { FeatureType } from '@core/enums/feature-type.enum';
import { QuotaState } from '@core/states/quota.state';

@Component({
  selector: 'app-feature-usage-chip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <span
        class="usage-chip"
        [class.usage-chip--approaching]="status() === 'approaching'"
        [class.usage-chip--exhausted]="status() === 'exhausted'"
        role="status"
      >
        <span class="usage-chip__count">{{ quota()!.used }} / {{ quota()!.allowed }} used</span>
        <span class="usage-chip__sep" aria-hidden="true">·</span>
        <span class="usage-chip__reset">resets in {{ quota()!.daysToReset }}d</span>
      </span>
    }
  `,
  styles: [`
    @use 'design-tokens' as *;

    :host {
      display: inline-flex;
    }

    .usage-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px $spacing-sm;
      border-radius: $radius-full;
      font-size: $font-size-xs;
      font-weight: $font-weight-medium;
      line-height: 1.4;
      white-space: nowrap;
      border: 1px solid transparent;

      &--approaching {
        background: hsl(36 100% 96%);
        color: hsl(28 80% 32%);
        border-color: hsl(36 90% 87%);
      }

      &--exhausted {
        background: hsl(0 86% 97%);
        color: hsl(0 65% 38%);
        border-color: hsl(0 80% 88%);
      }

      &__sep {
        opacity: 0.55;
      }
    }
  `],
})
export class FeatureUsageChipComponent {
  private readonly quotaState = inject(QuotaState);

  readonly feature = input.required<FeatureType>();

  readonly quota = computed(() => this.quotaState.quotaFor(this.feature())());

  readonly status = computed(() => this.quota()?.status ?? 'healthy');

  readonly visible = computed(() => {
    const s = this.status();
    return s === 'approaching' || s === 'exhausted';
  });
}
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | tail -5
```
Expected: zero errors.

---

## Task 10 — `<app-quota-reached-card>` component

**path:** `src/app/shared/components/quota-reached-card/quota-reached-card.component.ts`

**intent:** Inline empty-state card that replaces the action area when a feature's quota is exhausted. Tier-aware copy + CTA via `QUOTA_COPY`. Renders bold spans for `**text**` markers.

**verify:** `npm run build 2>&1 | grep -E "ERROR|error TS"` → no output. Visual verified in Task 15.

**agency:** `Frontend Developer` · `@agency-frontend-developer.mdc`

**docs:**
- `docs/superpowers/specs/2026-05-04-quota-reached-ux-design.md` §7.2
- `src/app/shared/services/billing-navigation.service.ts` (use `goToBillingOverview()` / `goToPlansSection()`)
- `src/scss/_design-tokens.scss`

---

- [ ] **Step 1: Create the component**

```typescript
// src/app/shared/components/quota-reached-card/quota-reached-card.component.ts
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { FeatureType } from '@core/enums/feature-type.enum';
import { QuotaState } from '@core/states/quota.state';
import {
  FEATURE_NOUNS,
  QUOTA_COPY,
  QuotaCopyVars,
  QuotaCta,
  substituteCopy,
} from '@shared/constants/quota-copy.constant';
import { BillingNavigationService } from '@shared/services/billing-navigation.service';

const SUPPORT_EMAIL = 'support@atsfit.app';

@Component({
  selector: 'app-quota-reached-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (vm(); as v) {
      <section
        class="quota-card"
        [class.quota-card--urgent]="tier() === 'beta_expiring_soon'"
        role="region"
        [attr.aria-label]="'Quota reached for ' + featureNoun()"
      >
        <div class="quota-card__icon" aria-hidden="true">
          @switch (tier()) {
            @case ('beta_expiring_soon') {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            }
            @case ('premium_paid') {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            }
            @default {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="m9.813 15.904-.07-.025a4.49 4.49 0 0 1-2.62-2.62l-.025-.07.025-.07a4.49 4.49 0 0 1 2.62-2.62l.07-.025.07.025a4.49 4.49 0 0 1 2.62 2.62l.025.07-.025.07a4.49 4.49 0 0 1-2.62 2.62l-.07.025M18.259 8.715l-.353.123a4.482 4.482 0 0 1-2.626 2.626l-.123.353.123.353a4.482 4.482 0 0 1 2.626 2.626l.353.123.353-.123a4.482 4.482 0 0 1 2.626-2.626l.123-.353-.123-.353a4.482 4.482 0 0 1-2.626-2.626l-.353-.123Z" />
              </svg>
            }
          }
        </div>

        <div class="quota-card__body">
          <h3 class="quota-card__headline" [innerHTML]="renderBold(v.headline)"></h3>
          <p class="quota-card__copy" [innerHTML]="renderBold(v.body)"></p>

          <div class="quota-card__actions">
            @if (v.primary.kind !== 'none') {
              <button
                type="button"
                class="quota-card__btn quota-card__btn--primary"
                [class.quota-card__btn--urgent]="tier() === 'beta_expiring_soon'"
                (click)="onCta(v.primary)"
              >{{ v.primary.label }}</button>
            }
            @if (v.secondary; as secondary) {
              <button
                type="button"
                class="quota-card__btn quota-card__btn--secondary"
                (click)="onCta(secondary)"
              >{{ secondary.label }}</button>
            }
          </div>
        </div>
      </section>
    }
  `,
  styles: [`
    @use 'design-tokens' as *;

    :host { display: block; }

    .quota-card {
      display: flex;
      gap: $spacing-md;
      padding: $spacing-lg;
      background: hsl(210 20% 98%);
      border: 1px solid hsl(210 16% 90%);
      border-radius: $radius-lg;
      align-items: flex-start;

      &--urgent {
        border-left: 4px solid hsl(36 90% 55%);
      }

      &__icon {
        flex-shrink: 0;
        width: 2.25rem;
        height: 2.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        color: hsl(215 20% 50%);

        svg { width: 1.5rem; height: 1.5rem; }
      }

      &--urgent .quota-card__icon { color: hsl(28 90% 45%); }

      &__body {
        flex: 1;
        min-width: 0;
      }

      &__headline {
        margin: 0 0 4px 0;
        font-size: $font-size-base;
        font-weight: $font-weight-semibold;
        color: hsl(215 25% 15%);
        line-height: $line-height-snug;
      }

      &__copy {
        margin: 0;
        font-size: $font-size-sm;
        color: hsl(215 16% 40%);
        line-height: 1.5;
      }

      &__actions {
        display: flex;
        gap: $spacing-sm;
        flex-wrap: wrap;
        margin-top: $spacing-md;
      }

      &__btn {
        font-size: $font-size-sm;
        font-weight: $font-weight-medium;
        padding: $spacing-sm $spacing-md;
        border-radius: $radius-md;
        cursor: pointer;
        transition: background-color 150ms ease, opacity 150ms ease;
        border: 1px solid transparent;

        &--primary {
          background: var(--ats-primary, hsl(221 83% 53%));
          color: white;

          &:hover { opacity: 0.92; }
        }

        &--urgent {
          background: hsl(28 90% 45%);
        }

        &--secondary {
          background: transparent;
          color: hsl(215 25% 30%);
          border-color: hsl(210 16% 88%);

          &:hover { background: hsl(210 20% 96%); }
        }
      }
    }
  `],
})
export class QuotaReachedCardComponent {
  private readonly quotaState = inject(QuotaState);
  private readonly billingNav = inject(BillingNavigationService);

  readonly feature = input.required<FeatureType>();

  readonly quota = computed(() => this.quotaState.quotaFor(this.feature())());
  readonly tier = computed(() => this.quotaState.userTier());
  readonly featureNoun = computed(() => FEATURE_NOUNS[this.feature()]);

  readonly vm = computed(() => {
    const q = this.quota();
    if (!q) return null;
    const entry = QUOTA_COPY[this.tier()];
    const status = this.quotaState.betaDaysRemaining();
    const betaUntil = status !== null
      ? new Date(Date.now() + status * 86_400_000)
      : null;

    const vars: QuotaCopyVars = {
      used: q.used,
      allowed: q.allowed,
      resetDate: this.formatShortDate(q.resetDate),
      daysToReset: q.daysToReset,
      feature: this.featureNoun(),
      betaExpiryDate: betaUntil ? this.formatShortDate(betaUntil) : undefined,
      betaDaysRemaining: status ?? undefined,
    };

    return {
      headline: substituteCopy(entry.headline, vars),
      body: substituteCopy(entry.body, vars),
      primary: entry.primary,
      secondary: entry.secondary,
    };
  });

  onCta(cta: QuotaCta): void {
    switch (cta.kind) {
      case 'upgrade':
        this.billingNav.goToPlansSection();
        return;
      case 'view-plans':
        this.billingNav.goToPlansSection();
        return;
      case 'contact':
        window.location.href = `mailto:${SUPPORT_EMAIL}?subject=Quota%20increase%20request`;
        return;
      case 'dismiss':
      case 'none':
        return;
    }
  }

  /** Renders **bold** segments as <strong>. Safe: only this token, no other HTML allowed. */
  protected renderBold(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }

  private formatShortDate(d: Date): string {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d);
  }
}
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | tail -5
```
Expected: zero errors.

---

## Task 11 — `appQuotaGate` directive

**path:** `src/app/shared/directives/quota-gate.directive.ts`

**intent:** Structural directive that wraps the action area of any AI feature surface. When `quotaFor(feature).status === 'exhausted'`, the directive removes its default content and renders `<app-quota-reached-card>` instead. Hosts integrate with one attribute — no `@if` blocks, no error subscription.

**verify:** `npm run build 2>&1 | grep -E "ERROR|error TS"` → no output.

**agency:** `Frontend Developer` · `@agency-frontend-developer.mdc`

**docs:**
- `docs/superpowers/specs/2026-05-04-quota-reached-ux-design.md` §7.3
- Angular structural directive pattern: search Angular docs for `TemplateRef` + `ViewContainerRef` if unfamiliar.

---

- [ ] **Step 1: Create the directive**

```typescript
// src/app/shared/directives/quota-gate.directive.ts
import {
  ChangeDetectorRef,
  Directive,
  effect,
  inject,
  input,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { FeatureType } from '@core/enums/feature-type.enum';
import { QuotaState } from '@core/states/quota.state';
import { QuotaReachedCardComponent } from '@shared/components/quota-reached-card/quota-reached-card.component';

/**
 * Structural directive: wraps an action area for an AI feature.
 *
 * Default behavior:
 *   - When the feature's quota is healthy or approaching → renders inner template.
 *   - When the feature's quota is exhausted              → renders QuotaReachedCardComponent
 *                                                          in place of the inner template.
 *
 * Usage:
 *   <ng-container *appQuotaGate="featureType">
 *     <button>Tailor resume</button>
 *     <app-feature-usage-chip [feature]="featureType" />
 *   </ng-container>
 */
@Directive({
  selector: '[appQuotaGate]',
  standalone: true,
})
export class QuotaGateDirective {
  private readonly tpl = inject(TemplateRef<unknown>);
  private readonly vcr = inject(ViewContainerRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly quotaState = inject(QuotaState);

  readonly appQuotaGate = input.required<FeatureType>();

  /** Track current rendered state so we don't tear down on every re-eval. */
  private renderedState: 'default' | 'card' | 'none' = 'none';

  constructor() {
    effect(() => {
      const feature = this.appQuotaGate();
      const quota = this.quotaState.quotaFor(feature)();
      const exhausted = quota?.status === 'exhausted';

      if (exhausted && this.renderedState !== 'card') {
        this.vcr.clear();
        const ref = this.vcr.createComponent(QuotaReachedCardComponent);
        ref.setInput('feature', feature);
        this.renderedState = 'card';
        this.cdr.markForCheck();
        return;
      }

      if (!exhausted && this.renderedState !== 'default') {
        this.vcr.clear();
        this.vcr.createEmbeddedView(this.tpl);
        this.renderedState = 'default';
        this.cdr.markForCheck();
      }
    });
  }
}
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | tail -5
```
Expected: zero errors.

---

## Task 12 — Integrate into Tailor Resume modal

**path:**
- `src/app/features/tailor-apply/tailor-apply-modal.component.ts`
- `src/app/features/tailor-apply/tailor-apply-modal.component.html` (or inline template — read first)

**intent:** Wrap the "Tailor resume" action button so the quota gate replaces it on exhaustion. Add the usage chip near the button for ≥80% visibility.

**verify:** `npm run build 2>&1 | grep -E "ERROR|error TS"` → no output. Manual smoke test (Task 15): open modal — button should still render normally when not exhausted.

**agency:** `Frontend Developer` · `@agency-frontend-developer.mdc`

**docs:**
- The component file itself (read first to find the action button location — it may be in a child step component)
- `docs/superpowers/specs/2026-05-04-quota-reached-ux-design.md` §10

---

- [ ] **Step 1: Locate the action button**

Run:
```bash
cd /Users/fahadsubzwari924/Documents/sideProjects/ATS_FIT/ats-fit-frontend
grep -n "Tailor\|tailor.*button\|onTailor\|generate" src/app/features/tailor-apply/tailor-apply-modal.component.{ts,html} 2>/dev/null | head -10
```
Note the file (template or inline) and the surrounding markup. **The Tailor button is the single primary CTA — that's the element we wrap.**

- [ ] **Step 2: Add imports + integration**

In the component `.ts`, add to the imports list:
```typescript
import { QuotaGateDirective } from '@shared/directives/quota-gate.directive';
import { FeatureUsageChipComponent } from '@shared/components/feature-usage-chip/feature-usage-chip.component';
import { FeatureType } from '@core/enums/feature-type.enum';
```

Add to the component's `imports: [...]` array: `QuotaGateDirective, FeatureUsageChipComponent`.

Add a class field exposing the feature constant for the template:
```typescript
protected readonly TAILOR_FEATURE = FeatureType.RESUME_GENERATION;
```

In the template, wrap the action area where the Tailor button lives:
```html
<ng-container *appQuotaGate="TAILOR_FEATURE">
  <!-- existing Tailor button + adjacent UI here, unchanged -->
  <!-- e.g.: <button class="primary" (click)="onTailor()">Tailor resume</button> -->
  <app-feature-usage-chip [feature]="TAILOR_FEATURE" />
</ng-container>
```

**Important:** wrap only the action zone (button + chip), not the entire modal body. The user should still see the form / context above when quota is exhausted.

- [ ] **Step 3: Build check**

```bash
npm run build 2>&1 | tail -5
```
Expected: zero errors.

---

## Task 13 — Integrate into Cover Letter component

**path:**
- `src/app/features/tailor-apply/components/cover-letter-preview/cover-letter-preview.component.ts`
- `src/app/features/tailor-apply/components/cover-letter-preview/cover-letter-preview.component.html` (or inline)

**intent:** Same integration pattern as Task 12, with `FeatureType.COVER_LETTER`.

**verify:** `npm run build 2>&1 | grep -E "ERROR|error TS"` → no output.

**agency:** `Frontend Developer` · `@agency-frontend-developer.mdc`

**docs:**
- The component file itself (read first to find the Generate button)
- Task 12 (mirror the same pattern)

---

- [ ] **Step 1: Locate the Generate Cover Letter button**

```bash
grep -n "generate\|Generate\|coverLetter\|cover.*button" src/app/features/tailor-apply/components/cover-letter-preview/cover-letter-preview.component.{ts,html} 2>/dev/null | head -10
```

- [ ] **Step 2: Apply the same wrapping pattern as Task 12**

Add imports:
```typescript
import { QuotaGateDirective } from '@shared/directives/quota-gate.directive';
import { FeatureUsageChipComponent } from '@shared/components/feature-usage-chip/feature-usage-chip.component';
import { FeatureType } from '@core/enums/feature-type.enum';
```

Register in component `imports: [...]`: `QuotaGateDirective, FeatureUsageChipComponent`.

Add class field:
```typescript
protected readonly COVER_LETTER_FEATURE = FeatureType.COVER_LETTER;
```

In the template, wrap the Generate Cover Letter button + adjacent area:
```html
<ng-container *appQuotaGate="COVER_LETTER_FEATURE">
  <!-- existing Generate button here, unchanged -->
  <app-feature-usage-chip [feature]="COVER_LETTER_FEATURE" />
</ng-container>
```

- [ ] **Step 3: Build check**

```bash
npm run build 2>&1 | tail -5
```
Expected: zero errors.

---

## Task 14 — Integrate into Batch Tailoring modal

**path:**
- `src/app/features/tailor-apply/batch-tailoring-modal.component.ts`
- `src/app/features/tailor-apply/batch-tailoring-modal.component.html` (or inline)

**intent:** Same integration pattern as Task 12, with `FeatureType.RESUME_BATCH_GENERATION`.

**verify:** `npm run build 2>&1 | grep -E "ERROR|error TS"` → no output.

**agency:** `Frontend Developer` · `@agency-frontend-developer.mdc`

**docs:**
- The component file itself
- Task 12 (mirror the same pattern)

---

- [ ] **Step 1: Locate the Start Batch button**

```bash
grep -n "Start.*batch\|batch.*Start\|onBatch\|startBatch\|Run.*batch" src/app/features/tailor-apply/batch-tailoring-modal.component.{ts,html} 2>/dev/null | head -10
```

- [ ] **Step 2: Apply wrapping pattern**

Imports + `imports[]` + class field:
```typescript
import { QuotaGateDirective } from '@shared/directives/quota-gate.directive';
import { FeatureUsageChipComponent } from '@shared/components/feature-usage-chip/feature-usage-chip.component';
import { FeatureType } from '@core/enums/feature-type.enum';

// in class:
protected readonly BATCH_FEATURE = FeatureType.RESUME_BATCH_GENERATION;
```

Template wrap:
```html
<ng-container *appQuotaGate="BATCH_FEATURE">
  <!-- existing Start Batch button here, unchanged -->
  <app-feature-usage-chip [feature]="BATCH_FEATURE" />
</ng-container>
```

- [ ] **Step 3: Build check**

```bash
npm run build 2>&1 | tail -5
```
Expected: zero errors.

---

## Task 15 — End-to-end manual verification

**path:** None (verification only — no code changes).

**intent:** Boot the dev server, exercise each tier × feature combination with seeded backend data or temporary state overrides, confirm UX is correct end-to-end and no toast appears for any quota path. Hand off to user for review and final commit decision.

**verify:** All checks below pass; production build clean.

**agency:** `Reality Checker` · `@agency-reality-checker.mdc`

**docs:**
- `docs/superpowers/specs/2026-05-04-quota-reached-ux-design.md` §11

---

- [ ] **Step 1: Production build (final)**

```bash
cd /Users/fahadsubzwari924/Documents/sideProjects/ATS_FIT/ats-fit-frontend
npm run build 2>&1 | tail -5
```
Expected: `Application bundle generation complete.` with no errors.

- [ ] **Step 2: Boot the dev server**

```bash
npm start
```
Open the printed local URL in a browser.

- [ ] **Step 3: Run the verification matrix**

For each of the three features (Tailor Resume, Cover Letter, Batch Tailoring), test these four states by manipulating seeded backend data or temporarily overriding `featureUsage`/`betaStatus` in the dev console:

  1. **Healthy state** — `remaining === 5/5`. Action button renders normally. **Chip is hidden.**
  2. **Approaching** — `used: 4, allowed: 5` (80%). Chip appears in amber tint reading `4 / 5 used · resets in Xd`. Button still works.
  3. **Exhausted (freemium)** — `used: 5, allowed: 5`. Card replaces button. Headline "You're out of free [feature] credits". Primary CTA "Upgrade to Premium" navigates to `/billing#billing-plans`. Secondary "View plans" same target.
  4. **Exhausted (premium_paid)** — Same data, user is `plan: PREMIUM`, `is_beta_user: false`. Card shows "You've reached this month's limit". **No primary upgrade CTA.** Secondary "Need more? Contact us" opens `mailto:`.

For Tailor Resume only, also exercise:

  5. **Exhausted (beta_active, > 7 days remaining)** — Card headline "Premium quota reached", body mentions beta expiry date. Primary CTA "Upgrade plan".
  6. **Exhausted (beta_expiring_soon, ≤ 7 days)** — Card has amber left-border accent. Headline "Your beta ends in N days". Primary CTA amber-styled "Upgrade now".

Record screenshots of each verified state.

- [ ] **Step 4: Toast suppression check**

While in the exhausted state, click the action button (if visible) or trigger the same backend call via dev tools to force a 403. **Confirm: no toast appears.** The card renders/refreshes only.

- [ ] **Step 5: Toast regression check**

Trigger a non-quota error (e.g., 500 server error or 403 with a different errorCode) on any other endpoint. **Confirm: the existing toast still appears as before.** This validates the unrelated error path is not broken.

- [ ] **Step 6: Hand off to user for review**

Summarize verification results to the user. **Do NOT commit.** Wait for the user to review the implementation and explicitly request the commit. The user will issue the final commit message based on what they observed.

---

## Self-review checklist

- [x] All 15 tasks have `path`, `intent`, `verify`, `agency`, `docs`
- [x] No "TBD" / "TODO" / "implement later" placeholders
- [x] Every code-bearing step shows the actual code, not a description
- [x] Type names consistent across tasks: `FeatureType`, `UserTier`, `FeatureQuotaState`, `QuotaExceededError`, `QuotaState`
- [x] `userTier` returns the same string literals everywhere (`freemium`, `beta_active`, `beta_expiring_soon`, `premium_paid`)
- [x] `markFeatureExhausted` signature matches between Task 4 (definition) and Task 6 (caller)
- [x] **No unit tests requested by user — removed from all tasks.**
- [x] **No per-task commits — all work staged locally; user reviews and triggers single final commit.**
- [x] Spec coverage:
  - §3 tier model → Task 4 (`userTier` signal)
  - §4 architecture → Tasks 1–11 collectively
  - §5 data model → Tasks 1–3
  - §6 copy matrix → Task 8
  - §7.1 chip → Task 9
  - §7.2 card → Task 10
  - §7.3 directive → Task 11
  - §8 reactive + pre-emptive → Tasks 4 (pre-emptive via signal) + 6 (reactive via interceptor)
  - §9 edge cases → Task 4 implements (allowed=0, missing data, expired beta), Task 6 implements (unknown feature pass-through)
  - §10 integrations → Tasks 12–14
  - §11 testing → Task 15 (manual)
  - §12 rollout → no feature flag; single PR; rollback safe (additive only)
- [x] Tasks build top-down: types → state → interceptor → wiring → UI → integrations → verify
- [x] No task references a function/type that hasn't been defined yet
