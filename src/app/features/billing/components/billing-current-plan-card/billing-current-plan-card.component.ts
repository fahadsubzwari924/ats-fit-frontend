import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-billing-current-plan-card',
  templateUrl: './billing-current-plan-card.component.html',
})
export class BillingCurrentPlanCardComponent {
  planLabel = input<string>('Premium');
  /** When false, show a neutral plan chip (non-premium accounts). */
  showPremiumSkin = input(true);
  priceMain = input<string>('$19');
  pricePeriod = input<string>('/mo');
  renewSummary = input<string>('Billed monthly');
  daysRemainingLabel = input<string | null>(null);
  renewalProgressPct = input<number>(43);
  features = input<string[]>([]);
  autoRenewNote = input<string>('');
  nextChargeAmount = input<string>('');

  upgradeEnterprise = output<void>();
  changePlan = output<void>();
  cancelPlan = output<void>();
}
