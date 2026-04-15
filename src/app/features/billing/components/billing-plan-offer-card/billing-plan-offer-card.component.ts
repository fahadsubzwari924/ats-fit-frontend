import { Component, input, output } from '@angular/core';
import { SubscriptionPlan } from '@features/billing/models/subscription-plan.model';
import { BILLING_PERIOD } from '@features/billing/constants/billing-overview.constants';
import { isPlanFeatureGroup } from '@shared/types/plan-feature.type';

@Component({
  selector: 'app-billing-plan-offer-card',
  templateUrl: './billing-plan-offer-card.component.html',
  styleUrl: './billing-plan-offer-card.component.scss',
})
export class BillingPlanOfferCardComponent {
  readonly isPlanFeatureGroup = isPlanFeatureGroup;

  plan = input.required<SubscriptionPlan>();
  isCurrent = input(false);

  selectPlan = output<SubscriptionPlan>();

  /** Annual plans are highlighted as "Best Value" — same visual treatment as "Most Popular" on the landing page. */
  isBestValue(): boolean {
    return this.plan().billingCycle === BILLING_PERIOD.YEARLY;
  }

  isFreeTier(): boolean {
    return (this.plan().planName ?? '').toLowerCase().includes('free');
  }

  periodSuffix(): string {
    if (this.isFreeTier()) return ' forever';
    const c = this.plan().billingCycle;
    if (c === BILLING_PERIOD.YEARLY) return '/ year';
    if (c === BILLING_PERIOD.WEEKLY) return '/ week';
    return '/ month';
  }

  buttonLabel(): string {
    return this.isFreeTier() ? 'Downgrade' : 'Upgrade';
  }

  onClick(): void {
    if (!this.isCurrent()) {
      this.selectPlan.emit(this.plan());
    }
  }

  displayPrice(): string {
    const p = (this.plan().price ?? '0').trim();
    return p.startsWith('$') ? p : `$${p}`;
  }
}
