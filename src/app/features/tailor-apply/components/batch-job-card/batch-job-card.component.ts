import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { BatchJobLiveState } from '../../models/batch-tailoring-v2.model';
import type { StatusColor } from '@shared/types/match-score-block.model';

/** Manual-retry hard cap (mirrors `MAX_MANUAL_RETRIES` on the BE). */
const MAX_MANUAL_RETRIES = 2;

@Component({
  selector: 'app-batch-job-card',
  standalone: true,
  imports: [],
  templateUrl: './batch-job-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BatchJobCardComponent {
  readonly job = input.required<BatchJobLiveState>();
  /**
   * Set of job UUIDs currently being retried — owned by the parent so the
   * spinner state persists across re-renders. Passed in as a plain `Set` view
   * (parent wraps a `signal<Set<string>>`).
   */
  readonly retryingJobIds = input<ReadonlySet<string>>(new Set());
  readonly download = output<BatchJobLiveState>();
  readonly seeChanges = output<BatchJobLiveState>();
  readonly retry = output<BatchJobLiveState>();

  /**
   * Hard-cap reached — replaces the retry button with a muted "reached retry
   * limit" hint so the user gets a clear next step (start a new batch) without
   * mashing a no-op button.
   */
  readonly retryLimitReached = computed(
    () => (this.job().retryCount ?? 0) >= MAX_MANUAL_RETRIES,
  );

  /**
   * The retry button surfaces only when the BE-classified envelope marks the
   * row retryable AND the user hasn't already burned both manual retries.
   * Also requires `jobId` so we can wire the endpoint call — without an id
   * we can't target a specific row, so we silently omit the affordance.
   */
  readonly showRetryButton = computed(() => {
    const j = this.job();
    if (j.state !== 'failed') return false;
    if (!j.jobId) return false;
    if (!j.error?.retryable) return false;
    return !this.retryLimitReached();
  });

  readonly isRetryInFlight = computed(() => {
    const id = this.job().jobId;
    if (!id) return false;
    return this.retryingJobIds().has(id);
  });

  /**
   * Maps the backend-supplied semantic `statusColor` to the Tailwind palette
   * tokens already used elsewhere in the batch surfaces.
   */
  statusColorClass(color: StatusColor): string {
    const map: Record<StatusColor, string> = {
      success: 'text-success-strong',
      warning: 'text-amber-600',
      muted: 'text-slate-500',
    };
    return map[color];
  }
}
