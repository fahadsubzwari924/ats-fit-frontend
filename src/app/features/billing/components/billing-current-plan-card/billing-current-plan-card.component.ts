import { Component, input, output } from '@angular/core';
import { PRO_PLAN_DEFAULTS } from '@features/billing/constants/billing-overview.constants';
import { isPlanFeatureGroup, PlanFeature } from '@shared/types/plan-feature.type';

@Component({
  selector: 'app-billing-current-plan-card',
  templateUrl: './billing-current-plan-card.component.html',
})
export class BillingCurrentPlanCardComponent {
  readonly isPlanFeatureGroup = isPlanFeatureGroup;
  planLabel = input<string>(PRO_PLAN_DEFAULTS.LABEL);
  showPremiumSkin = input(true);
  priceMain = input<string>(PRO_PLAN_DEFAULTS.PRICE_MAIN);
  pricePeriod = input<string>('/mo');
  renewSummary = input<string>('Billed monthly');
  daysRemainingLabel = input<string | null>(null);
  renewalProgressPct = input<number>(43);
  features = input<PlanFeature[]>([]);
  autoRenewNote = input<string>('');
  nextChargeAmount = input<string>('');

  changePlan = output<void>();
  cancelPlan = output<void>();
}
