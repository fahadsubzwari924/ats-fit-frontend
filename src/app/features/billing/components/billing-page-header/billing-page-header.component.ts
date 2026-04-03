import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BillingTab } from '@features/billing/enums/tab.enum';

@Component({
  selector: 'app-billing-page-header',
  imports: [RouterLink],
  templateUrl: './billing-page-header.component.html',
})
export class BillingPageHeaderComponent {
  activeTab = input.required<BillingTab>();
  currentPlanLabel = input<string>('Free');
  nextRenewalLabel = input<string>('—');

  tabChange = output<BillingTab>();

  readonly tabs: { id: BillingTab; label: string }[] = [
    { id: BillingTab.OVERVIEW, label: 'Overview' },
    { id: BillingTab.PAYMENT, label: 'Payment' },
    { id: BillingTab.HISTORY, label: 'History' },
  ];

  selectTab(tab: BillingTab): void {
    this.tabChange.emit(tab);
  }
}
