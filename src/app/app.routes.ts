import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { onboardingGuard } from '@core/guards/onboarding.guard';
import { publicGuard } from '@core/guards/public.guard';
import { LayoutComponent } from '@root/layout/layout.component';

export const routes: Routes = [
  // Public routes (no auth required)
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('@root/landing/landing.component').then(m => m.LandingComponent)
      }
    ]
  },

  // Protected routes (auth required)
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard, onboardingGuard],
    children: [
      {
        path: 'dashboard',
        canActivate: [authGuard],

        loadComponent: () => import('@features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'billing',
        canActivate: [authGuard],
        loadComponent: () => import('@features/billing/billing.component').then(m => m.BillingComponent)
      }
    ]
  },
  {
    path: 'onboarding',
    canActivate: [authGuard],
    loadComponent: () => import('@features/onboarding/onboarding.component').then(m => m.OnboardingComponent)
  },
  // Auth pages (only accessible when not logged in)
  {
    path: 'signin',
    canActivate: [publicGuard],
    loadComponent: () => import('@features/authentication/components/signin/signin.component').then(m => m.SigninComponent)
  },
  {
    path: 'signup',
    canActivate: [publicGuard],
    loadComponent: () => import('@features/authentication/components/signup/signup.component').then(m => m.SignupComponent)
  },
  { path: '**', redirectTo: '' }
];
