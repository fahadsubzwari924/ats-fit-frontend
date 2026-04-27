# Auth Flow UX Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace floating toast notifications in the auth flow with inline alerts and silent redirects, following standard SaaS UX patterns.

**Architecture:** Create a shared `InlineAlertComponent` used by signup and signin forms. Signup redirects to signin with `?registered=true` query param; signin reads it and shows a persistent green banner. Auth guard becomes a silent redirect. Google auth buttons are commented out pending full integration.

**Tech Stack:** Angular 19 standalone components, Signals (`signal()`, `input()`), Tailwind CSS, Angular Router (`ActivatedRoute`), `ChangeDetectionStrategy.OnPush`

---

## File Map

| Action | Path |
|---|---|
| **Create** | `src/app/shared/components/ui/inline-alert/inline-alert.component.ts` |
| **Create** | `src/app/shared/components/ui/inline-alert/inline-alert.component.html` |
| **Modify** | `src/app/core/guards/auth.guard.ts` |
| **Modify** | `src/app/features/authentication/components/signup/signup.component.ts` |
| **Modify** | `src/app/features/authentication/components/signup/signup.component.html` |
| **Modify** | `src/app/features/authentication/components/signin/signin.component.ts` |
| **Modify** | `src/app/features/authentication/components/signin/signin.component.html` |

---

## Task 1: Create `InlineAlertComponent`

**Files:**
- Create: `src/app/shared/components/ui/inline-alert/inline-alert.component.ts`
- Create: `src/app/shared/components/ui/inline-alert/inline-alert.component.html`

- [ ] **Step 1: Create component TypeScript file**

Create `src/app/shared/components/ui/inline-alert/inline-alert.component.ts`:

```typescript
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type InlineAlertType = 'error' | 'success' | 'info';

@Component({
  selector: 'app-inline-alert',
  standalone: true,
  templateUrl: './inline-alert.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InlineAlertComponent {
  message = input<string | null>(null);
  type = input<InlineAlertType>('error');

  readonly containerClasses = computed(() => {
    const base = 'flex items-center gap-3 rounded-md border-l-4 px-4 py-3 text-sm';
    const variants: Record<InlineAlertType, string> = {
      error: 'bg-red-50 border-red-500 text-red-700',
      success: 'bg-green-50 border-green-500 text-green-700',
      info: 'bg-blue-50 border-blue-500 text-blue-700',
    };
    return `${base} ${variants[this.type()]}`;
  });

  readonly iconPath = computed(() => {
    const icons: Record<InlineAlertType, string> = {
      error:
        'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
      success:
        'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      info:
        'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zM12 8.25h.008v.008H12V8.25z',
    };
    return icons[this.type()];
  });
}
```

- [ ] **Step 2: Create component HTML template**

Create `src/app/shared/components/ui/inline-alert/inline-alert.component.html`:

```html
@if (message()) {
  <div [class]="containerClasses()" role="alert" aria-live="polite">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-5 w-5 flex-shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="1.5"
    >
      <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="iconPath()" />
    </svg>
    <span>{{ message() }}</span>
  </div>
}
```


---

## Task 2: Simplify `auth.guard.ts` — silent redirect

**Files:**
- Modify: `src/app/core/guards/auth.guard.ts`

- [ ] **Step 1: Replace guard with silent redirect version**

Replace the full content of `src/app/core/guards/auth.guard.ts`:

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { StorageService } from '@shared/services/storage.service';
import { AppRoutes } from '@core/constants/app-routes.contant';
import { Platform } from '@angular/cdk/platform';

export const authGuard: CanActivateFn = (_route, _state) => {
  const platform = new Platform();

  if (!platform.isBrowser) {
    return false;
  }

  const router = inject(Router);
  const storageService = inject(StorageService);

  const token = storageService.getToken();

  if (token) {
    return true;
  }

  storageService.clear();
  router.navigateByUrl(AppRoutes.SIGNIN);
  return false;
};
```

- [ ] **Step 2: Done**

File updated.

---

## Task 3: Update `signup.component.ts`

**Files:**
- Modify: `src/app/features/authentication/components/signup/signup.component.ts`

- [ ] **Step 1: Replace component TypeScript**

Replace the full content of `src/app/features/authentication/components/signup/signup.component.ts`:

```typescript
import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
// Components
import { InputFieldComponent } from '@shared/components/ui/input-field/input-field.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { InlineAlertComponent } from '@shared/components/ui/inline-alert/inline-alert.component';
// Services
import { AuthService } from '@features/authentication/services/auth.service';
// Enums
import { Messages } from '@core/enums/messages.enum';
import { InputType } from '@shared/components/ui/input-field/enum/input-type.enum';
// Constants
import { AppRoutes } from '@core/constants/app-routes.contant';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, InputFieldComponent, MatIconModule, ButtonComponent, InlineAlertComponent],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
export class SignupComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  public signupForm!: FormGroup;
  public errorMessage = signal<string | null>(null);

  passwordFieldType = signal<string>(InputType.PASSWORD);
  confirmPasswordFieldType = signal<string>(InputType.PASSWORD);
  InputType = InputType;

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.signupForm = this.fb.group(
      {
        full_name: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
        terms: [false, [Validators.requiredTrue]],
      },
      { validators: this.passwordsMatchValidator },
    );
  }

  passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordsMismatch: true };
  }

  togglePasswordVisibility(): void {
    this.passwordFieldType.set(
      this.passwordFieldType() === InputType.PASSWORD ? InputType.TEXT : InputType.PASSWORD,
    );
  }

  toggleConfirmPasswordVisibility(): void {
    this.confirmPasswordFieldType.set(
      this.confirmPasswordFieldType() === InputType.PASSWORD ? InputType.TEXT : InputType.PASSWORD,
    );
  }

  get isTermsInvalid(): boolean {
    const termsControl = this.signupForm.get('terms');
    return termsControl ? termsControl.invalid && termsControl.touched : false;
  }

  submit(): void {
    if (this.signupForm.invalid) {
      return;
    }

    this.errorMessage.set(null);

    const payload = {
      full_name: this.signupForm.value.full_name,
      email: this.signupForm.value.email,
      password: this.signupForm.value.password,
    };

    this.authService.signup(payload as Record<string, unknown>).subscribe({
      next: () => {
        this.router.navigate([AppRoutes.SIGNIN], { queryParams: { registered: 'true' } });
      },
      error: (error) => {
        this.errorMessage.set(error?.error?.message || error?.message || Messages.SIGNUP_FAILED);
        console.error('Signup failed', error);
      },
    });
  }
}
```

---

## Task 4: Update `signup.component.html`

**Files:**
- Modify: `src/app/features/authentication/components/signup/signup.component.html`

- [ ] **Step 1: Replace template**

Replace the full content of `src/app/features/authentication/components/signup/signup.component.html`:

```html
<div
  class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-primary-muted flex items-center justify-center px-4 py-8"
>
  <div class="w-full max-w-md">
    <div class="text-center mb-8">
      <a href="/">
        <img src="/logos/transparent_blue_logo.svg" alt="ATS Fit" style="height:36px;width:auto;">
      </a>
    </div>
    <div class="rounded-lg bg-card text-card-foreground shadow-xl border-0">
      <div class="flex flex-col space-y-1.5 p-6 text-center">
        <h3 class="tracking-tight text-2xl font-bold">Create Your Account</h3>
        <p class="text-sm text-muted-foreground">
          Join thousands of job seekers who've improved their success rate
        </p>
      </div>
      <div class="p-6 pt-0 space-y-6">
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
              <button type="button" class="absolute right-3 top-10 transform cursor-pointer" (click)="togglePasswordVisibility()">
                <mat-icon class="h-4 w-4 text-slate-400">{{ passwordFieldType() === InputType.PASSWORD ? 'visibility' : 'visibility_off' }}</mat-icon>
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
              <button type="button" class="absolute right-3 top-10 transform cursor-pointer" (click)="toggleConfirmPasswordVisibility()">
                <mat-icon class="h-4 w-4 text-slate-400 material-icons">{{ confirmPasswordFieldType() === InputType.PASSWORD ? 'visibility' : 'visibility_off' }}</mat-icon>
              </button>
            </div>
            @if (signupForm.hasError('passwordsMismatch') && (signupForm.get('password')?.touched || signupForm.get('confirmPassword')?.touched)) {
              <div class="text-xs text-red-600 mt-1">
                <span>Passwords do not match.</span>
              </div>
            }
          </div>
          <div class="flex items-center space-x-2">
            <input
              type="checkbox"
              formControlName="terms"
              id="terms"
              class="peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
            />
            <label class="font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm text-slate-600" for="terms">
              I agree to the
              <a [routerLink]="'/terms'" class="text-blue-600 hover:text-blue-700 cursor-pointer">Terms of Service</a>
              and
              <a [routerLink]="'/privacy'" class="text-blue-600 hover:text-blue-700 cursor-pointer">Privacy Policy</a>
            </label>
          </div>
          @if (isTermsInvalid) {
            <div class="text-xs text-red-600 mt-1">
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

        <!-- Google auth — coming soon
        <div class="relative">
          <app-google-auth-button></app-google-auth-button>
        </div>
        -->

        <div class="text-center">
          <p class="text-sm text-slate-600">
            Already have an account?
            <a
              class="text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
              [routerLink]="'/signin'"
            >Sign in</a>
          </p>
        </div>
      </div>
    </div>
    <div class="text-center mt-6">
      <a
        class="text-sm text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
        [routerLink]="'/'"
      >← Back to home</a>
    </div>
  </div>
</div>
```

---

## Task 5: Update `signin.component.ts`

**Files:**
- Modify: `src/app/features/authentication/components/signin/signin.component.ts`

- [ ] **Step 1: Replace component TypeScript**

Replace the full content of `src/app/features/authentication/components/signin/signin.component.ts`:

```typescript
import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { finalize } from 'rxjs';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
// Components
import { InputFieldComponent } from '@shared/components/ui/input-field/input-field.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { InlineAlertComponent } from '@shared/components/ui/inline-alert/inline-alert.component';
// Services
import { AuthService } from '@features/authentication/services/auth.service';
import { StorageService } from '@shared/services/storage.service';
// States
import { UserState } from '@core/states/user.state';
// Enums
import { Messages } from '@core/enums/messages.enum';
import { InputType } from '@shared/components/ui/input-field/enum/input-type.enum';
// Constants
import { AppRoutes } from '@core/constants/app-routes.contant';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, InputFieldComponent, MatIconModule, ButtonComponent, InlineAlertComponent],
  templateUrl: './signin.component.html',
  styleUrl: './signin.component.scss',
})
export class SigninComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private formbuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private storageService = inject(StorageService);
  private userState = inject(UserState);

  public signinForm!: FormGroup;
  public passwordFieldType = signal<string>(InputType.PASSWORD);
  public InputType = InputType;
  public isSubmitting = signal(false);
  public errorMessage = signal<string | null>(null);
  public showRegistrationBanner = signal(false);

  private _bannerTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.initializeForm();
    this.checkRegistrationParam();
  }

  ngOnDestroy(): void {
    if (this._bannerTimer !== null) {
      clearTimeout(this._bannerTimer);
    }
  }

  private initializeForm(): void {
    this.signinForm = this.formbuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  private checkRegistrationParam(): void {
    const registered = this.route.snapshot.queryParamMap.get('registered');
    if (registered === 'true') {
      this.showRegistrationBanner.set(true);
      this._bannerTimer = setTimeout(() => {
        this.showRegistrationBanner.set(false);
      }, 6000);
    }
  }

  public togglePasswordVisibility(): void {
    this.passwordFieldType.set(
      this.passwordFieldType() === InputType.PASSWORD ? InputType.TEXT : InputType.PASSWORD,
    );
  }

  public login(): void {
    if (this.isSubmitting()) {
      return;
    }

    if (this.signinForm.invalid) {
      this.signinForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);
    this.signinForm.disable({ emitEvent: false });

    this.authService
      .login(this.signinForm.getRawValue() as Record<string, unknown>)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.signinForm.enable({ emitEvent: false });
        }),
      )
      .subscribe({
        next: (response) => {
          if (!response.user || !response.accessToken) {
            this.errorMessage.set(Messages.LOGIN_FAILED);
            return;
          }
          this.storageService.setToken(response.accessToken);
          this.userState.setUser(response.user);
          this.router.navigateByUrl(AppRoutes.DASHBOARD);
        },
        error: (error) => {
          this.errorMessage.set(
            error?.error?.message || error?.message || Messages.LOGIN_FAILED,
          );
          console.error('Login failed', error);
        },
      });
  }
}
```

---

## Task 6: Update `signin.component.html`

**Files:**
- Modify: `src/app/features/authentication/components/signin/signin.component.html`

- [ ] **Step 1: Replace template**

Replace the full content of `src/app/features/authentication/components/signin/signin.component.html`:

```html
<div
  class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-primary-muted flex items-center justify-center px-4"
>
  <div class="w-full max-w-md">
    <div class="text-center mb-8">
      <a href="/">
        <img src="/logos/transparent_blue_logo.svg" alt="ATS Fit" style="height:36px;width:auto;">
      </a>
    </div>
    <div
      class="signin-card relative overflow-hidden rounded-lg bg-card text-card-foreground shadow-xl border-0"
      [attr.aria-busy]="isSubmitting() ? true : null"
    >
      @if (isSubmitting()) {
        <div class="signin-linear-progress" role="progressbar" aria-label="Signing in"></div>
      }

      @if (showRegistrationBanner()) {
        <div class="flex items-center gap-3 bg-green-50 border-b border-green-200 px-6 py-3 text-sm text-green-700" role="status" aria-live="polite">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Account created — sign in to continue.</span>
        </div>
      }

      <div class="flex flex-col space-y-1.5 p-6 text-center">
        <h3 class="tracking-tight text-2xl font-bold">Welcome Back</h3>
        <p class="text-sm text-muted-foreground">
          Sign in to your account to continue optimizing your resume
        </p>
      </div>
      <div class="p-6 pt-0 space-y-6">
        <form [formGroup]="signinForm" class="space-y-4" (ngSubmit)="login()">
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
                (click)="togglePasswordVisibility()"
                type="button"
                class="absolute right-3 top-10 transform cursor-pointer"
                [disabled]="isSubmitting()"
              >
                <mat-icon class="h-4 w-4 text-slate-400">{{ passwordFieldType() === InputType.PASSWORD ? 'visibility' : 'visibility_off' }}</mat-icon>
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

        <!-- Google auth — coming soon
        <div class="relative">
          <app-google-auth-button></app-google-auth-button>
        </div>
        -->

        <div class="text-center space-y-2">
          <p class="text-sm text-slate-600">
            Don't have an account?
            <a
              class="text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
              [routerLink]="'/signup'"
            >Sign up for free</a>
          </p>
          <p class="text-xs text-slate-500">
            <a [routerLink]="'/forgot-password'" class="hover:text-slate-700 cursor-pointer">Forgot your password?</a>
          </p>
        </div>
      </div>
    </div>
    <div class="text-center mt-6">
      <a
        class="text-sm text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
        href="/"
      >← Back to home</a>
    </div>
  </div>
</div>
```

---

## Self-Review

**Spec coverage check:**
- ✅ InlineAlertComponent created (Task 1)
- ✅ Auth guard silent redirect (Task 2)
- ✅ Signup: inline error + query-param redirect on success (Tasks 3–4)
- ✅ Signin: registration banner + inline login error (Tasks 5–6)
- ✅ Google auth buttons commented out in both templates (Tasks 4, 6)
- ✅ Onboarding upload error toast untouched (not in scope)
- ✅ SnackbarService removed from signup, signin, auth guard

**Placeholder scan:** None found.

**Type consistency:**
- `InlineAlertComponent` uses `message = input<string | null>(null)` — consumed as `[message]="errorMessage()"` in all templates ✅
- `type` input defaults to `'error'` — all error usages omit it (correct default) ✅
- `showRegistrationBanner` signal set/cleared only in `signin.component.ts` ✅
- `_bannerTimer` cleaned up in `ngOnDestroy` ✅
