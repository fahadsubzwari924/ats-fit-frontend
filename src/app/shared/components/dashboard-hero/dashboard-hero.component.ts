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
   * Tailored-resume quota (RESUME_GENERATION). Single + batch share this
   * pool, so we surface one number for "how many resumes I can still
   * tailor this month".
   */
  readonly tailoredResumesQuota = this.quotaState.quotaFor(
    FeatureType.RESUME_GENERATION,
  );

  /**
   * Job-fit-scoring quota (JOB_RELEVANCE_SCORE). Shared between standalone
   * fit-check previews and the orchestrator-internal call inside tailoring.
   * Cache hits don't burn quota. When exhausted, tailoring still works but
   * skips the Job Fit step in the modal.
   */
  readonly jobFitQuota = this.quotaState.quotaFor(
    FeatureType.JOB_RELEVANCE_SCORE,
  );

  readonly quotaStatus = computed(() => {
    const tailorStatus = this.tailoredResumesQuota()?.status ?? 'healthy';
    const fitStatus = this.jobFitQuota()?.status ?? 'healthy';
    if (tailorStatus === 'exhausted' || fitStatus === 'exhausted') return 'exhausted';
    if (tailorStatus === 'approaching' || fitStatus === 'approaching') return 'approaching';
    return 'healthy';
  });
}
