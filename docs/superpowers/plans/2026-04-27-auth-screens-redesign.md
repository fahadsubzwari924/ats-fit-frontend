# Auth Screens Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the signin and signup screens with a full-screen immersive aurora background (deep blue → indigo/violet), a glassmorphism floating form card, subtly animated orbs, and minimal copy — while leaving all Angular form logic, routing, and service calls completely untouched.

**Architecture:** A shared SCSS partial (`_auth-aurora.scss`) holds all aurora canvas, orb animation, glass card, and typography styles. Both component SCSS files import this partial and add their own dark-theme overrides for child components (`app-input-field`, `app-inline-alert`). Both component HTML templates are fully replaced with new markup that preserves every existing Angular binding, directive, and signal reference verbatim.

**Tech Stack:** Angular 19 standalone components, SCSS with `@use`, Tailwind v4 (utility classes kept where already used by child components), CSS keyframe animations.

**Constraints:**
- No unit tests.
- No commits at any point — not after tasks, not at the end.
- All Angular form bindings, service calls, router links, and signal reads must remain exactly as they are. Only markup structure and styling change.

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Create | `src/scss/_auth-aurora.scss` | Aurora canvas, orbs, glass card, content layout, typography — shared by both auth screens |
| Replace | `src/app/features/authentication/components/signin/signin.component.html` | New aurora-structured template, all existing Angular bindings preserved |
| Replace | `src/app/features/authentication/components/signin/signin.component.scss` | Import aurora partial + progress bar + dark field overrides |
| Replace | `src/app/features/authentication/components/signup/signup.component.html` | New aurora-structured template, all existing Angular bindings preserved |
| Replace | `src/app/features/authentication/components/signup/signup.component.scss` | Import aurora partial + dark field overrides |

---

## Task 1: Create the shared aurora SCSS partial

**Files:**
- Create: `src/scss/_auth-aurora.scss`

- [ ] **Step 1: Create `src/scss/_auth-aurora.scss` with the full aurora, glass card, and typography styles**

```scss
// ─── Page Canvas ─────────────────────────────────────────────────────────────
.auth-aurora-page {
  min-height: 100vh;
  background: #060d1f;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

// ─── Animated Orbs ───────────────────────────────────────────────────────────
.aurora-orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.aurora-orb--blue {
  width: 700px;
  height: 700px;
  background: radial-gradient(
    circle at center,
    rgba(37, 99, 235, 0.72) 0%,
    rgba(29, 78, 216, 0.42) 38%,
    transparent 70%
  );
  filter: blur(80px);
  top: -220px;
  left: -180px;
  animation: aurora-drift-blue 10s ease-in-out infinite alternate;
}

.aurora-orb--violet {
  width: 800px;
  height: 800px;
  background: radial-gradient(
    circle at center,
    rgba(124, 58, 237, 0.68) 0%,
    rgba(79, 70, 229, 0.42) 38%,
    transparent 70%
  );
  filter: blur(100px);
  bottom: -260px;
  right: -220px;
  animation: aurora-drift-violet 14s ease-in-out infinite alternate;
}

@keyframes aurora-drift-blue {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(80px, 100px) scale(1.12); }
}

@keyframes aurora-drift-violet {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(-70px, -50px) scale(1.09); }
}

@media (prefers-reduced-motion: reduce) {
  .aurora-orb { animation: none; }
}

// ─── Noise Overlay ───────────────────────────────────────────────────────────
.aurora-noise {
  position: absolute;
  inset: 0;
  opacity: 0.035;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-size: 256px 256px;
  background-repeat: repeat;
}

// ─── Content Stack ───────────────────────────────────────────────────────────
.auth-content {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 440px;
}

// ─── Logo ─────────────────────────────────────────────────────────────────────
.auth-logo {
  margin-bottom: 1.25rem;

  img {
    height: 40px;
    width: auto;
    display: block;
  }
}

// ─── Tagline ──────────────────────────────────────────────────────────────────
.auth-tagline {
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.52);
  letter-spacing: 0.025em;
  text-align: center;
  margin: 0 0 1.75rem;
}

// ─── Glass Card ───────────────────────────────────────────────────────────────
.auth-glass-card {
  position: relative;
  width: 100%;
  background: rgba(255, 255, 255, 0.07);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 20px;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.04) inset,
    0 0 48px rgba(37, 99, 235, 0.18),
    0 20px 60px rgba(0, 0, 0, 0.4);
  overflow: hidden;

  // Top-edge inner highlight
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.28) 30%,
      rgba(255, 255, 255, 0.28) 70%,
      transparent
    );
    pointer-events: none;
    z-index: 1;
  }
}

// ─── Card Body ────────────────────────────────────────────────────────────────
.auth-card-body {
  padding: 2rem;
}

// ─── Card Header ──────────────────────────────────────────────────────────────
.auth-card-header {
  text-align: center;
  margin-bottom: 1.75rem;
}

.auth-card-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.02em;
  line-height: 1.2;
  margin: 0 0 0.5rem;
}

.auth-card-subtitle {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.48);
  margin: 0;
  line-height: 1.5;
}

// ─── Footer Links ─────────────────────────────────────────────────────────────
.auth-link-text {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.48);
  text-align: center;
}

.auth-link {
  color: rgba(147, 197, 253, 0.9);
  font-weight: 500;
  text-decoration: none;
  transition: color 150ms ease;

  &:hover { color: #ffffff; }
}

.auth-forgot-link {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.32);
  text-decoration: none;
  display: block;
  text-align: center;
  margin-top: 0.5rem;
  transition: color 150ms ease;

  &:hover { color: rgba(255, 255, 255, 0.6); }
}

// ─── Checkbox Row ─────────────────────────────────────────────────────────────
.auth-checkbox-label {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
}

.auth-checkbox-link {
  color: rgba(147, 197, 253, 0.9);
  text-decoration: none;
  transition: color 150ms ease;

  &:hover { color: #ffffff; }
}

// ─── Back Link ────────────────────────────────────────────────────────────────
.auth-back-link {
  display: block;
  margin-top: 1.5rem;
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.35);
  text-decoration: none;
  text-align: center;
  transition: color 150ms ease;

  &:hover { color: rgba(255, 255, 255, 0.65); }
}

// ─── Mobile ───────────────────────────────────────────────────────────────────
@media (max-width: 640px) {
  .auth-glass-card {
    backdrop-filter: blur(12px) saturate(140%);
    -webkit-backdrop-filter: blur(12px) saturate(140%);
    border-radius: 16px;
  }

  .auth-card-body {
    padding: 1.5rem;
  }

  .aurora-orb--blue {
    width: 380px;
    height: 380px;
    top: -120px;
    left: -100px;
  }

  .aurora-orb--violet {
    width: 460px;
    height: 460px;
    bottom: -160px;
    right: -140px;
  }
}
```

- [ ] **Step 2: Verify the file was created**

```bash
ls src/scss/_auth-aurora.scss
```

Expected: file listed with no error.

---

## Task 2: Redesign `signin.component.html`

**Files:**
- Replace: `src/app/features/authentication/components/signin/signin.component.html`

- [ ] **Step 1: Replace the entire template with the aurora-structured signin markup**

All Angular bindings (`[formGroup]`, `formControlName`, `(ngSubmit)`, `isSubmitting()`, `showRegistrationBanner()`, `signinForm`, `passwordFieldType()`, `InputType`, `errorMessage()`, `togglePasswordVisibility()`) are preserved verbatim.

```html
<div class="auth-aurora-page">

  <!-- Background orbs -->
  <div class="aurora-orb aurora-orb--blue" aria-hidden="true"></div>
  <div class="aurora-orb aurora-orb--violet" aria-hidden="true"></div>

  <!-- Noise texture overlay -->
  <div class="aurora-noise" aria-hidden="true"></div>

  <!-- Content -->
  <div class="auth-content">

    <!-- Logo -->
    <div class="auth-logo">
      <a href="/">
        <img src="/logos/transparent_white_logo.svg" alt="ATS Fit" />
      </a>
    </div>

    <!-- Tagline -->
    <p class="auth-tagline">Outsmart the ATS. Land the interview.</p>

    <!-- Glass card -->
    <div
      class="auth-glass-card"
      [attr.aria-busy]="isSubmitting() ? true : null"
    >
      <!-- Loading progress bar -->
      @if (isSubmitting()) {
        <div class="signin-linear-progress" role="progressbar" aria-label="Signing in"></div>
      }

      <!-- Registration success banner -->
      @if (showRegistrationBanner()) {
        <div class="auth-success-banner" role="status" aria-live="polite">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Account created — sign in to continue.</span>
        </div>
      }

      <div class="auth-card-body">

        <!-- Header -->
        <div class="auth-card-header">
          <h1 class="auth-card-title">Welcome back</h1>
          <p class="auth-card-subtitle">Sign in to continue optimizing your resume</p>
        </div>

        <!-- Form -->
        <form [formGroup]="signinForm" (ngSubmit)="login()" class="space-y-4">

          <div class="space-y-2">
            <app-input-field
              formControlName="email"
              id="email"
              label="Email"
              type="email"
              placeholder="Enter your email"
              [required]="true"
            ></app-input-field>
          </div>

          <div class="space-y-2">
            <div class="relative">
              <app-input-field
                formControlName="password"
                id="password"
                label="Password"
                [type]="passwordFieldType()"
                placeholder="Enter your password"
                [required]="true"
              ></app-input-field>
              <button
                type="button"
                class="absolute right-3 top-10 transform cursor-pointer"
                (click)="togglePasswordVisibility()"
                [disabled]="isSubmitting()"
              >
                <mat-icon class="h-4 w-4" style="color: rgba(255,255,255,0.45);">
                  {{ passwordFieldType() === InputType.PASSWORD ? 'visibility' : 'visibility_off' }}
                </mat-icon>
              </button>
            </div>
          </div>

          <app-inline-alert [message]="errorMessage()" type="error" />

          <app-button
            [fullWidth]="true"
            [text]="isSubmitting() ? 'Signing in…' : 'Sign In'"
            type="submit"
            [loading]="isSubmitting()"
            loadingIndicator="dots"
          ></app-button>

        </form>

        <!-- Footer links -->
        <div class="mt-6 space-y-2">
          <p class="auth-link-text">
            Don't have an account?
            <a class="auth-link" [routerLink]="'/signup'">Sign up for free</a>
          </p>
          <a [routerLink]="'/forgot-password'" class="auth-forgot-link">Forgot your password?</a>
        </div>

      </div>
    </div>

    <!-- Back to home -->
    <a class="auth-back-link" href="/">← Back to home</a>

  </div>
</div>
```

- [ ] **Step 2: Verify the file saved correctly — check that `signinForm`, `isSubmitting()`, `showRegistrationBanner()`, `errorMessage()`, `passwordFieldType()`, `InputType`, and `togglePasswordVisibility()` all appear in the file**

```bash
grep -E "signinForm|isSubmitting|showRegistrationBanner|errorMessage|passwordFieldType|InputType|togglePasswordVisibility" \
  src/app/features/authentication/components/signin/signin.component.html
```

Expected: all seven identifiers found, each on at least one line.

---

## Task 3: Update `signin.component.scss`

**Files:**
- Replace: `src/app/features/authentication/components/signin/signin.component.scss`

- [ ] **Step 1: Replace the entire file with the aurora import + dark overrides + adapted progress bar**

```scss
@use '../../../../../scss/auth-aurora';

// ─── Loading progress bar (top of glass card) ─────────────────────────────────
.signin-linear-progress {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  overflow: hidden;
  z-index: 2;
  pointer-events: none;
  border-radius: 20px 20px 0 0;
  background: rgba(255, 255, 255, 0.06);
}

.signin-linear-progress::after {
  content: '';
  position: absolute;
  inset: 0;
  width: 42%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(37, 99, 235, 0.45),
    hsl(221 83% 68%),
    rgba(37, 99, 235, 0.45),
    transparent
  );
  animation: signin-progress-slide 1.15s ease-in-out infinite;
}

@keyframes signin-progress-slide {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(320%); }
}

// ─── Registration success banner (dark glass version) ─────────────────────────
.auth-success-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(16, 185, 129, 0.1);
  border-bottom: 1px solid rgba(16, 185, 129, 0.22);
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  color: rgba(110, 231, 183, 0.95);
  position: relative;
  z-index: 1;
}

// ─── Dark theme overrides for app-input-field ─────────────────────────────────
:host ::ng-deep {
  // Label
  label.text-sm.font-medium {
    color: rgba(255, 255, 255, 0.78);
  }

  // Input element (targeted by the specific flex class on the input)
  input.flex {
    background: rgba(255, 255, 255, 0.08) !important;
    border-color: rgba(255, 255, 255, 0.18) !important;
    color: #ffffff !important;

    &::placeholder {
      color: rgba(255, 255, 255, 0.28) !important;
    }

    &:focus-visible {
      border-color: #2563eb !important;
      --tw-ring-color: rgba(37, 99, 235, 0.3) !important;
      outline: none;
    }

    &:focus {
      border-color: #2563eb !important;
      outline: none;
    }

    &.invalid {
      border-color: rgba(239, 68, 68, 0.65) !important;
    }

    &:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
  }

  // Validation error text
  .error.text-danger {
    color: rgba(252, 165, 165, 0.88);
  }

  // app-inline-alert error variant on dark background
  [role="alert"] {
    background: rgba(239, 68, 68, 0.1) !important;
    border-color: rgba(239, 68, 68, 0.4) !important;
    color: rgba(252, 165, 165, 0.92) !important;

    svg {
      color: rgba(252, 165, 165, 0.75) !important;
    }
  }
}
```

- [ ] **Step 2: Verify the aurora partial import resolves — run the Angular build in watch mode for a few seconds and check for SCSS errors**

```bash
npx ng build --configuration development 2>&1 | head -40
```

Expected: No `Cannot find module` or `Undefined variable` errors. Build may or may not fully succeed — look specifically for SCSS compilation errors referencing `_auth-aurora` or `signin.component.scss`.

---

## Task 4: Redesign `signup.component.html`

**Files:**
- Replace: `src/app/features/authentication/components/signup/signup.component.html`

- [ ] **Step 1: Replace the entire template with the aurora-structured signup markup**

All Angular bindings (`[formGroup]="signupForm"`, `(ngSubmit)="submit()"`, `formControlName`, `passwordFieldType()`, `confirmPasswordFieldType()`, `InputType`, `togglePasswordVisibility()`, `toggleConfirmPasswordVisibility()`, `signupForm.hasError(...)`, `isTermsInvalid`, `errorMessage()`) are preserved verbatim.

```html
<div class="auth-aurora-page">

  <!-- Background orbs -->
  <div class="aurora-orb aurora-orb--blue" aria-hidden="true"></div>
  <div class="aurora-orb aurora-orb--violet" aria-hidden="true"></div>

  <!-- Noise texture overlay -->
  <div class="aurora-noise" aria-hidden="true"></div>

  <!-- Content -->
  <div class="auth-content">

    <!-- Logo -->
    <div class="auth-logo">
      <a href="/">
        <img src="/logos/transparent_white_logo.svg" alt="ATS Fit" />
      </a>
    </div>

    <!-- Tagline -->
    <p class="auth-tagline">Outsmart the ATS. Land the interview.</p>

    <!-- Glass card -->
    <div class="auth-glass-card">
      <div class="auth-card-body">

        <!-- Header -->
        <div class="auth-card-header">
          <h1 class="auth-card-title">Get started free</h1>
          <p class="auth-card-subtitle">Join thousands of job seekers who've improved their success rate</p>
        </div>

        <!-- Form -->
        <form [formGroup]="signupForm" (ngSubmit)="submit()" class="space-y-4">

          <div class="space-y-2">
            <app-input-field
              id="fullName"
              label="Full Name"
              type="text"
              placeholder="Enter your full name"
              formControlName="full_name"
              [required]="true"
            ></app-input-field>
          </div>

          <div class="space-y-2">
            <app-input-field
              id="email"
              label="Email"
              type="email"
              placeholder="Enter your email"
              formControlName="email"
              [required]="true"
            ></app-input-field>
          </div>

          <div class="space-y-2">
            <div class="relative">
              <app-input-field
                id="password"
                label="Password"
                [type]="passwordFieldType()"
                placeholder="Create a strong password"
                formControlName="password"
                [required]="true"
              ></app-input-field>
              <button
                type="button"
                class="absolute right-3 top-10 transform cursor-pointer"
                (click)="togglePasswordVisibility()"
              >
                <mat-icon class="h-4 w-4" style="color: rgba(255,255,255,0.45);">
                  {{ passwordFieldType() === InputType.PASSWORD ? 'visibility' : 'visibility_off' }}
                </mat-icon>
              </button>
            </div>
          </div>

          <div class="space-y-2">
            <div class="relative">
              <app-input-field
                id="confirmPassword"
                label="Confirm Password"
                [type]="confirmPasswordFieldType()"
                placeholder="Confirm your password"
                formControlName="confirmPassword"
                [required]="true"
              ></app-input-field>
              <button
                type="button"
                class="absolute right-3 top-10 transform cursor-pointer"
                (click)="toggleConfirmPasswordVisibility()"
              >
                <mat-icon class="h-4 w-4 material-icons" style="color: rgba(255,255,255,0.45);">
                  {{ confirmPasswordFieldType() === InputType.PASSWORD ? 'visibility' : 'visibility_off' }}
                </mat-icon>
              </button>
            </div>

            @if (signupForm.hasError('passwordsMismatch') && (signupForm.get('password')?.touched || signupForm.get('confirmPassword')?.touched)) {
              <div class="text-xs mt-1" style="color: rgba(252,165,165,0.88);">
                <span>Passwords do not match.</span>
              </div>
            }
          </div>

          <!-- Terms checkbox -->
          <div class="flex items-center space-x-2">
            <input
              type="checkbox"
              formControlName="terms"
              id="terms"
              class="peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
            />
            <label class="auth-checkbox-label peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="terms">
              I agree to the
              <a [routerLink]="'/terms'" class="auth-checkbox-link">Terms of Service</a>
              and
              <a [routerLink]="'/privacy'" class="auth-checkbox-link">Privacy Policy</a>
            </label>
          </div>

          @if (isTermsInvalid) {
            <div class="text-xs mt-1" style="color: rgba(252,165,165,0.88);">
              <span>You must agree to the Terms of Service and Privacy Policy.</span>
            </div>
          }

          <app-inline-alert [message]="errorMessage()" type="error" />

          <app-button
            type="submit"
            text="Create Free Account"
            [fullWidth]="true"
            [disabled]="signupForm.invalid"
          ></app-button>

        </form>

        <!-- Footer link -->
        <div class="mt-6 text-center">
          <p class="auth-link-text">
            Already have an account?
            <a class="auth-link" [routerLink]="'/signin'">Sign in</a>
          </p>
        </div>

      </div>
    </div>

    <!-- Back to home -->
    <a class="auth-back-link" [routerLink]="'/'">← Back to home</a>

  </div>
</div>
```

- [ ] **Step 2: Verify all Angular bindings are present**

```bash
grep -E "signupForm|submit\(\)|formControlName|passwordFieldType|confirmPasswordFieldType|InputType|togglePasswordVisibility|toggleConfirmPasswordVisibility|hasError|isTermsInvalid|errorMessage" \
  src/app/features/authentication/components/signup/signup.component.html
```

Expected: all identifiers found.

---

## Task 5: Update `signup.component.scss`

**Files:**
- Replace: `src/app/features/authentication/components/signup/signup.component.scss`

- [ ] **Step 1: Replace the empty file with the aurora import + dark field overrides**

```scss
@use '../../../../../scss/auth-aurora';

// ─── Dark theme overrides for app-input-field ─────────────────────────────────
:host ::ng-deep {
  // Label
  label.text-sm.font-medium {
    color: rgba(255, 255, 255, 0.78);
  }

  // Input element
  input.flex {
    background: rgba(255, 255, 255, 0.08) !important;
    border-color: rgba(255, 255, 255, 0.18) !important;
    color: #ffffff !important;

    &::placeholder {
      color: rgba(255, 255, 255, 0.28) !important;
    }

    &:focus-visible {
      border-color: #2563eb !important;
      --tw-ring-color: rgba(37, 99, 235, 0.3) !important;
      outline: none;
    }

    &:focus {
      border-color: #2563eb !important;
      outline: none;
    }

    &.invalid {
      border-color: rgba(239, 68, 68, 0.65) !important;
    }

    &:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
  }

  // Validation error text from app-input-field
  .error.text-danger {
    color: rgba(252, 165, 165, 0.88);
  }

  // app-inline-alert error variant on dark background
  [role="alert"] {
    background: rgba(239, 68, 68, 0.1) !important;
    border-color: rgba(239, 68, 68, 0.4) !important;
    color: rgba(252, 165, 165, 0.92) !important;

    svg {
      color: rgba(252, 165, 165, 0.75) !important;
    }
  }
}
```

- [ ] **Step 2: Run a full development build to catch any SCSS or template errors**

```bash
npx ng build --configuration development 2>&1 | tail -30
```

Expected: Build completes without errors referencing auth components or the `_auth-aurora` partial. Template type-check errors about existing bindings would indicate an accidental binding change — investigate if any appear.

- [ ] **Step 3: Serve the app and visually verify both screens**

```bash
npm run start
```

Open `http://localhost:4200/signin` and `http://localhost:4200/signup` in the browser.

Check each screen for:
- [ ] Deep navy background (`#060d1f`) visible
- [ ] Blue orb upper-left, violet orb lower-right, both slowly drifting
- [ ] White ATS Fit logo centered above the card
- [ ] Tagline "Outsmart the ATS. Land the interview." in muted white below logo
- [ ] Glassmorphism card: frosted, blurred, subtle white border, blue glow shadow
- [ ] Input fields: dark glass fill, white text, white placeholder at low opacity
- [ ] Labels: white at ~80% opacity
- [ ] Password toggle icons visible against dark background
- [ ] CTA button: solid blue, white text
- [ ] "Sign up for free" / "Sign in" links in light blue
- [ ] "Forgot your password?" in very muted white
- [ ] "← Back to home" in muted white below card
- [ ] Registration banner (signin): green-tinted dark glass strip at card top when `?registered=true` query param is present
- [ ] Loading progress bar (signin): blue shimmer at top of card when form submits

- [ ] **Step 4: Verify form functionality is untouched**

- [ ] Submitting signin with wrong credentials shows the inline error alert
- [ ] Password toggle eye icon toggles field type correctly
- [ ] Signup passwords-mismatch validation message appears when fields differ
- [ ] Unchecked terms checkbox shows error on submit attempt
- [ ] Successful signup redirects to `/signin?registered=true` with the green banner
