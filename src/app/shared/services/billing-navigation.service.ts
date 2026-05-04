import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AppRoutes } from '@core/constants/app-routes.contant';

const BILLING_PLANS_ELEMENT_ID = 'billing-plans';
const SCROLL_RETRY_MS = 150;

/**
 * Single entry point for navigating to billing and the plan comparison section.
 *
 * Both navigation methods close any open MatDialog instances before routing —
 * billing is a destination page, never a stop-on-top-of-modal action, so leaving
 * a modal hovering above /billing is always wrong UX.
 */
@Injectable({ providedIn: 'root' })
export class BillingNavigationService {
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  goToBillingOverview(): void {
    this.dialog.closeAll();
    void this.router.navigate([AppRoutes.BILLING], {
      queryParams: { tab: 'overview' },
    });
  }

  goToPlansSection(): void {
    this.dialog.closeAll();
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
