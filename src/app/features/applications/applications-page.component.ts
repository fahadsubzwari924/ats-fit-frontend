import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { JobService } from '@features/apply-new-job/services/job.service';
import { AppliedJob } from '@features/apply-new-job/models/applied-job.model';
import { JobApplicationStats } from '@features/dashboard/models/job-stats.model';
import { JobApplicationListParams, JobApplicationListSortField } from '@features/applications/models/job-application-list-params.model';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ApplicationsStatsStripComponent } from '@features/applications/components/applications-stats-strip.component';
import { ApplicationsFiltersComponent } from '@features/applications/components/applications-filters.component';
import { AddApplicationDialogComponent } from '@features/applications/components/add-application-dialog.component';
import { ApplicationDetailDrawerComponent } from '@features/applications/components/application-detail-drawer.component';
import { ApplicationsTableComponent } from '@features/applications/components/applications-table.component';
import { ModalService } from '@shared/services/modal.service';
import { registerApplicationsFilterAutoReload } from '@features/applications/lib/register-applications-filter-autoreload';
import { readHttpApiError } from '@features/applications/lib/read-http-api-error';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-applications-page',
  standalone: true,
  imports: [
    ApplicationsStatsStripComponent,
    ApplicationsFiltersComponent,
    ApplicationsTableComponent,
    ApplicationDetailDrawerComponent,
  ],
  templateUrl: './applications-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationsPageComponent implements OnInit {
  private readonly jobService = inject(JobService);
  private readonly snackbar = inject(SnackbarService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly modalService = inject(ModalService);

  private readonly filtersRef = viewChild(ApplicationsFiltersComponent);

  constructor() {
    registerApplicationsFilterAutoReload(
      this.destroyRef,
      this.filterSearch,
      this.filterStatuses,
      this.filterAppliedFrom,
      this.filterAppliedTo,
      this.filterPriority,
      this.filterWorkMode,
      this.filterEmploymentType,
      () => {
        this.offset.set(0);
        this.loadListOnly();
      },
    );
  }

  readonly stats = signal<JobApplicationStats | null>(null);
  readonly listResult = signal<AppliedJob | null>(null);
  readonly loading = signal(false);

  readonly filterSearch = signal('');
  readonly filterStatuses = signal<string[]>([]);
  readonly filterAppliedFrom = signal('');
  readonly filterAppliedTo = signal('');
  readonly filterPriority = signal('');
  readonly filterWorkMode = signal('');
  readonly filterEmploymentType = signal('');

  readonly sortBy = signal<JobApplicationListSortField>('updated_at');
  readonly sortOrder = signal<'ASC' | 'DESC'>('DESC');
  readonly offset = signal(0);

  readonly selectedJobId = signal<string | null>(null);
  readonly statusUpdatingJobId = signal<string | null>(null);

  ngOnInit(): void {
    this.loadPageData();
  }

  onSortCompany(): void {
    this.toggleSort('company_name');
  }

  onSortUpdated(): void {
    this.toggleSort('updated_at');
  }

  onPagePrev(): void {
    const next = Math.max(0, this.offset() - PAGE_SIZE);
    this.offset.set(next);
    this.loadListOnly();
  }

  onPageNext(): void {
    this.offset.set(this.offset() + PAGE_SIZE);
    this.loadListOnly();
  }

  onViewJob(id: string): void {
    this.selectedJobId.set(id);
  }

  onCloseDetailDrawer(): void {
    this.selectedJobId.set(null);
  }

  onDetailSaved(): void {
    this.loadPageData();
  }

  onAddApplication(): void {
    const ref = this.modalService.openModal<AddApplicationDialogComponent>(AddApplicationDialogComponent, undefined, {
      width: 'min(520px, calc(100vw - 2rem))',
      maxWidth: '96vw',
    });
    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((created) => {
        if (created) {
          this.snackbar.showSuccess('Application added.');
          this.offset.set(0);
          this.loadPageData();
        }
      });
  }

  onAdjustFilters(): void {
    this.filtersRef()?.expandMobileFilters();
    const el = document.getElementById('applications-filters');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    queueMicrotask(() => {
      document.getElementById('applications-search')?.focus();
    });
  }

  onStatusChange(event: { jobId: string; status: string }): void {
    const { jobId, status } = event;
    const current = this.listResult()?.applications.find((a) => a.id === jobId)?.status;
    if (current === status) {
      return;
    }
    this.statusUpdatingJobId.set(jobId);
    this.jobService
      .editJob(jobId, { status })
      .pipe(
        catchError((err: unknown) => {
          this.snackbar.showError(
            readHttpApiError(err) ?? 'Could not update status. Please try again.',
          );
          return of(null);
        }),
        finalize(() => this.statusUpdatingJobId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((updated) => {
        if (updated) {
          this.loadPageData();
        }
      });
  }

  onDeleteJob(id: string): void {
    if (!window.confirm('Delete this application? This cannot be undone.')) {
      return;
    }
    this.jobService
      .deleteJob(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadPageData();
        },
        error: (err: unknown) => {
          this.snackbar.showError(
            readHttpApiError(err) ?? 'Could not delete application. Please try again.',
          );
        },
      });
  }

  private toggleSort(field: JobApplicationListSortField): void {
    if (this.sortBy() === field) {
      this.sortOrder.update((o) => (o === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      this.sortBy.set(field);
      this.sortOrder.set('DESC');
    }
    this.offset.set(0);
    this.loadListOnly();
  }

  private buildListParams(): JobApplicationListParams {
    const statuses = this.filterStatuses();
    return {
      q: this.filterSearch().trim() || undefined,
      statuses: statuses.length ? statuses : undefined,
      applied_at_from: this.filterAppliedFrom() || undefined,
      applied_at_to: this.filterAppliedTo() || undefined,
      priority: this.filterPriority() || undefined,
      work_mode: this.filterWorkMode() || undefined,
      employment_type: this.filterEmploymentType() || undefined,
      limit: PAGE_SIZE,
      offset: this.offset(),
      sort_by: this.sortBy(),
      sort_order: this.sortOrder(),
    };
  }

  private loadPageData(): void {
    this.loading.set(true);
    const params = this.buildListParams();
    forkJoin({
      stats: this.jobService.getJobStats(),
      list: this.jobService.getJobs(params),
    })
      .pipe(
        catchError((err: unknown) => {
          this.loading.set(false);
          this.snackbar.showError(
            readHttpApiError(err) ?? 'Could not load applications. Please try again.',
          );
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((res) => {
        this.loading.set(false);
        if (!res) {
          return;
        }
        this.stats.set(res.stats);
        this.listResult.set(res.list);
      });
  }

  private loadListOnly(): void {
    this.loading.set(true);
    this.jobService
      .getJobs(this.buildListParams())
      .pipe(
        catchError((err: unknown) => {
          this.loading.set(false);
          this.snackbar.showError(
            readHttpApiError(err) ?? 'Could not refresh applications. Please try again.',
          );
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((list) => {
        this.loading.set(false);
        if (list) {
          this.listResult.set(list);
        }
      });
  }
}
