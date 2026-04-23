import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FeatureUsage } from '@core/models/user/feature-usage.model';
import {
  featureUsageConsumedPercent,
  getFeatureUsageBarColor,
  getFeatureUsageLabel,
} from '@shared/usage/feature-usage-display';
import { BillingNavigationService } from '@shared/services/billing-navigation.service';
import { UpgradePromptCopy } from '@core/constants/upgrade-prompt-copy';

interface UsageRow {
  label: string;
  used: number;
  total: number;
  color: string;
}

const USAGE_WARN_RATIO = 0.7;

@Component({
  selector: 'app-dashboard-usage-card',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './dashboard-usage-card.component.html',
  styleUrl: './dashboard-usage-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardUsageCardComponent {
  private readonly billingNav = inject(BillingNavigationService);

  featureUsages = input<FeatureUsage[]>([]);
  /** When true, upgrade CTAs and limit nudges are hidden. */
  isPremium = input(false);

  readonly copy = UpgradePromptCopy;

  readonly usageRows = computed((): UsageRow[] =>
    (this.featureUsages() ?? []).map((f, i) => ({
      label: getFeatureUsageLabel(f.feature),
      used: f.used ?? 0,
      total: f.allowed ?? 0,
      color: getFeatureUsageBarColor(f.feature, i),
    })),
  );

  readonly resetDate = computed((): string | null => {
    const first = this.featureUsages()?.[0];
    return first?.resetDate ?? null;
  });

  /** Highest consumption ratio among rows with a positive allowance. */
  readonly maxConsumptionRatio = computed((): number => {
    let max = 0;
    for (const row of this.usageRows()) {
      if (row.total > 0) {
        max = Math.max(max, row.used / row.total);
      }
    }
    return max;
  });

  readonly hasAnyLimitReached = computed(() =>
    this.usageRows().some((row) => row.total > 0 && row.used >= row.total),
  );

  readonly showUsageUpgradeNudge = computed(
    () => !this.isPremium() && this.maxConsumptionRatio() >= USAGE_WARN_RATIO,
  );

  readonly usageNudgeMessage = computed(() =>
    this.hasAnyLimitReached() ? this.copy.usageAtLimit : this.copy.usageNearLimit,
  );

  usedPercent(row: UsageRow): number {
    return featureUsageConsumedPercent(row.used, row.total);
  }

  onUpgradeClick(): void {
    this.billingNav.goToPlansSection();
  }

  onPlansTeaserClick(): void {
    this.billingNav.goToPlansSection();
  }
}
