import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-billing-history-sidebar',
  imports: [RouterLink],
  templateUrl: './billing-history-sidebar.component.html',
})
export class BillingHistorySidebarComponent {
  cardBrand = input<string>('Visa');
  cardLast4 = input<string>('4242');
  cardExpiry = input<string>('12/25');
  planLabel = input<string>('Premium Monthly');
  amountLabel = input<string>('$19.00/mo');
  nextCharge = input<string>('');
  renewalDateLabel = input<string>('');
}
