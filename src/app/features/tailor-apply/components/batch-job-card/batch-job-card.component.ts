import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { BatchJobLiveState } from '../../models/batch-tailoring-v2.model';
import type { StatusColor } from '@shared/types/match-score-block.model';

@Component({
  selector: 'app-batch-job-card',
  standalone: true,
  imports: [],
  templateUrl: './batch-job-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BatchJobCardComponent {
  readonly job = input.required<BatchJobLiveState>();
  readonly download = output<BatchJobLiveState>();
  readonly seeChanges = output<BatchJobLiveState>();
  readonly retry = output<BatchJobLiveState>();

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
