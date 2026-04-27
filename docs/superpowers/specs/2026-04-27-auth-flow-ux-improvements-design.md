# Auth Flow UX Improvements — Design Spec

**Date:** 2026-04-27  
**Status:** Approved  

---

## Problem

The signup → signin → onboarding → dashboard flow fires multiple toast notifications at inappropriate points:
- Signup success fires a floating toast then immediately redirects (toast unread)
- Login errors fire floating toasts while user focus is on the form
- Auth guard fires an error toast for a routine redirect (not an error)
- Google auth buttons present but not integrated

Result: jarring, non-professional UX inconsistent with standard SaaS patterns.

---

## Goal

- Errors tied to form submission → inline alert anchored to the form
- Route-level redirects → silent
- Registration success → persistent inline banner on the destination page
- Toasts reserved for background/async events only (e.g. resume upload failure)

---

## Architecture

### Rule

| Event type | Notification pattern |
|---|---|
| Form submission error | Inline `InlineAlertComponent` inside form card |
| Route guard redirect | Silent — no notification |
| Signup success | Query-param banner on signin page |
| Background/async error | Toast (SnackbarService) |

### What changes

| File | Change |
|---|---|
| `signup.component.ts` / `.html` | Remove success toast; redirect with `?registered=true`; inline error |
| `signin.component.ts` / `.html` | Read `?registered=true`; show registration banner; inline login error |
| `auth.guard.ts` | Remove SnackbarService call; silent redirect only |
| `google-auth-button.component.html` (both signin + signup templates) | Comment out — not yet integrated |
| New: `inline-alert.component` | Shared UI component for inline alerts |

### What stays unchanged

- `SnackbarService` — still used for async/background errors
- Onboarding upload error toast — legitimate async error, no form context
- `OnboardingSubmittedScreenComponent` — already has celebration UI + countdown

---

## New Component: `InlineAlertComponent`

**Path:** `src/app/shared/components/ui/inline-alert/`

**Files:**
- `inline-alert.component.ts`
- `inline-alert.component.html`

**Inputs:**
```typescript
message: InputSignal<string | null>   // null = hidden
type: InputSignal<'error' | 'success' | 'info'>
```

**Behavior:**
- `ChangeDetectionStrategy.OnPush`, standalone
- Renders nothing when `message()` is null
- No internal state — parent controls visibility via signal

**Visual style (Tailwind):**
- `error` → `bg-red-50 border-l-4 border-red-500 text-red-700`
- `success` → `bg-green-50 border-l-4 border-green-500 text-green-700`
- `info` → `bg-blue-50 border-l-4 border-blue-500 text-blue-700`

---

## Component Changes

### `signup.component.ts`

- Add `errorMessage = signal<string | null>(null)`
- On submit start: `errorMessage.set(null)` (clear stale error)
- On success: remove `showSuccess()` toast; navigate with `{ queryParams: { registered: 'true' } }`
- On error: `errorMessage.set(error?.error?.message || Messages.SIGNUP_FAILED)`
- Remove `SnackbarService` injection if no other usage remains

### `signup.component.html`

- Add `<app-inline-alert [message]="errorMessage()" type="error" />` below submit button
- Comment out `<app-google-auth-button>` block

### `signin.component.ts`

- Add `errorMessage = signal<string | null>(null)`
- Add `showRegistrationBanner = signal(false)`
- In `ngOnInit`: inject `ActivatedRoute`, read `queryParams.registered`; if `'true'` → `showRegistrationBanner.set(true)`, auto-clear after 6000ms via `setTimeout`
- On login start: `errorMessage.set(null)`
- On login error: `errorMessage.set(error?.error?.message || error?.error?.error || Messages.LOGIN_FAILED)`
- Remove `SnackbarService` injection

### `signin.component.html`

- Add registration banner (green) at top of card — shown when `showRegistrationBanner()` is true:
  - Text: "Account created — sign in to continue"
  - Green bg, checkmark icon, dismissible
- Add `<app-inline-alert [message]="errorMessage()" type="error" />` below submit button
- Comment out `<app-google-auth-button>` block

### `auth.guard.ts`

- Remove `SnackbarService` import and injection
- Remove `snackbar.showError(...)` call
- Keep `storageService.clear()` and `router.navigateByUrl(AppRoutes.SIGNIN)`

---

## Spec Self-Review

- No TBDs or placeholders
- No contradictions between sections
- Scope is focused — only auth flow notification changes
- All requirements unambiguous

---

## Out of Scope

- Google auth full integration (separate future task)
- Password reset flow
- Session expiry handling
- Any dashboard notification changes
