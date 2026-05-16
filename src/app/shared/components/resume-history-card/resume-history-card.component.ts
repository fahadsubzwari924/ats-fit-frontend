import { Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ResumeHistoryItem } from '@features/dashboard/models/resume-history.model';
import type { StatusColor } from '@shared/types/match-score-block.model';

/** Visual triplet for the match-score pill bound via `[style]`. */
interface StatusPillStyle {
  color: string;
  background: string;
  border: string;
}

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
  /**
   * ID of the row currently downloading its cover letter PDF. Tracked
   * separately from `generatingCoverLetterId` so the spinners on each
   * affordance stay independent.
   */
  downloadingCoverLetterId = input<string | null>(null);
  /**
   * ID of the row currently generating-then-downloading its cover letter.
   * Drives a distinct spinner so a row in `Generate` state does not visually
   * collide with `Ready`-state downloads happening on other rows.
   */
  generatingCoverLetterId = input<string | null>(null);
  /**
   * When true and a row has no cover letter yet, the row shows an `Upgrade`
   * affordance instead of the `Generate` icon. Computed by the parent from
   * `QuotaState.quotaFor(COVER_LETTER)`.
   */
  coverLetterQuotaExhausted = input<boolean>(false);
  /** When true, disables the empty-state "Create your first one" CTA. */
  createDisabled = input<boolean>(false);
  createDisabledReason = input<string>('');

  viewAllClicked = output<void>();
  createFirstClicked = output<void>();
  downloadItem = output<ResumeHistoryItem>();
  /**
   * Single channel for all cover-letter row clicks. The parent dispatches the
   * correct action based on `item.hasCoverLetter` and the quota state.
   */
  coverLetterAction = output<ResumeHistoryItem>();

  /**
   * Maps the backend-supplied semantic `statusColor` to the inline `{ color,
   * background, border }` triplet rendered on the match-score pill. Keeps the
   * template free of threshold comparisons — the BE owns the
   * already-strong/improved/low-fit/flat classification.
   */
  statusStyle(color: StatusColor): StatusPillStyle {
    switch (color) {
      case 'success':
        return {
          color: '#16A34A',
          background: '#F0FDF4',
          border: '1px solid #BBF7D0',
        };
      case 'warning':
        return {
          color: '#D97706',
          background: '#FFFBEB',
          border: '1px solid #FDE68A',
        };
      case 'muted':
      default:
        return {
          color: '#64748B',
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
        };
    }
  }
}
