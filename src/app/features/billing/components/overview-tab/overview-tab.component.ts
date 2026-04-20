import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BillingService } from '@features/billing/services/billing.service';
import { SubscriptionPlan } from '@features/billing/models/subscription-plan.model';
import { UserState } from '@core/states/user.state';
import { ResumeService } from '@shared/services/resume.service';
import { FeatureUsage } from '@core/models/user/feature-usage.model';
import { PaymentHistory } from '@features/billing/models/payment-history.model';
import { BillingCurrentPlanCardComponent } from '@features/billing/components/billing-current-plan-card/billing-current-plan-card.component';
import {
  BillingUsageOverviewPanelComponent,
  BillingUsageRow,
} from '@features/billing/components/billing-usage-overview-panel/billing-usage-overview-panel.component';
import { BillingPlanOfferCardComponent } from '@features/billing/components/billing-plan-offer-card/billing-plan-offer-card.component';
import {
  PLAN_NAME_FRAGMENTS,
  PLAN_ACCENT_COLORS,
  PRO_PLAN_DEFAULTS,
  BILLING_PERIOD,
} from '@features/billing/constants/billing-overview.constants';
import { PlanFeature } from '@shared/types/plan-feature.type';
import { CancelSubscriptionDialogComponent } from '../cancel-subscription-dialog/cancel-subscription-dialog.component';
import { SnackbarService } from '@shared/services/snackbar.service';
import { UserApiService } from '@shared/services/user-api.service';

const USAGE_BAR_COLORS = ['#2563EB', '#7C3AED', '#0891B2'];

@Component({
  selector: 'app-overview-tab',
  imports: [
    BillingCurrentPlanCardComponent,
    BillingUsageOverviewPanelComponent,
    BillingPlanOfferCardComponent,
    MatDialogModule,
  ],
  templateUrl: './overview-tab.component.html',
  styleUrl: './overview-tab.component.scss',
})
export class OverviewTabComponent implements OnInit {
  private billingService = inject(BillingService);
  private resumeService = inject(ResumeService);
  private dialog = inject(MatDialog);
  private snackbar = inject(SnackbarService);
  private userApiService = inject(UserApiService);
  readonly userState = inject(UserState);
  private destroyRef = inject(DestroyRef);

  subscriptionPlan = signal<SubscriptionPlan[]>([]);
  userSubscribedPlan = signal<SubscriptionPlan | null>(null);
  featureUsage = signal<FeatureUsage[]>([]);
  paymentHistory = signal<PaymentHistory[] | null>(null);

  ngOnInit(): void {
    const userId = this.userState.currentUser()?.id;
    this.initializeContent(userId);
  }

  private initializeContent(userId: string | undefined): void {
    forkJoin({
      plans: this.billingService.getSubscriptionPlans(),
      feature: this.resumeService.getFeatureUsage().pipe(catchError(() => of([] as FeatureUsage[]))),
      payments: this.billingService.getUserPaymentHistory().pipe(catchError(() => of(null))),
      subscribed: userId
        ? this.billingService.getUserSubscription(userId).pipe(catchError(() => of(null)))
        : of(null),
    }).subscribe(({ plans, feature, payments, subscribed }) => {
      this.subscriptionPlan.set(plans?.length ? plans : []);
      this.featureUsage.set(feature?.length ? feature : []);
      this.paymentHistory.set(payments);
      this.userSubscribedPlan.set(subscribed);
    });
  }

  usageRows(): BillingUsageRow[] {
    return this.featureUsage().map((u, i) => ({
      label: this.formatFeatureLabel(u.feature),
      used: u.used ?? 0,
      total: u.allowed ?? 0,
      color: USAGE_BAR_COLORS[i % USAGE_BAR_COLORS.length],
    }));
  }

  resetLabel(): string {
    const d = this.featureUsage()[0]?.resetDate;
    return d ? `Resets ${this.mediumDate(d)}` : '';
  }

  totalSpentFormatted(): string {
    const items = this.paymentHistory() || [];
    const sum = items.reduce((s, i) => {
      const n = parseFloat(String(i.amount ?? '').replace(/[^0-9.]/g, ''));
      return s + (Number.isFinite(n) ? n : 0);
    }, 0);
    return `$${Math.round(sum)}`;
  }

  activeSince(): { value: string; sub: string } {
    const created = this.userState.currentUser()?.createdAt;
    if (!created) return { value: '—', sub: '' };
    const start = new Date(created);
    const months = Math.max(
      1,
      Math.round((Date.now() - start.getTime()) / (30.44 * 24 * 60 * 60 * 1000)),
    );
    return {
      value: start.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      sub: `${months} months`,
    };
  }

  currentPlanLabel(): string {
    const sub = this.userSubscribedPlan();
    if (sub?.planName) return sub.planName;
    const u = this.userState.currentUser();
    if (u?.isPremium) return PRO_PLAN_DEFAULTS.LABEL;
    return PLAN_NAME_FRAGMENTS.FREE;
  }

  priceMain(): string {
    const sub = this.userSubscribedPlan();
    const p = sub?.price?.trim();
    if (p) return p.startsWith('$') ? p.replace(/\/.*$/, '').trim() : `$${p}`;
    if (this.userState.currentUser()?.isPremium) return PRO_PLAN_DEFAULTS.PRICE_MAIN;
    return '$0';
  }

  pricePeriod(): string {
    const c = this.userSubscribedPlan()?.billingCycle;
    if (c === BILLING_PERIOD.YEARLY) return '/yr';
    if (c === BILLING_PERIOD.WEEKLY) return '/wk';
    return '/mo';
  }

  renewSummary(): string {
    const reset = this.featureUsage()[0]?.resetDate;
    const tail = reset ? ` · Renews ${this.mediumDate(reset)}` : '';
    const cycle = this.userSubscribedPlan()?.billingCycle === BILLING_PERIOD.YEARLY
      ? BILLING_PERIOD.YEARLY
      : BILLING_PERIOD.MONTHLY;
    return `Billed ${cycle}${tail}`;
  }

  daysRemainingLabel(): string | null {
    const usage = this.featureUsage()[0];
    if (!usage?.resetDate) return null;
    const days = usage.daysRemaining ?? 0;
    if (days < 0) return null;
    return `${days} days remaining`;
  }

  renewalProgressPct(): number {
    const usage = this.featureUsage()[0];
    if (!usage?.cycleStart || !usage?.resetDate) return 43;
    const start = new Date(usage.cycleStart).getTime();
    const end = new Date(usage.resetDate).getTime();
    if (end <= start) return 43;
    const p = ((Date.now() - start) / (end - start)) * 100;
    return Math.max(5, Math.min(100, Math.round(p)));
  }

  currentPlanFeatures(): PlanFeature[] {
    const sub = this.userSubscribedPlan();
    if (sub?.features?.length) return sub.features;
    const pro = this.subscriptionPlan().find(p =>
      p.planName?.toLowerCase().includes(PLAN_NAME_FRAGMENTS.PRO)
    );
    return pro?.features?.length ? pro.features : [];
  }

  autoRenewNote(): string {
    const reset = this.featureUsage()[0]?.resetDate;
    return reset ? `Auto-renews on ${this.mediumDate(reset)}` : 'Auto-renewal';
  }

  nextChargeAmount(): string {
    const sub = this.userSubscribedPlan();
    const p = sub?.price?.trim();
    if (p) return p.startsWith('$') ? p : `$${p}`;
    return this.userState.currentUser()?.isPremium ? PRO_PLAN_DEFAULTS.NEXT_CHARGE : '';
  }

  planAccent(plan: SubscriptionPlan): string {
    const n = (plan.planName ?? '').toLowerCase();
    if (n.includes(PLAN_NAME_FRAGMENTS.PRO)) return PLAN_ACCENT_COLORS.PRO;
    return PLAN_ACCENT_COLORS.DEFAULT;
  }

  isCurrentPlan(plan: SubscriptionPlan): boolean {
    const sub = this.userSubscribedPlan();
    if (sub?.id) return sub.id === plan.id;
    const free = plan.planName?.toLowerCase().includes(PLAN_NAME_FRAGMENTS.FREE);
    const u = this.userState.currentUser();
    if (free && u?.isFreemium && !u?.isPremium) return true;
    return false;
  }

  onPlanButtonClick(plan: SubscriptionPlan): void {
    this.billingService.checkout(this.createCheckoutPayload(plan.id)).subscribe({
      next: response => {
        if (response?.status && response?.data?.checkoutUrl) {
          window.location.href = response.data.checkoutUrl as string;
        } else {
          this.snackbar.showError('Could not start checkout. Please try again.');
        }
      },
      error: () => {
        this.snackbar.showError('Checkout failed. Please try again or contact support.');
      },
    });
  }

  onCancelPlan(): void {
    const subscriptionId = this.userSubscribedPlan()?.id;
    if (!subscriptionId) return;

    const ref = this.dialog.open(CancelSubscriptionDialogComponent, { width: '420px' });

    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      this.billingService.cancelSubscription(subscriptionId).pipe(
        switchMap(() => this.userApiService.getCurrentUser()),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe({
        next: (user) => {
          this.userState.setUser(user);
          this.userSubscribedPlan.set(null);
          this.snackbar.showSuccess("Subscription cancelled. You'll retain access until the period ends.");
        },
        error: () => {
          this.snackbar.showError('Failed to cancel subscription. Please contact support.');
        },
      });
    });
  }

  scrollToPlans(): void {
    document.getElementById('billing-plans')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private createCheckoutPayload(planId: string) {
    return {
      plan_id: planId,
      metadata: { email: this.userState.currentUser()?.email },
    };
  }

  private formatFeatureLabel(key: string): string {
    if (!key) return 'Usage';
    const k = key.toLowerCase().replace(/_/g, ' ');
    return k.replace(/\b\w/g, c => c.toUpperCase());
  }

  private mediumDate(value: string): string {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
