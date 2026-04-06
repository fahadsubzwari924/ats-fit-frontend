import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FeatureUsage } from '@core/models/user/feature-usage.model';

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

  private readonly colorMap: Record<string, string> = {
    resume_generation: '#7C3AED',
  };

  private readonly labelMap: Record<string, string> = {
    resume_generation: 'Resume Generations',
  };

  get usageRows(): UsageRow[] {
    return (this.featureUsages() ?? []).map((f) => ({
      label: this.labelMap[f.feature] ?? f.feature,
      used: f.used ?? 0,
      total: f.allowed ?? 0,
      color: this.colorMap[f.feature] ?? '#2563EB',
    }));
  }

  get resetDate(): string | null {
    const first = this.featureUsages()?.[0];
    return first?.resetDate ?? null;
  }

  remainingPercent(row: UsageRow): number {
    if (!row.total) return 0;
    return ((row.total - row.used) / row.total) * 100;
  }
}
