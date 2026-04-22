import { DatePipe, NgClass } from '@angular/common';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { catchError, of, Subscription } from 'rxjs';
import { JobApplication } from '@features/apply-new-job/models/job-application.model';
import { JobApplicationUpdatePayload } from '@features/apply-new-job/models/job-application-update-payload.model';
import { JobService } from '@features/apply-new-job/services/job.service';
import { ApplicationStatus } from '@features/dashboard/enums/application-status.enum';
import { fromDateInputToIso, toDateInputValue } from '@features/applications/lib/date-input-helpers';
import { SnackbarService } from '@shared/services/snackbar.service';

const JD_PREVIEW_LEN = 400;

@Component({
  selector: 'app-application-detail-drawer',
  standalone: true,
  imports: [DatePipe, NgClass, FormsModule, CdkTrapFocus],
  templateUrl: './application-detail-drawer.component.html',
  styleUrl: './application-detail-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationDetailDrawerComponent {
  private readonly jobService = inject(JobService);
  private readonly snackbar = inject(SnackbarService);
  private readonly destroyRef = inject(DestroyRef);

  readonly jobId = input.required<string>();
  readonly closed = output<void>();
  readonly saved = output<void>();

  readonly job = signal<JobApplication | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly jdExpanded = signal(false);

  readonly statusOptions = Object.values(ApplicationStatus);

  editStatus = '';
  editAppliedAt = '';
  editInterviewAt = '';
  editInterviewNotes = '';
  editFollowUp = '';
  editNotes = '';
  editRejection = '';
  editContactPhone = '';

  constructor() {
    effect((onCleanup) => {
      const id = this.jobId();
      this.loading.set(true);
      this.job.set(null);
      const sub: Subscription = this.jobService
        .getJobById(id, { params: {} })
        .pipe(
          catchError((err: unknown) => {
            this.loading.set(false);
            this.snackbar.showError(this.httpErrorMessage(err, 'Could not load application.'));
            this.closed.emit();
            return of(null);
          }),
        )
        .subscribe((j) => {
          this.loading.set(false);
          if (j) {
            this.job.set(j);
            this.patchForm(j);
          }
        });
      onCleanup(() => sub.unsubscribe());
    });
  }

  statusLabel(s: string): string {
    return s.replace(/_/g, ' ');
  }

  formatSource(source: string): string {
    return source.replace(/_/g, ' ');
  }

  isDateValid(d: Date | undefined | null): boolean {
    if (d == null || Number.isNaN(d.getTime()) || d.getTime() === 0) {
      return false;
    }
    return true;
  }

  statusPillNgClass(status: string | undefined): Record<string, boolean> {
    const s = (status ?? '').toLowerCase();
    const tone = s.includes('reject')
      ? 'rose'
      : s.includes('offer') || s.includes('accept')
        ? 'emerald'
        : s.includes('interview')
          ? 'violet'
          : 'slate';
    return {
      'app-detail-drawer__pill': true,
      [`app-detail-drawer__pill--${tone}`]: true,
    };
  }

  jdPreview(): string {
    const jd = this.job()?.jobDescription ?? '';
    if (this.jdExpanded() || jd.length <= JD_PREVIEW_LEN) {
      return jd;
    }
    return `${jd.slice(0, JD_PREVIEW_LEN)}…`;
  }

  canToggleJdMore(): boolean {
    return (this.job()?.jobDescription?.length ?? 0) > JD_PREVIEW_LEN;
  }

  toggleJd(): void {
    this.jdExpanded.update((v) => !v);
  }

  onBackdropClick(): void {
    this.closed.emit();
  }

  onBackdropOverlayKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onBackdropClick();
    }
  }

  onPanelClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  onPanelKeydown(event: KeyboardEvent): void {
    event.stopPropagation();
  }

  save(): void {
    const id = this.jobId();
    const payload: JobApplicationUpdatePayload = {
      status: this.editStatus || undefined,
      applied_at: fromDateInputToIso(this.editAppliedAt),
      interview_scheduled_at: fromDateInputToIso(this.editInterviewAt),
      interview_notes: this.editInterviewNotes.trim() || undefined,
      follow_up_date: fromDateInputToIso(this.editFollowUp),
      notes: this.editNotes.trim() || undefined,
      rejection_reason: this.editRejection.trim() || undefined,
      contact_phone: this.editContactPhone.trim() || undefined,
    };
    this.saving.set(true);
    this.jobService
      .editJob(id, payload)
      .pipe(
        catchError((err: unknown) => {
          this.saving.set(false);
          this.snackbar.showError(this.httpErrorMessage(err, 'Could not save changes.'));
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((updated) => {
        this.saving.set(false);
        if (!updated) {
          return;
        }
        this.job.set(updated);
        this.patchForm(updated);
        this.snackbar.showSuccess('Application updated.');
        this.saved.emit();
      });
  }

  private patchForm(j: JobApplication): void {
    this.editStatus = j.status ?? '';
    this.editAppliedAt = toDateInputValue(j.appliedAt);
    this.editInterviewAt = toDateInputValue(j.interviewScheduledAt);
    this.editInterviewNotes = j.interviewNotes ?? '';
    this.editFollowUp = toDateInputValue(j.followUpDate);
    this.editNotes = j.notes ?? '';
    this.editRejection = j.rejectionReason ?? '';
    this.editContactPhone = j.contactPhone ?? '';
    this.jdExpanded.set(false);
  }

  private httpErrorMessage(err: unknown, fallback: string): string {
    if (err && typeof err === 'object' && 'error' in err) {
      const e = (err as { error?: { message?: string } }).error?.message;
      if (e) {
        return e;
      }
    }
    return fallback;
  }
}
