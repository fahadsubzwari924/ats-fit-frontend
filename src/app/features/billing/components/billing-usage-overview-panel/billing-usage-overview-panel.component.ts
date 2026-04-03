import { Component, input } from '@angular/core';

export interface BillingUsageRow {
  label: string;
  used: number;
  total: number;
  color: string;
}

@Component({
  selector: 'app-billing-usage-overview-panel',
  templateUrl: './billing-usage-overview-panel.component.html',
})
export class BillingUsageOverviewPanelComponent {
  usages = input<BillingUsageRow[]>([]);
  resetLabel = input<string>('');
  totalSpent = input<string>('$0');
  totalSpentSub = input<string>('all time');
  activeSinceValue = input<string>('—');
  activeSinceSub = input<string>('');

  pct(used: number, total: number): number {
    if (!total) return 0;
    return Math.min(100, Math.round((used / total) * 1000) / 10);
  }
}
