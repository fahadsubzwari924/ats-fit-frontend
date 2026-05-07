import {
  Component,
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
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { saveAs } from 'file-saver';
import { generateResumeFilename } from '@core/utils/download-filename.util';

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
import { CoverLetterPreviewComponent } from '@features/tailor-apply/components/cover-letter-preview/cover-letter-preview.component';
import { CoverLetterService } from '@shared/services/cover-letter.service';
import { CoverLetterResult } from '@features/resume-tailoring/models/cover-letter.model';
import { UserState } from '@core/states/user.state';

const PAGE_LIMIT = 8;

@Component({
  selector: 'app-resume-history-modal',
  standalone: true,
  imports: [DatePipe, FormsModule, ResumeComparisonComponent, CoverLetterPreviewComponent, MatTooltipModule],
  templateUrl: './resume-history-modal.component.html',
})
export class ResumeHistoryModalComponent implements OnInit {
  private readonly historyService = inject(ResumeHistoryService);
  private readonly coverLetterService = inject(CoverLetterService);
  private readonly snackbar = inject(SnackbarService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly userState = inject(UserState);
  readonly dialogRef = inject(MatDialogRef<ResumeHistoryModalComponent>);

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

  /** When set, shows the cover-letter takeover panel. */
  activeCoverLetterId = signal<string | null>(null);
  activeCoverLetterItem = signal<ResumeHistoryItem | null>(null);
  activeCoverLetter = signal<CoverLetterResult | null>(null);
  coverLetterCache = new Map<string, CoverLetterResult>();
  coverLetterLoadingId = signal<string | null>(null);

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
      next: (blob) => {
        const filename = generateResumeFilename(this.userState.currentUser()?.fullName ?? '', item.jobPosition ?? '');
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

  openCoverLetter(item: ResumeHistoryItem, event: Event): void {
    event.stopPropagation();
    if (!item.hasCoverLetter) return;

    const cached = this.coverLetterCache.get(item.id);
    if (cached) {
      this.activeCoverLetterItem.set(item);
      this.activeCoverLetterId.set(item.id);
      this.activeCoverLetter.set(cached);
      return;
    }

    this.coverLetterLoadingId.set(item.id);
    this.coverLetterService
      .getByResumeGenerationId(item.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.coverLetterCache.set(item.id, result);
          this.activeCoverLetterItem.set(item);
          this.activeCoverLetterId.set(item.id);
          this.activeCoverLetter.set(result);
          this.coverLetterLoadingId.set(null);
        },
        error: () => {
          this.coverLetterLoadingId.set(null);
          this.snackbar.showError('Could not load cover letter. Please try again.');
        },
      });
  }

  closeCoverLetter(): void {
    this.activeCoverLetterId.set(null);
    this.activeCoverLetterItem.set(null);
    this.activeCoverLetter.set(null);
  }

  close(): void {
    this.dialogRef.close();
  }
}
