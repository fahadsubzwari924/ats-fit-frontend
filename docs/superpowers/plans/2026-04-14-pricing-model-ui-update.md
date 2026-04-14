# Pricing Model UI Update — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align all frontend pricing UI with the new Freemium / Pro pricing model ($12/mo · $89/yr) replacing the stale $19 "Premium" data.

**Architecture:** Three independent change groups — (1) landing page data + interface + component, (2) landing page template toggle, (3) billing section hardcoded values + enterprise button removal. Groups 1 and 3 can be done in parallel; group 2 depends on group 1.

**Tech Stack:** Angular 19 · TypeScript · Tailwind CSS · Angular signals (`signal`, `input`)

**Spec:** `docs/superpowers/specs/2026-04-14-pricing-model-ui-update-design.md`

---

## File Map

| Action | File |
|--------|------|
| Modify | `src/app/root/landing/interfaces/pricing.interface.ts` |
| Modify | `public/json/pricing.json` |
| Modify | `src/app/root/landing/enums/price-card-type.enum.ts` |
| Modify | `src/app/root/landing/components/price-card/price-card.component.ts` |
| Modify | `src/app/root/landing/components/price-card/price-card.component.html` |
| Modify | `src/app/root/landing/components/price-card/price-card.component.spec.ts` |
| Modify | `src/app/root/landing/landing.component.ts` |
| Modify | `src/app/root/landing/landing.component.html` |
| Modify | `src/app/features/billing/components/overview-tab/overview-tab.component.ts` |
| Modify | `src/app/features/billing/components/billing-current-plan-card/billing-current-plan-card.component.ts` |
| Modify | `src/app/features/billing/components/billing-current-plan-card/billing-current-plan-card.component.html` |

---

## Task 1: Update `IPricing` interface and `pricing.json`

**Files:**
- Modify: `src/app/root/landing/interfaces/pricing.interface.ts`
- Modify: `src/app/root/landing/enums/price-card-type.enum.ts`
- Modify: `public/json/pricing.json`

### Background
`IPricing` is the data contract between `pricing.json` and `PriceCardComponent`. It currently has no support for annual pricing variants. `PriceCardType` has `REGISTERED` and `PREMIUM` but the new plan name is "Pro".

- [ ] **Step 1: Update `IPricing` interface**

Replace the entire contents of `src/app/root/landing/interfaces/pricing.interface.ts`:

```ts
import { PriceCardType } from "@root/landing/enums/price-card-type.enum";

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

- [ ] **Step 2: Update `PriceCardType` enum**

Replace the entire contents of `src/app/root/landing/enums/price-card-type.enum.ts`:

```ts
export enum PriceCardType {
  REGISTERED = 'registered',
  PREMIUM = 'premium',
  PRO = 'pro',
}
```

- [ ] **Step 3: Replace `pricing.json` with correct data**

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

- [ ] **Step 4: Run lint to verify no errors**

```bash
cd /Users/fahadsubzwari924/Documents/sideProjects/ats-fit-frontend
npm run lint -- --quiet
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/root/landing/interfaces/pricing.interface.ts \
        src/app/root/landing/enums/price-card-type.enum.ts \
        public/json/pricing.json
git commit -m "feat: update pricing data and interface for Freemium/Pro model"
```

---

## Task 2: Update `PriceCardComponent` to support billing cycle toggle

**Files:**
- Modify: `src/app/root/landing/components/price-card/price-card.component.ts`
- Modify: `src/app/root/landing/components/price-card/price-card.component.html`
- Modify: `src/app/root/landing/components/price-card/price-card.component.spec.ts`

### Background
`PriceCardComponent` currently only renders `priceCard().price`. It needs a `selectedCycle` input to switch between monthly and annual pricing, and to show the savings badge.

- [ ] **Step 1: Write the failing tests**

Replace the entire contents of `src/app/root/landing/components/price-card/price-card.component.spec.ts`:

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { PriceCardComponent } from './price-card.component';
import { IPricing } from '@root/landing/interfaces/pricing.interface';
import { PriceCardType } from '@root/landing/enums/price-card-type.enum';

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

  it('shows monthly price by default', () => {
    fixture.componentRef.setInput('priceCard', PRO_PLAN);
    fixture.componentRef.setInput('selectedCycle', 'monthly');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('$12/mo');
    expect(el.textContent).not.toContain('$89/yr');
  });

  it('shows annual price when cycle is annual', () => {
    fixture.componentRef.setInput('priceCard', PRO_PLAN);
    fixture.componentRef.setInput('selectedCycle', 'annual');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('$89/yr');
    expect(el.textContent).not.toContain('$12/mo');
  });

  it('shows savings badge on annual cycle for Pro plan', () => {
    fixture.componentRef.setInput('priceCard', PRO_PLAN);
    fixture.componentRef.setInput('selectedCycle', 'annual');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Save 38%');
  });

  it('does not show savings badge on monthly cycle', () => {
    fixture.componentRef.setInput('priceCard', PRO_PLAN);
    fixture.componentRef.setInput('selectedCycle', 'monthly');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).not.toContain('Save 38%');
  });

  it('freemium card shows Free and never shows savings badge', () => {
    fixture.componentRef.setInput('priceCard', FREEMIUM_PLAN);
    fixture.componentRef.setInput('selectedCycle', 'annual');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Free');
    expect(el.textContent).not.toContain('Save 38%');
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd /Users/fahadsubzwari924/Documents/sideProjects/ats-fit-frontend
npm run test -- --include="**/price-card.component.spec.ts" --watch=false --browsers=ChromeHeadless
```

Expected: most tests fail because `selectedCycle` input doesn't exist yet.

- [ ] **Step 3: Update `PriceCardComponent` class**

Replace the entire contents of `src/app/root/landing/components/price-card/price-card.component.ts`:

```ts
import { Component, computed, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { IPricing } from '@root/landing/interfaces/pricing.interface';
import { PriceCardType } from '@root/landing/enums/price-card-type.enum';

@Component({
  selector: 'app-price-card',
  standalone: true,
  imports: [NgClass],
  templateUrl: './price-card.component.html',
  styleUrl: './price-card.component.scss',
})
export class PriceCardComponent {
  PriceCardType = PriceCardType;

  priceCard = input<IPricing>();
  selectedCycle = input<'monthly' | 'annual'>('monthly');

  displayPrice = computed(() => {
    const card = this.priceCard();
    if (!card) return '';
    if (this.selectedCycle() === 'annual' && card.annualPrice) {
      return card.annualPrice;
    }
    return card.price;
  });

  savingsBadge = computed(() => {
    const card = this.priceCard();
    if (!card) return null;
    if (this.selectedCycle() === 'annual' && card.annualSavingsBadge) {
      return card.annualSavingsBadge;
    }
    return null;
  });
}
```

- [ ] **Step 4: Update `PriceCardComponent` template**

Replace the entire contents of `src/app/root/landing/components/price-card/price-card.component.html`:

```html
<div
  class="rounded-lg bg-card text-card-foreground relative"
  [ngClass]="{
    'border shadow-sm border-slate-200': !priceCard()?.isPopular,
    'border-blue-500 border-2 shadow-xl': priceCard()?.isPopular
  }"
>
  @if (priceCard()?.isPopular) {
    <div class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent hover:bg-primary/80 absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white">
      Most Popular
    </div>
  }

  <div class="flex flex-col space-y-1.5 p-6 text-center">
    <h3 class="font-semibold tracking-tight text-2xl">{{ priceCard()?.title }}</h3>
    <div class="flex items-center justify-center gap-2">
      <span class="text-4xl font-bold text-blue-600">{{ displayPrice() }}</span>
      @if (savingsBadge()) {
        <span class="inline-flex items-center rounded-full bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5">
          {{ savingsBadge() }}
        </span>
      }
    </div>
    <p class="text-sm text-muted-foreground">{{ priceCard()?.description }}</p>
  </div>

  <div class="p-6 pt-0 space-y-4">
    <ul class="space-y-3">
      @for (feature of priceCard()?.features; track feature) {
        <li class="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round"
            class="lucide lucide-circle-check-big h-5 w-5 text-green-500 mr-3 flex-shrink-0">
            <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
            <path d="m9 11 3 3L22 4"></path>
          </svg>
          <span class="text-slate-700">{{ feature }}</span>
        </li>
      }
    </ul>

    @if (priceCard()?.isPopular) {
      <a
        class="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 rounded-md px-8 w-full mt-6"
        [href]="priceCard()?.buttonLink">{{ priceCard()?.buttonText }}</a>
    } @else {
      <a
        class="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 rounded-md px-8 w-full mt-6 btn-border-color"
        [href]="priceCard()?.buttonLink">{{ priceCard()?.buttonText }}</a>
    }
  </div>
</div>
```

- [ ] **Step 5: Run tests — verify they pass**

```bash
npm run test -- --include="**/price-card.component.spec.ts" --watch=false --browsers=ChromeHeadless
```

Expected: all 6 tests pass.

- [ ] **Step 6: Run lint**

```bash
npm run lint -- --quiet
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/root/landing/components/price-card/price-card.component.ts \
        src/app/root/landing/components/price-card/price-card.component.html \
        src/app/root/landing/components/price-card/price-card.component.spec.ts
git commit -m "feat: add billing cycle toggle support to PriceCardComponent"
```

---

## Task 3: Add billing cycle toggle to landing page

**Files:**
- Modify: `src/app/root/landing/landing.component.ts`
- Modify: `src/app/root/landing/landing.component.html`

### Background
The pricing section currently uses `md:grid-cols-3` (for 3 cards) and passes no `selectedCycle` to `app-price-card`. We now have 2 cards and need a monthly/annual toggle above them.

- [ ] **Step 1: Update `LandingComponent` class**

In `src/app/root/landing/landing.component.ts`, add the `selectedCycle` signal. The full updated file:

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

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [FeatureCardComponent, PriceCardComponent, JobStoryCardComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private meta = inject(Meta);
  private title = inject(Title);
  private modalService = inject(ModalService);
  private platformDataService = inject(PlatformDataService);
  private resumeService = inject(ResumeService);

  mobileMenuOpen = signal(false);
  showWizard = signal(false);
  canGenerateResume = signal(false);
  isAuthenticated = signal(false);
  selectedCycle = signal<'monthly' | 'annual'>('monthly');

  public features = signal<IFeature[]>([]);
  public pricingPlans = signal<IPricing[]>([]);
  public testimonials = signal<ITestimonial[]>([]);

  public templates = this.resumeService.availableTemplates;

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

  public openResumeModal(): void {
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

Locate the pricing section (lines 101–113 in the current file) and replace it with:

```html
<section class="py-16 px-4 bg-white">
  <div class="max-w-6xl mx-auto">
    <div class="text-center mb-10">
      <h2 class="text-4xl font-bold text-slate-900 mb-6">Choose Your Plan</h2>
      <p class="text-xl text-slate-600 mb-8">Start free and upgrade as your job search accelerates</p>

      <!-- Billing cycle toggle -->
      <div class="inline-flex items-center rounded-full bg-slate-100 p-1 gap-1">
        <button
          type="button"
          class="px-5 py-2 rounded-full text-sm font-medium transition-all"
          [class.bg-white]="selectedCycle() === 'monthly'"
          [class.shadow-sm]="selectedCycle() === 'monthly'"
          [class.text-slate-900]="selectedCycle() === 'monthly'"
          [class.text-slate-500]="selectedCycle() !== 'monthly'"
          (click)="selectedCycle.set('monthly')">
          Monthly
        </button>
        <button
          type="button"
          class="px-5 py-2 rounded-full text-sm font-medium transition-all"
          [class.bg-white]="selectedCycle() === 'annual'"
          [class.shadow-sm]="selectedCycle() === 'annual'"
          [class.text-slate-900]="selectedCycle() === 'annual'"
          [class.text-slate-500]="selectedCycle() !== 'annual'"
          (click)="selectedCycle.set('annual')">
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

- [ ] **Step 5: Commit**

```bash
git add src/app/root/landing/landing.component.ts \
        src/app/root/landing/landing.component.html
git commit -m "feat: add monthly/annual billing cycle toggle to landing pricing section"
```

---

## Task 4: Fix billing overview tab hardcoded values and enterprise references

**Files:**
- Modify: `src/app/features/billing/components/overview-tab/overview-tab.component.ts`
- Modify: `src/app/features/billing/components/billing-current-plan-card/billing-current-plan-card.component.ts`
- Modify: `src/app/features/billing/components/billing-current-plan-card/billing-current-plan-card.component.html`

### Background
`overview-tab.component.ts` has three stale values/methods: `$19` fallbacks (should be `$12`), `currentPlanFeatures()` searching for `'premium'` (should be `'pro'`), the `planAccent()` enterprise branch, and `onUpgradeEnterprise()`. The `billing-current-plan-card` has an `upgradeEnterprise` output and an "Upgrade to Enterprise" button in the template that must be removed.

- [ ] **Step 1: Fix `overview-tab.component.ts`**

Apply these four targeted changes to `src/app/features/billing/components/overview-tab/overview-tab.component.ts`:

**Change A** — `priceMain()` fallback (line ~109):
```ts
// Before:
if (this.userState.currentUser()?.isPremium) return '$19';

// After:
if (this.userState.currentUser()?.isPremium) return '$12';
```

**Change B** — `nextChargeAmount()` fallback (line ~163):
```ts
// Before:
return this.userState.currentUser()?.isPremium ? '$19.00' : '';

// After:
return this.userState.currentUser()?.isPremium ? '$12.00' : '';
```

**Change C** — `currentPlanFeatures()` substring search (line ~150):
```ts
// Before:
const premium = this.subscriptionPlan().find(p => p.planName?.toLowerCase().includes('premium'));
return premium?.features?.length ? premium.features : [];

// After:
const pro = this.subscriptionPlan().find(p => p.planName?.toLowerCase().includes('pro'));
return pro?.features?.length ? pro.features : [];
```

**Change D** — `planAccent()` (line ~166) — remove enterprise branch, add pro:
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
  const n = (plan.planName || '').toLowerCase();
  if (n.includes('pro')) return '#2563EB';
  return '#64748B';
}
```

**Change E** — remove `onUpgradeEnterprise()` method entirely (lines ~193–196):
```ts
// Remove this method:
onUpgradeEnterprise(): void {
  const ent = this.subscriptionPlan().find(p => p.planName?.toLowerCase().includes('enterprise'));
  if (ent) this.onPlanButtonClick(ent);
}
```

- [ ] **Step 2: Fix `billing-current-plan-card.component.ts`**

Remove the `upgradeEnterprise` output and update the `priceMain` default. Replace the entire file contents:

```ts
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-billing-current-plan-card',
  templateUrl: './billing-current-plan-card.component.html',
})
export class BillingCurrentPlanCardComponent {
  planLabel = input<string>('Pro');
  showPremiumSkin = input(true);
  priceMain = input<string>('$12');
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

- [ ] **Step 3: Fix `billing-current-plan-card.component.html`**

Remove the "Upgrade to Enterprise" button from the actions row. The `billing-current-plan__actions` div currently has two buttons; replace it with just the "Change Plan" button:

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

- [ ] **Step 4: Fix any call sites of `upgradeEnterprise` in the overview tab template**

Open `src/app/features/billing/components/overview-tab/overview-tab.component.html` and remove any binding to `(upgradeEnterprise)="onUpgradeEnterprise()"` on the `<app-billing-current-plan-card>` element.

Find the line like:
```html
<app-billing-current-plan-card
  ...
  (upgradeEnterprise)="onUpgradeEnterprise()"
  ...
```
Remove only the `(upgradeEnterprise)="onUpgradeEnterprise()"` binding. Leave all other bindings intact.

- [ ] **Step 5: Run lint**

```bash
npm run lint -- --quiet
```

Expected: no errors.

- [ ] **Step 6: Build to verify no compilation errors**

```bash
npm run build -- --configuration=development 2>&1 | tail -20
```

Expected: build completes without errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/features/billing/components/overview-tab/overview-tab.component.ts \
        src/app/features/billing/components/overview-tab/overview-tab.component.html \
        src/app/features/billing/components/billing-current-plan-card/billing-current-plan-card.component.ts \
        src/app/features/billing/components/billing-current-plan-card/billing-current-plan-card.component.html
git commit -m "fix: remove enterprise references and update Pro pricing fallbacks in billing section"
```

---

## Final Verification

- [ ] **Run all tests**

```bash
npm run test -- --watch=false --browsers=ChromeHeadless
```

Expected: all tests pass.

- [ ] **Run full lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Run build**

```bash
npm run build
```

Expected: build succeeds with no errors.
