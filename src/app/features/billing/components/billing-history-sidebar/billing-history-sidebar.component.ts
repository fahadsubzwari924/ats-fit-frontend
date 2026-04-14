import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PRO_PLAN_DEFAULTS } from '@features/billing/constants/billing-overview.constants';

@Component({
  selector: 'app-billing-history-sidebar',
  imports: [RouterLink],
  templateUrl: './billing-history-sidebar.component.html',
})
export class BillingHistorySidebarComponent {
  cardBrand = input<string>('Visa');
  cardLast4 = input<string>('4242');
  cardExpiry = input<string>('12/25');
  planLabel = input<string>('');
  amountLabel = input<string>(PRO_PLAN_DEFAULTS.NEXT_CHARGE_WITH_PERIOD);
  nextCharge = input<string>('');
  renewalDateLabel = input<string>('');
}
