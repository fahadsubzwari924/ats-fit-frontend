import { Component, input, output } from '@angular/core';
import { SubscriptionPlan } from '@features/billing/models/subscription-plan.model';

@Component({
  selector: 'app-billing-plan-offer-card',
  templateUrl: './billing-plan-offer-card.component.html',
})
export class BillingPlanOfferCardComponent {
  plan = input.required<SubscriptionPlan>();
  isCurrent = input(false);

  accentColor = input<string>('#64748B');

  selectPlan = output<SubscriptionPlan>();

  periodSuffix(): string {
    if (this.isFreeTier()) return ' forever';
    const c = this.plan().billingCycle;
    if (c === 'yearly') return '/ year';
    if (c === 'weekly') return '/ week';
    return '/ month';
  }

  isFreeTier(): boolean {
    const n = (this.plan().planName || '').toLowerCase();
    return n.includes('free');
  }

  buttonLabel(): string {
    if (this.isFreeTier()) return 'Downgrade';
    return 'Upgrade';
  }

  onClick(): void {
    if (!this.isCurrent()) {
      this.selectPlan.emit(this.plan());
    }
  }

  displayPrice(): string {
    const p = (this.plan().price || '0').trim();
    return p.startsWith('$') ? p : `$${p}`;
  }
}
