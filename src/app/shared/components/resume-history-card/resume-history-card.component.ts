import { Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ResumeHistoryItem } from '@features/dashboard/models/resume-history.model';

@Component({
  selector: 'app-resume-history-card',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './resume-history-card.component.html',
  styleUrl: './resume-history-card.component.scss',
})
export class ResumeHistoryCardComponent {
  items = input<ResumeHistoryItem[]>([]);
  loading = input<boolean>(false);
  downloadingId = input<string | null>(null);

  viewAllClicked = output<void>();
  createFirstClicked = output<void>();
  downloadItem = output<ResumeHistoryItem>();
}
