import { Component, input, output } from '@angular/core';
import { PRO_PLAN_DEFAULTS } from '@features/billing/constants/billing-overview.constants';

@Component({
  selector: 'app-billing-payment-sidebar',
  templateUrl: './billing-payment-sidebar.component.html',
})
export class BillingPaymentSidebarComponent {
  renewalDateLabel = input<string>('');
  defaultCardLast4 = input<string>('4242');
  nextChargeAmount = input<string>(PRO_PLAN_DEFAULTS.NEXT_CHARGE);

  cancelAutoRenewal = output<void>();
}
