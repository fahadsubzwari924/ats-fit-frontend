import { DatePipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { JobApplication } from '@features/apply-new-job/models/job-application.model';
import { JobApplicationListSortField } from '@features/applications/models/job-application-list-params.model';
import { ApplicationStatusSelectComponent } from '@features/applications/components/application-status-select.component';

@Component({
  selector: 'app-applications-table',
  standalone: true,
  imports: [DatePipe, NgClass, ApplicationStatusSelectComponent],
  templateUrl: './applications-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationsTableComponent {
  readonly rows = input<JobApplication[]>([]);
  readonly isLoading = input(false);
  readonly total = input(0);
  readonly offset = input(0);
  readonly limit = input(20);
  readonly sortBy = input<JobApplicationListSortField>('updated_at');
  readonly sortOrder = input<'ASC' | 'DESC'>('DESC');
  /** When set, the status control for that row is disabled (PATCH in flight). */
  readonly statusUpdatingJobId = input<string | null>(null);

  readonly sortCompany = output<void>();
  readonly sortUpdated = output<void>();
  readonly pagePrev = output<void>();
  readonly pageNext = output<void>();
  readonly viewJob = output<string>();
  readonly deleteJob = output<string>();
  readonly adjustFilters = output<void>();
  readonly statusChange = output<{ jobId: string; status: string }>();

  priorityClasses(priority: string): Record<string, boolean> {
    return {
      'bg-red-100 text-red-700': priority === 'high' || priority === 'top_choice',
      'bg-amber-100 text-amber-700': priority === 'medium',
      'bg-slate-100 text-slate-600': priority === 'low',
    };
  }

  formatPriority(priority: string): string {
    return priority.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  isDateValid(d: Date | undefined | null): boolean {
    return d != null && !Number.isNaN(d.getTime());
  }

  companySortAria(): string {
    return this.sortBy() === 'company_name'
      ? `Sort company, currently ${this.sortOrder() === 'ASC' ? 'ascending' : 'descending'}`
      : 'Sort by company name';
  }

  updatedSortAria(): string {
    return this.sortBy() === 'updated_at'
      ? `Sort updated, currently ${this.sortOrder() === 'ASC' ? 'ascending' : 'descending'}`
      : 'Sort by last updated';
  }

  canPrev(): boolean {
    return this.offset() > 0;
  }

  canNext(): boolean {
    return this.offset() + this.rows().length < this.total();
  }

  currentPage(): number {
    const lim = this.limit();
    return Math.floor(this.offset() / lim) + 1;
  }

  totalPages(): number {
    const lim = this.limit();
    const t = this.total();
    return Math.max(1, Math.ceil(t / lim));
  }
}
