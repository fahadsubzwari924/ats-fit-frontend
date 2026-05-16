import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  debounceTime,
  distinctUntilChanged,
  Subject,
  switchMap,
} from 'rxjs';
import { saveAs } from 'file-saver';

import {
  ResumeHistoryService,
} from '@features/dashboard/services/resume-history.service';
import {
  PaginatedHistoryResponse,
  ResumeHistoryDetail,
  ResumeHistoryItem,
} from '@features/dashboard/models/resume-history.model';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ResumeComparisonComponent } from '@features/tailor-apply/components/resume-comparison/resume-comparison.component';
import { CoverLetterService } from '@shared/services/cover-letter.service';
import { UserState } from '@core/states/user.state';
import { QuotaState } from '@core/states/quota.state';
import { FeatureType } from '@core/enums/feature-type.enum';
import { ApiErrorService } from '@shared/services/api-error.service';
import { QuotaLockedButtonComponent } from '@shared/components/quota-locked-button/quota-locked-button.component';
import type { StatusColor } from '@shared/types/match-score-block.model';

const PAGE_LIMIT = 8;

@Component({
  selector: 'app-resume-history-modal',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    ResumeComparisonComponent,
    MatTooltipModule,
    QuotaLockedButtonComponent,
  ],
  templateUrl: './resume-history-modal.component.html',
})
export class ResumeHistoryModalComponent implements OnInit {
  private readonly historyService = inject(ResumeHistoryService);
  private readonly coverLetterService = inject(CoverLetterService);
  private readonly snackbar = inject(SnackbarService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly quotaState = inject(QuotaState);
  private readonly apiErrorService = inject(ApiErrorService);
  protected readonly userState = inject(UserState);
  readonly dialogRef = inject(MatDialogRef<ResumeHistoryModalComponent>);

  protected readonly COVER_LETTER_FEATURE = FeatureType.COVER_LETTER;
  protected readonly isCoverLetterExhausted = computed(
    () =>
      this.quotaState.quotaFor(this.COVER_LETTER_FEATURE)()?.status ===
      'exhausted',
  );

  private readonly searchSubject = new Subject<string>();

  searchQuery = '';
  currentPage = signal(1);
  totalPages = signal(1);
  totalItems = signal(0);
  isLoading = signal(true);
  items = signal<ResumeHistoryItem[]>([]);

  expandedId = signal<string | null>(null);
  detailLoadingId = signal<string | null>(null);
  detailCache = new Map<string, ResumeHistoryDetail>();
  downloadingId = signal<string | null>(null);

  /** When set, shows the full ResumeComparisonComponent instead of the list. */
  activeComparisonId = signal<string | null>(null);
  activeComparisonItem = signal<ResumeHistoryItem | null>(null);

  /**
   * Tracks the row currently downloading its cover-letter PDF. Separate from
   * `generatingCoverLetterId` so a row can be in "generating" state while
   * other rows can still download in parallel without their spinners
   * interfering.
   */
  downloadingCoverLetterId = signal<string | null>(null);
  /** Tracks per-item retroactive generation so the row can show a spinner. */
  generatingCoverLetterId = signal<string | null>(null);

  ngOnInit(): void {
    this.loadPage(1);
    this.searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      switchMap((query) => {
        this.isLoading.set(true);
        this.currentPage.set(1);
        this.expandedId.set(null);
        return this.historyService.getHistory({
          page: 1,
          limit: PAGE_LIMIT,
          search: query || undefined,
        });
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (res) => this.applyPage(res),
      error: () => {
        this.isLoading.set(false);
        this.snackbar.showError('Failed to load history. Please try again.');
      },
    });
  }

  onSearchChange(query: string): void {
    this.searchSubject.next(query);
  }

  private loadPage(page: number): void {
    this.isLoading.set(true);
    this.historyService.getHistory({
      page,
      limit: PAGE_LIMIT,
      search: this.searchQuery || undefined,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => this.applyPage(res),
      error: () => {
        this.isLoading.set(false);
        this.snackbar.showError('Failed to load history.');
      },
    });
  }

  private applyPage(res: PaginatedHistoryResponse): void {
    this.items.set(res.items);
    this.totalItems.set(res.total);
    this.currentPage.set(res.page);
    this.totalPages.set(Math.ceil(res.total / res.limit) || 1);
    this.isLoading.set(false);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) return;
    this.expandedId.set(null);
    this.loadPage(page);
  }

  get pageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    const delta = 2;
    const left = Math.max(1, current - delta);
    const right = Math.min(total, current + delta);
    for (let i = left; i <= right; i++) pages.push(i);
    return pages;
  }

  toggleDetail(item: ResumeHistoryItem): void {
    if (this.expandedId() === item.id) {
      this.expandedId.set(null);
      return;
    }
    this.expandedId.set(item.id);

    if (this.detailCache.has(item.id)) return;

    this.detailLoadingId.set(item.id);
    this.historyService.getDetail(item.id).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (detail) => {
        this.detailCache.set(item.id, detail);
        this.detailLoadingId.set(null);
      },
      error: () => {
        this.detailLoadingId.set(null);
        this.snackbar.showError('Failed to load resume details.');
        this.expandedId.set(null);
      },
    });
  }

  getDetail(id: string): ResumeHistoryDetail | undefined {
    return this.detailCache.get(id);
  }

  downloadItem(item: ResumeHistoryItem, event: Event): void {
    event.stopPropagation();
    if (this.downloadingId() === item.id) return;
    this.downloadingId.set(item.id);
    this.historyService.downloadResume(item.id).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ({ blob, filename }) => {
        saveAs(blob, filename);
        this.downloadingId.set(null);
      },
      error: () => {
        this.snackbar.showError('Download failed. Please try again.');
        this.downloadingId.set(null);
      },
    });
  }

  openComparison(item: ResumeHistoryItem, event: Event): void {
    event.stopPropagation();
    this.activeComparisonItem.set(item);
    this.activeComparisonId.set(item.id);
  }

  closeComparison(): void {
    this.activeComparisonId.set(null);
    this.activeComparisonItem.set(null);
  }

  /**
   * Download the existing cover-letter PDF. Idempotent and quota-free — the
   * cover letter was already generated; we're just streaming bytes.
   */
  downloadCoverLetterPdf(item: ResumeHistoryItem, event: Event): void {
    event.stopPropagation();
    if (this.downloadingCoverLetterId() === item.id) return;
    if (!item.hasCoverLetter) return;

    this.downloadingCoverLetterId.set(item.id);
    this.coverLetterService
      .downloadPdf(item.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ blob, filename }) => {
          saveAs(blob, filename);
          this.downloadingCoverLetterId.set(null);
        },
        error: (err) => {
          this.downloadingCoverLetterId.set(null);
          const parsed = this.apiErrorService.parse(err, {
            defaultMessage: 'Could not download cover letter. Please try again.',
          });
          this.snackbar.showError(parsed.message);
        },
      });
  }

  /**
   * Retroactively generate a cover letter for a tailored resume that didn't
   * get one at tailoring time, then immediately stream the rendered PDF.
   * Delegates the network chain to CoverLetterService for parity with the
   * dashboard card.
   */
  generateCoverLetter(item: ResumeHistoryItem, event: Event): void {
    event.stopPropagation();
    if (this.generatingCoverLetterId() === item.id) return;
    if (item.hasCoverLetter) {
      this.downloadCoverLetterPdf(item, event);
      return;
    }

    this.generatingCoverLetterId.set(item.id);
    this.coverLetterService
      .ensureGeneratedAndDownload(item.id, false)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ blob, filename, generated }) => {
          saveAs(blob, filename);
          this.generatingCoverLetterId.set(null);
          if (generated) {
            this.markItemHasCoverLetter(item.id);
            this.quotaState.notifyFeatureConsumed(FeatureType.COVER_LETTER);
            this.snackbar.showSuccess('Cover letter ready — downloaded as PDF.');
          }
        },
        error: (err) => {
          this.generatingCoverLetterId.set(null);
          const parsed = this.apiErrorService.parse(err, {
            defaultMessage:
              'Could not generate cover letter. Please try again in a moment.',
          });
          this.snackbar.showError(parsed.message);
        },
      });
  }

  private markItemHasCoverLetter(id: string): void {
    this.items.update((list) =>
      list.map((it) => (it.id === id ? { ...it, hasCoverLetter: true } : it)),
    );
  }

  close(): void {
    this.dialogRef.close();
  }

  /**
   * Maps the canonical `statusColor` semantic token to the Tailwind palette
   * classes already used in this surface. Kept in TS so the template renders
   * the BE-supplied block with zero conditionals.
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
