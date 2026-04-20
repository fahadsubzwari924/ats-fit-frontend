import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BillingTab } from '@features/billing/enums/tab.enum';
import { PLAN_LABELS } from '@features/billing/constants/billing-overview.constants';

@Component({
  selector: 'app-billing-page-header',
  imports: [RouterLink],
  templateUrl: './billing-page-header.component.html',
})
export class BillingPageHeaderComponent {
  activeTab = input.required<BillingTab>();
  currentPlanLabel = input<string>(PLAN_LABELS.FREE);
  nextRenewalLabel = input<string>('—');

  tabChange = output<BillingTab>();

  readonly tabs: { id: BillingTab; label: string }[] = [
    { id: BillingTab.OVERVIEW, label: 'Overview' },
    { id: BillingTab.HISTORY, label: 'History' },
  ];

  selectTab(tab: BillingTab): void {
    this.tabChange.emit(tab);
  }
}
