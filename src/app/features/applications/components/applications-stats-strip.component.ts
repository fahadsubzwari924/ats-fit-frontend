import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { JobApplicationStats } from '@features/dashboard/models/job-stats.model';

@Component({
  selector: 'app-applications-stats-strip',
  standalone: true,
  templateUrl: './applications-stats-strip.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationsStatsStripComponent {
  readonly stats = input<JobApplicationStats | null>(null);

  statusTitle(key: string): string {
    return key
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  readonly statusKeys = [
    'applied',
    'screening',
    'interviewed',
    'offer_received',
    'rejected',
  ] as const;
}
