import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { Signal } from '@angular/core';
import { BatchJobCardComponent } from '../batch-job-card/batch-job-card.component';
import type { BatchTailoringV2State } from '../../state/batch-tailoring-v2.state';
import type { BatchJobLiveState } from '../../models/batch-tailoring-v2.model';
import type { BatchConnectionStatus } from '../../services/batch-tailoring-events-v2.service';

@Component({
  selector: 'app-batch-processing-view',
  standalone: true,
  imports: [BatchJobCardComponent],
  templateUrl: './batch-processing-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BatchProcessingViewComponent {
  readonly state = input.required<BatchTailoringV2State>();
  readonly connectionStatus = input.required<Signal<BatchConnectionStatus>>();
  /**
   * Set of job UUIDs currently being retried. Threaded down from the modal so
   * the spinner state on each card stays in sync with the parent's request
   * lifecycle (the parent owns the writable signal).
   */
  readonly retryingJobIds = input<ReadonlySet<string>>(new Set());

  readonly download = output<BatchJobLiveState>();
  readonly seeChanges = output<BatchJobLiveState>();
  readonly retry = output<BatchJobLiveState>();

  readonly etaSeconds = computed(() => {
    const snap = this.state().snapshot();
    if (!snap) return 0;
    const remaining = snap.jobs.filter(
      (j) => j.state === 'queued' || j.state === 'analyzing' ||
             j.state === 'optimizing' || j.state === 'finalizing',
    ).length;
    return remaining * 15;
  });
}
