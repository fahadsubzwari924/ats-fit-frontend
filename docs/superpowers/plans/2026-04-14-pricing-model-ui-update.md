# Pricing Model UI Update — Implementation Plan

> **For agentic workers:** Dispatch each task using the Agency specialist below. Steps use checkbox (`- [ ]`) syntax for tracking. No commits until the user reviews — implement all tasks, then stop.

**Goal:** Align all frontend pricing UI with the new Freemium / Pro pricing model ($12/mo · $89/yr) replacing the stale $19 "Premium" data.

**Architecture:** Four independent change groups — (1) pricing constants + interface + data, (2) `PriceCardComponent` with single computed + Tailwind `@apply`, (3) landing page toggle wiring, (4) billing section cleanup. Groups 1 and 4 can start in parallel; groups 2 and 3 depend on group 1.

**Tech Stack:** Angular 19 · TypeScript · Tailwind CSS · Angular signals (`signal`, `input`, `computed`)

**Agency dispatch:** All tasks → `subagent_type: "engineering-frontend-developer"`

**Spec:** `docs/superpowers/specs/2026-04-14-pricing-model-ui-update-design.md`

---

## Dispatch template

```
Task({
  subagent_type: "engineering-frontend-developer",
  description: "Implement Task N: <short name>",
  prompt: "<full task section from this plan>"
})
```

---

## File Map

| Action | File |
|--------|------|
| Create | `src/app/root/landing/constants/pricing.constants.ts` |
| Create | `src/app/features/billing/constants/billing-overview.constants.ts` |
| Modify | `src/app/root/landing/interfaces/pricing.interface.ts` |
| Modify | `public/json/pricing.json` |
| Modify | `src/app/root/landing/enums/price-card-type.enum.ts` |
| Modify | `src/app/root/landing/components/price-card/price-card.component.ts` |
| Modify | `src/app/root/landing/components/price-card/price-card.component.html` |
| Modify | `src/app/root/landing/components/price-card/price-card.component.scss` |
| Modify | `src/app/root/landing/components/price-card/price-card.component.spec.ts` |
| Modify | `src/app/root/landing/landing.component.ts` |
| Modify | `src/app/root/landing/landing.component.html` |
| Modify | `src/app/features/billing/components/overview-tab/overview-tab.component.ts` |
| Modify | `src/app/features/billing/components/overview-tab/overview-tab.component.html` |
| Modify | `src/app/features/billing/components/billing-current-plan-card/billing-current-plan-card.component.ts` |
| Modify | `src/app/features/billing/components/billing-current-plan-card/billing-current-plan-card.component.html` |

---

## Task 1: Pricing constants, interface, enum, and data

**Files:**
- Create: `src/app/root/landing/constants/pricing.constants.ts`
- Modify: `src/app/root/landing/interfaces/pricing.interface.ts`
- Modify: `src/app/root/landing/enums/price-card-type.enum.ts`
- Modify: `public/json/pricing.json`

### Background
The landing page pricing data is served from `public/json/pricing.json` and typed by `IPricing`. The current data has the wrong price ($19), wrong plan names, and no annual variant. We also need a `BillingCycle` type and constants to replace magic strings throughout the feature. The `PriceCardType` enum needs a `PRO` value.

- [ ] **Step 1: Create the pricing constants file**

Create `src/app/root/landing/constants/pricing.constants.ts`:

```ts
export const BILLING_CYCLE = {
  MONTHLY: 'monthly',
  ANNUAL: 'annual',
} as const;

export type BillingCycle = (typeof BILLING_CYCLE)[keyof typeof BILLING_CYCLE];

export const PRICING_ROUTES = {
  SIGNUP: '/signup',
} as const;
```

- [ ] **Step 2: Update `PriceCardType` enum**

Replace the entire contents of `src/app/root/landing/enums/price-card-type.enum.ts`:

```ts
export enum PriceCardType {
  REGISTERED = 'registered',
  PREMIUM = 'premium',
  PRO = 'pro',
}
```

- [ ] **Step 3: Update `IPricing` interface**

Replace the entire contents of `src/app/root/landing/interfaces/pricing.interface.ts`:

```ts
import { PriceCardType } from '@root/landing/enums/price-card-type.enum';

export interface IPricing {
  title: string;
  price: string;
  annualPrice?: string;
  annualSavingsBadge?: string;
  description: string;
  icon: string;
  isPopular?: boolean;
  buttonText: string;
  buttonLink: string;
  features: string[];
  type: PriceCardType;
}
```

- [ ] **Step 4: Replace `pricing.json` with correct data**

Replace the entire contents of `public/json/pricing.json`:

```json
[
  {
    "title": "Freemium",
    "price": "Free",
    "description": "Get started with core features at no cost",
    "icon": "/images/pricing-card/price-card-1.svg",
    "isPopular": false,
    "buttonText": "Sign up free",
    "buttonLink": "/signup",
    "type": "registered",
    "features": [
      "3 tailored resumes/month",
      "1 cover letter/month",
      "30-day generation history",
      "Unlimited job application tracking",
      "Basic resume templates"
    ]
  },
  {
    "title": "Pro",
    "price": "$12/mo",
    "annualPrice": "$89/yr",
    "annualSavingsBadge": "Save 38%",
    "description": "For serious job seekers who want the full toolkit",
    "icon": "/images/pricing-card/price-card-2.svg",
    "isPopular": true,
    "buttonText": "Get Pro",
    "buttonLink": "/signup",
    "type": "pro",
    "features": [
      "30 tailored resumes/month",
      "15 cover letters/month",
      "Batch generation (up to 3 jobs/batch, 10 batches/month)",
      "All resume templates",
      "Unlimited job application tracking",
      "Full generation history",
      "Priority support"
    ]
  }
]
```

- [ ] **Step 5: Run lint**

```bash
cd /Users/fahadsubzwari924/Documents/sideProjects/ats-fit-frontend
npm run lint -- --quiet
```

Expected: no errors.

---

## Task 2: Update `PriceCardComponent` — single computed, `@apply` styles, no magic strings

**Files:**
- Modify: `src/app/root/landing/components/price-card/price-card.component.ts`
- Modify: `src/app/root/landing/components/price-card/price-card.component.html`
- Modify: `src/app/root/landing/components/price-card/price-card.component.scss`
- Modify: `src/app/root/landing/components/price-card/price-card.component.spec.ts`

### Background
`PriceCardComponent` needs three improvements:

1. **Single computed** — instead of two separate `displayPrice` and `savingsBadge` computeds that each repeat the same conditional logic, use one `priceDisplay` computed that returns `{ price: string; badge: string | null }`. This is cleaner because the `isAnnual` check runs once, the two derived values are cohesive, and the template accesses a single reactive source.

2. **Tailwind `@apply`** — the template currently has elements with 20–30 utility classes inline. Move those into semantic BEM classes defined with `@apply` in the SCSS file. The template then reads `class="price-card"` instead of 30 tokens, which is dramatically easier to maintain and review.

3. **No magic strings** — the `'monthly'`/`'annual'` string literals come from `BILLING_CYCLE` constants defined in Task 1.

- [ ] **Step 1: Write the failing tests**

Replace the entire contents of `src/app/root/landing/components/price-card/price-card.component.spec.ts`:

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PriceCardComponent } from './price-card.component';
import { IPricing } from '@root/landing/interfaces/pricing.interface';
import { PriceCardType } from '@root/landing/enums/price-card-type.enum';
import { BILLING_CYCLE } from '@root/landing/constants/pricing.constants';

const FREEMIUM_PLAN: IPricing = {
  title: 'Freemium',
  price: 'Free',
  description: 'Get started',
  icon: '/icon.svg',
  isPopular: false,
  buttonText: 'Sign up free',
  buttonLink: '/signup',
  features: ['3 tailored resumes/month'],
  type: PriceCardType.REGISTERED,
};

const PRO_PLAN: IPricing = {
  title: 'Pro',
  price: '$12/mo',
  annualPrice: '$89/yr',
  annualSavingsBadge: 'Save 38%',
  description: 'Full toolkit',
  icon: '/icon2.svg',
  isPopular: true,
  buttonText: 'Get Pro',
  buttonLink: '/signup',
  features: ['30 tailored resumes/month'],
  type: PriceCardType.PRO,
};

describe('PriceCardComponent', () => {
  let component: PriceCardComponent;
  let fixture: ComponentFixture<PriceCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PriceCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PriceCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('priceCard', FREEMIUM_PLAN);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('priceDisplay computed', () => {
    it('returns monthly price and null badge on monthly cycle', () => {
      fixture.componentRef.setInput('priceCard', PRO_PLAN);
      fixture.componentRef.setInput('selectedCycle', BILLING_CYCLE.MONTHLY);
      fixture.detectChanges();
      expect(component.priceDisplay().price).toBe('$12/mo');
      expect(component.priceDisplay().badge).toBeNull();
    });

    it('returns annual price and savings badge on annual cycle', () => {
      fixture.componentRef.setInput('priceCard', PRO_PLAN);
      fixture.componentRef.setInput('selectedCycle', BILLING_CYCLE.ANNUAL);
      fixture.detectChanges();
      expect(component.priceDisplay().price).toBe('$89/yr');
      expect(component.priceDisplay().badge).toBe('Save 38%');
    });

    it('returns monthly price when annual cycle selected but no annualPrice set', () => {
      fixture.componentRef.setInput('priceCard', FREEMIUM_PLAN);
      fixture.componentRef.setInput('selectedCycle', BILLING_CYCLE.ANNUAL);
      fixture.detectChanges();
      expect(component.priceDisplay().price).toBe('Free');
      expect(component.priceDisplay().badge).toBeNull();
    });
  });

  describe('template rendering', () => {
    it('shows monthly price in DOM by default', () => {
      fixture.componentRef.setInput('priceCard', PRO_PLAN);
      fixture.componentRef.setInput('selectedCycle', BILLING_CYCLE.MONTHLY);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('$12/mo');
      expect(fixture.nativeElement.textContent).not.toContain('$89/yr');
    });

    it('shows annual price and savings badge in DOM on annual cycle', () => {
      fixture.componentRef.setInput('priceCard', PRO_PLAN);
      fixture.componentRef.setInput('selectedCycle', BILLING_CYCLE.ANNUAL);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('$89/yr');
      expect(fixture.nativeElement.textContent).toContain('Save 38%');
    });

    it('does not show savings badge on monthly cycle', () => {
      fixture.componentRef.setInput('priceCard', PRO_PLAN);
      fixture.componentRef.setInput('selectedCycle', BILLING_CYCLE.MONTHLY);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).not.toContain('Save 38%');
    });

    it('freemium card never shows savings badge', () => {
      fixture.componentRef.setInput('priceCard', FREEMIUM_PLAN);
      fixture.componentRef.setInput('selectedCycle', BILLING_CYCLE.ANNUAL);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Free');
      expect(fixture.nativeElement.textContent).not.toContain('Save 38%');
    });
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd /Users/fahadsubzwari924/Documents/sideProjects/ats-fit-frontend
npm run test -- --include="**/price-card.component.spec.ts" --watch=false --browsers=ChromeHeadless
```

Expected: most tests fail because `selectedCycle` input and `priceDisplay` computed don't exist yet.

- [ ] **Step 3: Update `PriceCardComponent` class**

Replace the entire contents of `src/app/root/landing/components/price-card/price-card.component.ts`:

```ts
import { Component, computed, input } from '@angular/core';
import { IPricing } from '@root/landing/interfaces/pricing.interface';
import { PriceCardType } from '@root/landing/enums/price-card-type.enum';
import {
  BILLING_CYCLE,
  BillingCycle,
} from '@root/landing/constants/pricing.constants';

export interface PriceDisplay {
  price: string;
  badge: string | null;
}

@Component({
  selector: 'app-price-card',
  standalone: true,
  imports: [],
  templateUrl: './price-card.component.html',
  styleUrl: './price-card.component.scss',
})
export class PriceCardComponent {
  readonly PriceCardType = PriceCardType;

  priceCard = input<IPricing>();
  selectedCycle = input<BillingCycle>(BILLING_CYCLE.MONTHLY);

  priceDisplay = computed<PriceDisplay>(() => {
    const card = this.priceCard();
    const isAnnual = this.selectedCycle() === BILLING_CYCLE.ANNUAL;
    return {
      price: (isAnnual && card?.annualPrice) ? card.annualPrice : (card?.price ?? ''),
      badge: (isAnnual && card?.annualSavingsBadge) ? card.annualSavingsBadge : null,
    };
  });
}
```

- [ ] **Step 4: Update `PriceCardComponent` SCSS — extract utility classes with `@apply`**

Replace the entire contents of `src/app/root/landing/components/price-card/price-card.component.scss`:

```scss
.price-card {
  @apply rounded-lg bg-card text-card-foreground relative;

  &--standard {
    @apply border shadow-sm border-slate-200;
  }

  &--popular {
    @apply border-blue-500 border-2 shadow-xl;
  }
}

.price-card__popular-badge {
  @apply inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold
    border-transparent absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white;
}

.price-card__header {
  @apply flex flex-col space-y-1.5 p-6 text-center;
}

.price-card__title {
  @apply font-semibold tracking-tight text-2xl;
}

.price-card__price-row {
  @apply flex items-center justify-center gap-2;
}

.price-card__price {
  @apply text-4xl font-bold text-blue-600;
}

.price-card__savings-badge {
  @apply inline-flex items-center rounded-full bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5;
}

.price-card__description {
  @apply text-sm text-muted-foreground;
}

.price-card__body {
  @apply p-6 pt-0 space-y-4;
}

.price-card__features {
  @apply space-y-3;
}

.price-card__feature-item {
  @apply flex items-center;
}

.price-card__feature-icon {
  @apply h-5 w-5 text-green-500 mr-3 flex-shrink-0;
}

.price-card__feature-text {
  @apply text-slate-700;
}

.price-card__cta {
  @apply inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium
    ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2
    focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none
    disabled:opacity-50 h-11 rounded-md px-8 w-full mt-6;

  &--primary {
    @apply bg-primary text-primary-foreground hover:bg-primary/90;
  }

  &--secondary {
    @apply border border-input bg-background hover:bg-accent hover:text-accent-foreground btn-border-color;
  }
}
```

- [ ] **Step 5: Update `PriceCardComponent` template**

Replace the entire contents of `src/app/root/landing/components/price-card/price-card.component.html`:

```html
<div
  class="price-card"
  [class.price-card--standard]="!priceCard()?.isPopular"
  [class.price-card--popular]="priceCard()?.isPopular"
>
  @if (priceCard()?.isPopular) {
    <div class="price-card__popular-badge">Most Popular</div>
  }

  <div class="price-card__header">
    <h3 class="price-card__title">{{ priceCard()?.title }}</h3>
    <div class="price-card__price-row">
      <span class="price-card__price">{{ priceDisplay().price }}</span>
      @if (priceDisplay().badge) {
        <span class="price-card__savings-badge">{{ priceDisplay().badge }}</span>
      }
    </div>
    <p class="price-card__description">{{ priceCard()?.description }}</p>
  </div>

  <div class="price-card__body">
    <ul class="price-card__features">
      @for (feature of priceCard()?.features; track feature) {
        <li class="price-card__feature-item">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round"
            class="price-card__feature-icon">
            <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
            <path d="m9 11 3 3L22 4"></path>
          </svg>
          <span class="price-card__feature-text">{{ feature }}</span>
        </li>
      }
    </ul>

    @if (priceCard()?.isPopular) {
      <a class="price-card__cta price-card__cta--primary" [href]="priceCard()?.buttonLink">
        {{ priceCard()?.buttonText }}
      </a>
    } @else {
      <a class="price-card__cta price-card__cta--secondary" [href]="priceCard()?.buttonLink">
        {{ priceCard()?.buttonText }}
      </a>
    }
  </div>
</div>
```

- [ ] **Step 6: Run tests — verify they pass**

```bash
npm run test -- --include="**/price-card.component.spec.ts" --watch=false --browsers=ChromeHeadless
```

Expected: all 8 tests pass.

- [ ] **Step 7: Run lint**

```bash
npm run lint -- --quiet
```

Expected: no errors.

---

## Task 3: Add billing cycle toggle to landing page

**Files:**
- Modify: `src/app/root/landing/landing.component.ts`
- Modify: `src/app/root/landing/landing.component.html`

### Background
The pricing section currently uses `md:grid-cols-3` (built for 3 cards) and passes no `selectedCycle` to `app-price-card`. We now have 2 cards and need a monthly/annual toggle above them. The toggle drives a `selectedCycle` signal on `LandingComponent`, which is passed down to each card. All string literals use the `BILLING_CYCLE` constants from Task 1.

- [ ] **Step 1: Update `LandingComponent` class**

Replace the entire contents of `src/app/root/landing/landing.component.ts`:

```ts
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { FeatureCardComponent } from '@root/landing/components/feature-card/feature-card.component';
import { PriceCardComponent } from '@root/landing/components/price-card/price-card.component';
import { JobStoryCardComponent } from '@root/landing/components/job-stroy-card/job-story-card.component';
import { TailorApplyModalComponent } from '@features/tailor-apply/tailor-apply-modal.component';
import { PlatformDataService } from '@root/landing/services/platform-data.service';
import { ModalService } from '@shared/services/modal.service';
import { ResumeService } from '@shared/services/resume.service';
import { IFeature } from '@root/landing/interfaces/feature.interface';
import { IPricing } from '@root/landing/interfaces/pricing.interface';
import { ITestimonial } from '@root/landing/interfaces/testimonial.interface';
import {
  BILLING_CYCLE,
  BillingCycle,
} from '@root/landing/constants/pricing.constants';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [FeatureCardComponent, PriceCardComponent, JobStoryCardComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent implements OnInit, OnDestroy {
  readonly BILLING_CYCLE = BILLING_CYCLE;

  private readonly router = inject(Router);
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  private readonly modalService = inject(ModalService);
  private readonly platformDataService = inject(PlatformDataService);
  private readonly resumeService = inject(ResumeService);

  mobileMenuOpen = signal(false);
  showWizard = signal(false);
  canGenerateResume = signal(false);
  isAuthenticated = signal(false);
  selectedCycle = signal<BillingCycle>(BILLING_CYCLE.MONTHLY);

  features = signal<IFeature[]>([]);
  pricingPlans = signal<IPricing[]>([]);
  testimonials = signal<ITestimonial[]>([]);

  templates = this.resumeService.availableTemplates;

  ngOnInit(): void {
    this.setSEO();
    this.initializeContent();
  }

  ngOnDestroy(): void {}

  private setSEO(): void {
    this.title.setTitle(
      'ResumeAI - AI-Powered Resume Builder & ATS Optimization Tool'
    );
    this.meta.addTags([
      {
        name: 'description',
        content:
          'Create professional, ATS-optimized resumes with ResumeAI. Our AI-powered platform helps you tailor your resume for specific job descriptions and improve your ATS score.',
      },
      {
        name: 'keywords',
        content:
          'resume builder, ATS optimization, job application, career tools, professional resume, AI resume, resume template',
      },
      { name: 'robots', content: 'index, follow' },
      { name: 'author', content: 'ResumeAI' },
      {
        property: 'og:title',
        content: 'ResumeAI - AI-Powered Resume Builder & ATS Optimization Tool',
      },
      {
        property: 'og:description',
        content:
          'Create professional, ATS-optimized resumes with ResumeAI. Our AI-powered platform helps you tailor your resume for specific job descriptions and improve your ATS score.',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://resumeai.com' },
      { name: 'twitter:card', content: 'summary_large_image' },
      {
        name: 'twitter:title',
        content: 'ResumeAI - AI-Powered Resume Builder & ATS Optimization Tool',
      },
      {
        name: 'twitter:description',
        content:
          'Create professional, ATS-optimized resumes with ResumeAI. Our AI-powered platform helps you tailor your resume for specific job descriptions and improve your ATS score.',
      },
    ]);
  }

  private initializeContent(): void {
    forkJoin([
      this.platformDataService.getFeatures(),
      this.platformDataService.getPricingPlans(),
      this.platformDataService.getTestimonials(),
      this.resumeService.getResumeTemplates(),
    ]).subscribe(([features, pricingPlans, testimonials]) => {
      this.features.set(features ?? []);
      this.pricingPlans.set(pricingPlans ?? []);
      this.testimonials.set(testimonials ?? []);
    });
  }

  openResumeModal(): void {
    this.modalService.openModal(TailorApplyModalComponent, undefined, {
      width: '620px',
      maxWidth: '95vw',
      panelClass: 'tailor-modal-panel',
    });
  }

  handleGetStarted(): void {
    if (this.canGenerateResume()) {
      this.showWizard.set(true);
    } else {
      this.router.navigate(['/pricing']);
    }
  }

  closeWizard(): void {
    this.showWizard.set(false);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((current) => !current);
  }
}
```

- [ ] **Step 2: Update the pricing section in `landing.component.html`**

Locate the pricing `<section>` (the one with "Choose Your Plan") and replace it with:

```html
<section class="py-16 px-4 bg-white">
  <div class="max-w-6xl mx-auto">
    <div class="text-center mb-10">
      <h2 class="text-4xl font-bold text-slate-900 mb-6">Choose Your Plan</h2>
      <p class="text-xl text-slate-600 mb-8">Start free and upgrade as your job search accelerates</p>

      <div class="inline-flex items-center rounded-full bg-slate-100 p-1 gap-1">
        <button
          type="button"
          class="px-5 py-2 rounded-full text-sm font-medium transition-all"
          [class.bg-white]="selectedCycle() === BILLING_CYCLE.MONTHLY"
          [class.shadow-sm]="selectedCycle() === BILLING_CYCLE.MONTHLY"
          [class.text-slate-900]="selectedCycle() === BILLING_CYCLE.MONTHLY"
          [class.text-slate-500]="selectedCycle() !== BILLING_CYCLE.MONTHLY"
          (click)="selectedCycle.set(BILLING_CYCLE.MONTHLY)">
          Monthly
        </button>
        <button
          type="button"
          class="px-5 py-2 rounded-full text-sm font-medium transition-all"
          [class.bg-white]="selectedCycle() === BILLING_CYCLE.ANNUAL"
          [class.shadow-sm]="selectedCycle() === BILLING_CYCLE.ANNUAL"
          [class.text-slate-900]="selectedCycle() === BILLING_CYCLE.ANNUAL"
          [class.text-slate-500]="selectedCycle() !== BILLING_CYCLE.ANNUAL"
          (click)="selectedCycle.set(BILLING_CYCLE.ANNUAL)">
          Annual
        </button>
      </div>
    </div>

    <div class="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
      @for (plan of pricingPlans(); track $index) {
        <app-price-card [priceCard]="plan" [selectedCycle]="selectedCycle()"></app-price-card>
      }
    </div>
  </div>
</section>
```

- [ ] **Step 3: Run lint**

```bash
npm run lint -- --quiet
```

Expected: no errors.

- [ ] **Step 4: Build to verify no compilation errors**

```bash
npm run build -- --configuration=development 2>&1 | tail -20
```

Expected: build completes without errors.

---

## Task 4: Fix billing section — constants, hardcoded values, enterprise removal

**Files:**
- Create: `src/app/features/billing/constants/billing-overview.constants.ts`
- Modify: `src/app/features/billing/components/overview-tab/overview-tab.component.ts`
- Modify: `src/app/features/billing/components/overview-tab/overview-tab.component.html`
- Modify: `src/app/features/billing/components/billing-current-plan-card/billing-current-plan-card.component.ts`
- Modify: `src/app/features/billing/components/billing-current-plan-card/billing-current-plan-card.component.html`

### Background
`overview-tab.component.ts` has five problems: `$19` fallbacks (should be `$12`), `currentPlanFeatures()` searching for `'premium'` (should be `'pro'`), a `planAccent()` enterprise branch, `onUpgradeEnterprise()` method, and all these values are hardcoded strings rather than named constants. The `billing-current-plan-card` has an `upgradeEnterprise` output and an "Upgrade to Enterprise" button to remove.

- [ ] **Step 1: Create billing overview constants**

Create `src/app/features/billing/constants/billing-overview.constants.ts`:

```ts
export const PLAN_NAME_FRAGMENTS = {
  PRO: 'pro',
  FREE: 'free',
} as const;

export const PLAN_ACCENT_COLORS = {
  PRO: '#2563EB',
  DEFAULT: '#64748B',
} as const;

export const PRO_PLAN_DEFAULTS = {
  PRICE_MAIN: '$12',
  NEXT_CHARGE: '$12.00',
  LABEL: 'Pro',
} as const;
```

- [ ] **Step 2: Update `overview-tab.component.ts`**

Apply these targeted changes. The file lives at `src/app/features/billing/components/overview-tab/overview-tab.component.ts`.

**Add import** at the top (after existing imports):
```ts
import {
  PLAN_NAME_FRAGMENTS,
  PLAN_ACCENT_COLORS,
  PRO_PLAN_DEFAULTS,
} from '@features/billing/constants/billing-overview.constants';
```

**Change A** — `priceMain()` fallback (~line 109):
```ts
// Before:
if (this.userState.currentUser()?.isPremium) return '$19';

// After:
if (this.userState.currentUser()?.isPremium) return PRO_PLAN_DEFAULTS.PRICE_MAIN;
```

**Change B** — `nextChargeAmount()` fallback (~line 163):
```ts
// Before:
return this.userState.currentUser()?.isPremium ? '$19.00' : '';

// After:
return this.userState.currentUser()?.isPremium ? PRO_PLAN_DEFAULTS.NEXT_CHARGE : '';
```

**Change C** — `currentPlanFeatures()` substring search (~line 150):
```ts
// Before:
const premium = this.subscriptionPlan().find(p => p.planName?.toLowerCase().includes('premium'));
return premium?.features?.length ? premium.features : [];

// After:
const pro = this.subscriptionPlan().find(p =>
  p.planName?.toLowerCase().includes(PLAN_NAME_FRAGMENTS.PRO)
);
return pro?.features?.length ? pro.features : [];
```

**Change D** — `planAccent()` (~line 166):
```ts
// Before:
planAccent(plan: SubscriptionPlan): string {
  const n = (plan.planName || '').toLowerCase();
  if (n.includes('enterprise')) return '#7C3AED';
  if (n.includes('premium')) return '#2563EB';
  return '#64748B';
}

// After:
planAccent(plan: SubscriptionPlan): string {
  const n = (plan.planName ?? '').toLowerCase();
  if (n.includes(PLAN_NAME_FRAGMENTS.PRO)) return PLAN_ACCENT_COLORS.PRO;
  return PLAN_ACCENT_COLORS.DEFAULT;
}
```

**Change E** — remove `onUpgradeEnterprise()` method entirely:
```ts
// Remove this entire method (~lines 193–196):
onUpgradeEnterprise(): void {
  const ent = this.subscriptionPlan().find(p => p.planName?.toLowerCase().includes('enterprise'));
  if (ent) this.onPlanButtonClick(ent);
}
```

**Change F** — `isCurrentPlan()` — replace hardcoded `'free'` with constant (~line 176):
```ts
// Before:
const free = plan.planName?.toLowerCase().includes('free');

// After:
const free = plan.planName?.toLowerCase().includes(PLAN_NAME_FRAGMENTS.FREE);
```

- [ ] **Step 3: Remove `(upgradeEnterprise)` binding from `overview-tab.component.html`**

Open `src/app/features/billing/components/overview-tab/overview-tab.component.html`.

Find the `<app-billing-current-plan-card>` element and remove the `(upgradeEnterprise)="onUpgradeEnterprise()"` binding. The element currently looks like:

```html
<app-billing-current-plan-card
  [planLabel]="currentPlanLabel()"
  [showPremiumSkin]="!!userState.currentUser()?.isPremium"
  [priceMain]="priceMain()"
  [pricePeriod]="pricePeriod()"
  [renewSummary]="renewSummary()"
  [daysRemainingLabel]="daysRemainingLabel()"
  [renewalProgressPct]="renewalProgressPct()"
  [features]="currentPlanFeatures()"
  [autoRenewNote]="autoRenewNote()"
  [nextChargeAmount]="nextChargeAmount()"
  (upgradeEnterprise)="onUpgradeEnterprise()"
  (changePlan)="scrollToPlans()"
  (cancelPlan)="scrollToPlans()" />
```

Remove only the `(upgradeEnterprise)="onUpgradeEnterprise()"` line. Leave all other bindings intact.

- [ ] **Step 4: Update `billing-current-plan-card.component.ts`**

Replace the entire contents of `src/app/features/billing/components/billing-current-plan-card/billing-current-plan-card.component.ts`:

```ts
import { Component, input, output } from '@angular/core';
import { PRO_PLAN_DEFAULTS } from '@features/billing/constants/billing-overview.constants';

@Component({
  selector: 'app-billing-current-plan-card',
  templateUrl: './billing-current-plan-card.component.html',
})
export class BillingCurrentPlanCardComponent {
  planLabel = input<string>(PRO_PLAN_DEFAULTS.LABEL);
  showPremiumSkin = input(true);
  priceMain = input<string>(PRO_PLAN_DEFAULTS.PRICE_MAIN);
  pricePeriod = input<string>('/mo');
  renewSummary = input<string>('Billed monthly');
  daysRemainingLabel = input<string | null>(null);
  renewalProgressPct = input<number>(43);
  features = input<string[]>([]);
  autoRenewNote = input<string>('');
  nextChargeAmount = input<string>('');

  changePlan = output<void>();
  cancelPlan = output<void>();
}
```

- [ ] **Step 5: Remove "Upgrade to Enterprise" button from template**

In `src/app/features/billing/components/billing-current-plan-card/billing-current-plan-card.component.html`, replace the entire `billing-current-plan__actions` div:

```html
<div class="billing-current-plan__actions">
  <button type="button" class="billing-btn billing-btn--primary" (click)="changePlan.emit()">
    <svg class="billing-svg-icon billing-svg-icon--sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
    Change Plan
  </button>
</div>
```

- [ ] **Step 6: Run lint**

```bash
npm run lint -- --quiet
```

Expected: no errors.

- [ ] **Step 7: Build to verify no compilation errors**

```bash
npm run build -- --configuration=development 2>&1 | tail -20
```

Expected: build completes without errors.

---

## Final Verification (run after all tasks complete)

- [ ] **Run all tests**

```bash
npm run test -- --watch=false --browsers=ChromeHeadless
```

Expected: all tests pass.

- [ ] **Full lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Full build**

```bash
npm run build
```

Expected: build succeeds.

> **Stop here.** Do not commit. The user will review the implementation and request a commit when satisfied.
