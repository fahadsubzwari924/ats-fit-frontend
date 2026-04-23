import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FeatureUsage } from '@core/models/user/feature-usage.model';
import {
  featureUsageConsumedPercent,
  getFeatureUsageBarColor,
  getFeatureUsageLabel,
} from '@shared/usage/feature-usage-display';

interface UsageRow {
  label: string;
  used: number;
  total: number;
  color: string;
}

@Component({
  selector: 'app-dashboard-usage-card',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './dashboard-usage-card.component.html',
  styleUrl: './dashboard-usage-card.component.scss',
})
export class DashboardUsageCardComponent {
  featureUsages = input<FeatureUsage[]>([]);

  get usageRows(): UsageRow[] {
    return (this.featureUsages() ?? []).map((f, i) => ({
      label: getFeatureUsageLabel(f.feature),
      used: f.used ?? 0,
      total: f.allowed ?? 0,
      color: getFeatureUsageBarColor(f.feature, i),
    }));
  }

  get resetDate(): string | null {
    const first = this.featureUsages()?.[0];
    return first?.resetDate ?? null;
  }

  usedPercent(row: UsageRow): number {
    return featureUsageConsumedPercent(row.used, row.total);
  }
}
