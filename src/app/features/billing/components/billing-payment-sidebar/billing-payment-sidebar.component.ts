import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-billing-payment-sidebar',
  templateUrl: './billing-payment-sidebar.component.html',
})
export class BillingPaymentSidebarComponent {
  renewalDateLabel = input<string>('');
  defaultCardLast4 = input<string>('4242');
  nextChargeAmount = input<string>('$19.00');

  cancelAutoRenewal = output<void>();
}
