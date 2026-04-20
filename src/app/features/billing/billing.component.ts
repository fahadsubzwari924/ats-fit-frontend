import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { BillingTab } from './enums/tab.enum';
import { OverviewTabComponent } from './components/overview-tab/overview-tab.component';
import { HistoryTabComponent } from './components/history-tab/history-tab.component';
import { BillingPageHeaderComponent } from './components/billing-page-header/billing-page-header.component';
import { UserState } from '@core/states/user.state';
import { PLAN_LABELS } from '@features/billing/constants/billing-overview.constants';
import { UserApiService } from '@shared/services/user-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';

@Component({
  selector: 'app-billing',
  imports: [
    BillingPageHeaderComponent,
    OverviewTabComponent,
    HistoryTabComponent,
  ],
  templateUrl: './billing.component.html',
  styleUrl: './billing.component.scss',
})
export class BillingComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  readonly userState = inject(UserState);
  private userApiService = inject(UserApiService);
  private snackbar = inject(SnackbarService);
  private destroyRef = inject(DestroyRef);

  readonly BillingTab = BillingTab;

  readonly activeTab = signal<BillingTab>(BillingTab.OVERVIEW);

  readonly planHeadline = computed(() => {
    const u = this.userState.currentUser();
    if (!u) return '—';
    if (u.isPremium) return PLAN_LABELS.PREMIUM;
    return PLAN_LABELS.FREE;
  });

  readonly renewalHeadline = computed(() => {
    const reset = this.userState.currentUser()?.featureUsage?.[0]?.resetDate;
    if (!reset) return '—';
    return new Date(reset).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  });

  ngOnInit(): void {
    const raw = this.route.snapshot.queryParamMap.get('tab');
    if (raw === BillingTab.HISTORY || raw === BillingTab.OVERVIEW) {
      this.activeTab.set(raw as BillingTab);
    }
    const paymentStatus = this.route.snapshot.queryParamMap.get('payment');
    if (paymentStatus === 'success') {
      this.refreshUserAfterCheckout();
    }
  }

  private refreshUserAfterCheckout(): void {
    this.userApiService.getCurrentUser().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (user) => {
        this.userState.setUser(user);
        this.snackbar.showSuccess('Subscription activated! Welcome to Premium.');
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { payment: null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      },
      error: () => {
        this.snackbar.showInfo('Payment received. Your plan will update shortly.');
      },
    });
  }

  setActiveTab(tab: BillingTab): void {
    this.activeTab.set(tab);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tab === BillingTab.OVERVIEW ? null : tab },
      queryParamsHandling: 'merge',
    });
  }
}
