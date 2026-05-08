import { Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ResumeHistoryItem } from '@features/dashboard/models/resume-history.model';

@Component({
  selector: 'app-resume-history-card',
  standalone: true,
  imports: [DatePipe, MatTooltipModule],
  templateUrl: './resume-history-card.component.html',
  styleUrl: './resume-history-card.component.scss',
})
export class ResumeHistoryCardComponent {
  items = input<ResumeHistoryItem[]>([]);
  loading = input<boolean>(false);
  downloadingId = input<string | null>(null);
  /** When true, disables the empty-state "Create your first one" CTA. */
  createDisabled = input<boolean>(false);
  createDisabledReason = input<string>('');

  viewAllClicked = output<void>();
  createFirstClicked = output<void>();
  downloadItem = output<ResumeHistoryItem>();
}
