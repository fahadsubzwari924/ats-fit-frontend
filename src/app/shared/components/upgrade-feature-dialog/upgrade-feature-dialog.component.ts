import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { BillingNavigationService } from '@shared/services/billing-navigation.service';
import { UpgradePromptCopy } from '@core/constants/upgrade-prompt-copy';

@Component({
  selector: 'app-upgrade-feature-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './upgrade-feature-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpgradeFeatureDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<UpgradeFeatureDialogComponent>);
  private readonly billingNav = inject(BillingNavigationService);

  readonly copy = UpgradePromptCopy;

  dismiss(): void {
    this.dialogRef.close(false);
  }

  viewPlans(): void {
    this.dialogRef.close(true);
    this.billingNav.goToPlansSection();
  }
}
