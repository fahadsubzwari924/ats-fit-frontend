import { DatePipe, NgClass, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { JobApplication } from '@features/apply-new-job/models/job-application.model';
import { JobApplicationListSortField } from '@features/applications/models/job-application-list-params.model';
import { applicationStatusBadgeClasses } from '@features/applications/lib/application-status-badge-classes';

@Component({
  selector: 'app-applications-table',
  standalone: true,
  imports: [DatePipe, NgClass, TitleCasePipe],
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

  readonly sortCompany = output<void>();
  readonly sortUpdated = output<void>();
  readonly pagePrev = output<void>();
  readonly pageNext = output<void>();
  readonly viewJob = output<string>();
  readonly deleteJob = output<string>();
  readonly adjustFilters = output<void>();

  badgeClasses(status: string): string {
    return applicationStatusBadgeClasses(status);
  }

  formatStatusLabel(status: string | undefined): string {
    if (!status) {
      return '—';
    }
    return status.replace(/_/g, ' ');
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
