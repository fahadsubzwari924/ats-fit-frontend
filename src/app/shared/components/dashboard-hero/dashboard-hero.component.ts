import { Component, computed, input, output } from '@angular/core';
import { QuotaTileBadgeComponent } from '@shared/components/quota-tile-badge/quota-tile-badge.component';
import { FeatureType } from '@core/enums/feature-type.enum';

@Component({
  selector: 'app-dashboard-hero',
  standalone: true,
  imports: [QuotaTileBadgeComponent],
  templateUrl: './dashboard-hero.component.html',
  styleUrl: './dashboard-hero.component.scss',
})
export class DashboardHeroComponent {
  userName = input<string | null | undefined>(undefined);
  resumeCount = input<number>(0);

  tailorClicked = output<void>();
  quickTailorClicked = output<void>();
  resumeHistoryClicked = output<void>();

  readonly displayName = computed(() => this.userName() || 'User');

  protected readonly TAILOR_FEATURE = FeatureType.RESUME_GENERATION;
  protected readonly BATCH_FEATURE = FeatureType.RESUME_BATCH_GENERATION;
}
