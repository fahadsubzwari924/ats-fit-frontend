import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FeatureType } from '@core/enums/feature-type.enum';
import { QuotaState } from '@core/states/quota.state';

@Component({
  selector: 'app-dashboard-hero',
  standalone: true,
  imports: [DatePipe, MatTooltipModule],
  templateUrl: './dashboard-hero.component.html',
  styleUrl: './dashboard-hero.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardHeroComponent {
  private readonly quotaState = inject(QuotaState);

  userName = input<string | null | undefined>(undefined);
  resumeCount = input<number>(0);
  /** When true, disables Tailor + Quick Tailor entry buttons (e.g. resume replacement processing). */
  tailoringDisabled = input<boolean>(false);
  tailoringDisabledReason = input<string>('');

  tailorClicked = output<void>();
  quickTailorClicked = output<void>();
  resumeHistoryClicked = output<void>();

  readonly displayName = computed(() => this.userName() || 'User');

  /**
   * Single primary quota stat for the hero: tailored resumes per month.
   * Single tailoring + every resume produced in a batch share this same pool,
   * so we surface ONE clear number instead of duplicating it per action card.
   * Returns null when usage hasn't loaded yet (hides the strip until ready).
   */
  readonly tailoredResumesQuota = this.quotaState.quotaFor(
    FeatureType.RESUME_GENERATION,
  );

  readonly quotaStatus = computed(() => this.tailoredResumesQuota()?.status ?? 'healthy');
}
