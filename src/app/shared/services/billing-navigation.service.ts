import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AppRoutes } from '@core/constants/app-routes.contant';

const BILLING_PLANS_ELEMENT_ID = 'billing-plans';
const SCROLL_RETRY_MS = 150;

/**
 * Single entry point for navigating to billing and the plan comparison section.
 */
@Injectable({ providedIn: 'root' })
export class BillingNavigationService {
  private readonly router = inject(Router);

  goToBillingOverview(): void {
    void this.router.navigate([AppRoutes.BILLING], {
      queryParams: { tab: 'overview' },
    });
  }

  goToPlansSection(): void {
    void this.router
      .navigate([AppRoutes.BILLING], {
        queryParams: { tab: 'overview' },
        fragment: BILLING_PLANS_ELEMENT_ID,
      })
      .then(() => this.scrollPlansIntoView());
  }

  private scrollPlansIntoView(): void {
    const scroll = (): void => {
      document.getElementById(BILLING_PLANS_ELEMENT_ID)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    };
    queueMicrotask(scroll);
    setTimeout(scroll, SCROLL_RETRY_MS);
  }
}
