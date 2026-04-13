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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
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

const PAGE_LIMIT = 8;

@Component({
  selector: 'app-resume-history-modal',
  standalone: true,
  imports: [DatePipe, FormsModule, ResumeComparisonComponent],
  templateUrl: './resume-history-modal.component.html',
})
export class ResumeHistoryModalComponent implements OnInit {
  private readonly historyService = inject(ResumeHistoryService);
  private readonly snackbar = inject(SnackbarService);
  private readonly destroyRef = inject(DestroyRef);
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
        const filename = `${item.jobPosition ?? 'resume'}-${item.companyName ?? ''}.pdf`
          .replace(/\s+/g, '-')
          .toLowerCase();
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

  close(): void {
    this.dialogRef.close();
  }
}
