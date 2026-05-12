import { Component, input } from '@angular/core';
import { PRO_PLAN_DEFAULTS } from '@features/billing/constants/billing-overview.constants';

@Component({
  selector: 'app-billing-history-sidebar',
  imports: [],
  templateUrl: './billing-history-sidebar.component.html',
})
export class BillingHistorySidebarComponent {
  planLabel = input<string>('');
  amountLabel = input<string>(PRO_PLAN_DEFAULTS.NEXT_CHARGE_WITH_PERIOD);
  nextCharge = input<string>('');
  renewalDateLabel = input<string>('');
}
