import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BillingTab } from './enums/tab.enum';
import { OverviewTabComponent } from './components/overview-tab/overview-tab.component';
import { PaymentTabComponent } from './components/payment-tab/payment-tab.component';
import { HistoryTabComponent } from './components/history-tab/history-tab.component';
import { BillingPageHeaderComponent } from './components/billing-page-header/billing-page-header.component';
import { UserState } from '@core/states/user.state';

@Component({
  selector: 'app-billing',
  imports: [
    BillingPageHeaderComponent,
    OverviewTabComponent,
    PaymentTabComponent,
    HistoryTabComponent,
  ],
  templateUrl: './billing.component.html',
  styleUrl: './billing.component.scss',
})
export class BillingComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  readonly userState = inject(UserState);

  readonly BillingTab = BillingTab;

  readonly activeTab = signal<BillingTab>(BillingTab.OVERVIEW);

  readonly planHeadline = computed(() => {
    const u = this.userState.currentUser();
    if (!u) return '—';
    if (u.isPremium) return 'Premium';
    return 'Free';
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
    if (raw === BillingTab.PAYMENT || raw === BillingTab.HISTORY || raw === BillingTab.OVERVIEW) {
      this.activeTab.set(raw as BillingTab);
    }
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
