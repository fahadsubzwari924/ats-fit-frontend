import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { BillingNavigationService } from '@shared/services/billing-navigation.service';
import { UpgradePromptCopy } from '@core/constants/upgrade-prompt-copy';

@Component({
  selector: 'app-dashboard-post-tailor-upgrade-banner',
  standalone: true,
  templateUrl: './dashboard-post-tailor-upgrade-banner.component.html',
  styleUrl: './dashboard-post-tailor-upgrade-banner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPostTailorUpgradeBannerComponent {
  private readonly billingNav = inject(BillingNavigationService);

  readonly dismissed = output<void>();
  readonly copy = UpgradePromptCopy;

  onDismiss(): void {
    this.dismissed.emit();
  }

  onViewPlans(): void {
    this.billingNav.goToPlansSection();
  }
}
