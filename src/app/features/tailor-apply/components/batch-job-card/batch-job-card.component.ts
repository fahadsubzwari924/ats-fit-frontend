import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { BatchJobLiveState } from '../../models/batch-tailoring-v2.model';

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
}
