import { Routes } from '@angular/router';
import { applicationsAccessGuard } from '@core/guards/applications-access.guard';
import { authGuard } from '@core/guards/auth.guard';
import { onboardingGuard } from '@core/guards/onboarding.guard';
import { publicGuard } from '@core/guards/public.guard';
import { LayoutComponent } from '@root/layout/layout.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

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
        path: 'applications',
        canActivate: [applicationsAccessGuard],
        loadComponent: () =>
          import('@features/applications/applications-page.component').then(m => m.ApplicationsPageComponent),
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
  { path: '**', redirectTo: 'dashboard' },
];
