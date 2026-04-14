# Pricing Model UI Update — Design Spec

**Date:** 2026-04-14  
**Status:** Approved  
**Scope:** Frontend only — reflects the Freemium / Pro pricing model already live in the backend

---

## Context

The backend pricing model was updated to a Freemium + Pro structure (Pro Monthly at $12/mo, Pro Annual at $89/yr). The frontend still displays the old two-plan layout ("Free Account" + "Premium" at $19/month) with incorrect feature lists and stale hardcoded fallback values. This spec covers all frontend changes needed to align the UI with the new model.

---

## Pricing tiers (source of truth)

| Plan | Price | Key entitlements |
|------|-------|-----------------|
| **Freemium** | Free | 3 resumes/mo · 1 cover letter/mo · 30-day history · no batch generation |
| **Pro Monthly** | $12.00/mo | 30 resumes/mo · 15 cover letters/mo · 10 batch generations/mo · full history · all templates · priority support |
| **Pro Annual** | $89.00/yr (~$7.42/mo) | Same as Pro Monthly · "Save 38%" vs monthly |

---

## Affected areas

### 1. Landing page — Pricing section

**Files:**
- `public/json/pricing.json`
- `src/app/root/landing/interfaces/pricing.interface.ts`
- `src/app/root/landing/components/price-card/price-card.component.ts`
- `src/app/root/landing/components/price-card/price-card.component.html`
- `src/app/root/landing/landing.component.ts`
- `src/app/root/landing/landing.component.html`

**Changes:**

#### `IPricing` interface
Add two fields to support the toggle-driven annual variant:
```ts
annualPrice?: string;          // e.g. "$89/yr"
annualSavingsBadge?: string;   // e.g. "Save 38%"
```
The existing `price` field continues to hold the monthly price.

#### `public/json/pricing.json`
Restructure to two entries matching the new model:

- **Freemium**
  - `title`: "Freemium"
  - `price`: "Free"
  - `description`: "Get started with core features at no cost"
  - `type`: "registered"
  - `isPopular`: false
  - `buttonText`: "Sign up free" → `buttonLink`: "/signup"
  - `features`: ["3 tailored resumes/month", "1 cover letter/month", "30-day generation history", "Unlimited job application tracking", "Basic resume templates"]

- **Pro**
  - `title`: "Pro"
  - `price`: "$12/mo"
  - `annualPrice`: "$89/yr"
  - `annualSavingsBadge`: "Save 38%"
  - `description`: "For serious job seekers who want the full toolkit"
  - `type`: "premium"
  - `isPopular`: true
  - `buttonText`: "Get Pro" → `buttonLink`: "/signup"
  - `features`: ["30 tailored resumes/month", "15 cover letters/month", "Batch generation (up to 3 jobs/batch, 10 batches/month)", "All resume templates", "Unlimited job application tracking", "Full generation history", "Priority support"]

#### `LandingComponent`
- Add `selectedCycle = signal<'monthly' | 'annual'>('monthly')` signal
- Pass `selectedCycle` to `PriceCardComponent` as an input

#### Pricing section HTML
- Add a **Monthly / Annual toggle** above the price cards
- Toggle updates `selectedCycle` signal

#### `PriceCardComponent`
- Add `selectedCycle = input<'monthly' | 'annual'>('monthly')` input signal
- In the template: when `selectedCycle() === 'annual'` and `priceCard()?.annualPrice` exists:
  - Display `annualPrice` instead of `price`
  - Show `annualSavingsBadge` as a small green pill badge rendered inline after the price (same line or directly below it)
- CTA buttons use `buttonLink` value (both point to `/signup`)

---

### 2. Billing section — Overview tab

**Files:**
- `src/app/features/billing/components/overview-tab/overview-tab.component.ts`
- `src/app/features/billing/components/billing-current-plan-card/billing-current-plan-card.component.html`
- `src/app/features/billing/components/billing-current-plan-card/billing-current-plan-card.component.ts`

**Changes:**

#### `overview-tab.component.ts`
- `priceMain()`: change hardcoded fallback from `'$19'` → `'$12'`
- `nextChargeAmount()`: change hardcoded fallback from `'$19.00'` → `'$12.00'`
- `currentPlanFeatures()`: change substring search from `'premium'` → `'pro'` to match "Pro Monthly" / "Pro Annual" plan names
- `planAccent()`: remove `'enterprise'` branch; add `'pro'` case with `#2563EB` (same blue accent)
- `onUpgradeEnterprise()`: remove method entirely
- Remove any call sites of `onUpgradeEnterprise()` in the template

#### `billing-current-plan-card.component.html`
- Remove the "Upgrade to Enterprise" `<button>` entirely from the actions row
- Keep "Change Plan" button as the sole upgrade path

#### `billing-current-plan-card.component.ts`
- Remove `upgradeEnterprise` `EventEmitter` output if it exists
- Keep `changePlan` and `cancelPlan` outputs

---

## What is NOT changing

- `billing-plan-offer-card` — fully dynamic from API, no changes needed
- `plan-card` in the billing payment tab — dynamic from API, no changes needed
- Backend rate limit configs, seed data, or any API contracts

---

## Success criteria

1. Landing page pricing section shows two cards: Freemium (free) and Pro
2. Monthly/Annual toggle switches the Pro card between `$12/mo` and `$89/yr` with a "Save 38%" badge on annual
3. All feature lists match the canonical limits defined in the backend
4. Billing overview tab no longer shows "Upgrade to Enterprise"
5. Hardcoded `$19` fallbacks replaced with `$12`
6. No linter errors introduced
