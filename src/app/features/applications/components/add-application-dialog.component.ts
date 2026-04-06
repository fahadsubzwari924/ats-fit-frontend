import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { catchError, of } from 'rxjs';
import { JobApplicationCreatePayload } from '@features/apply-new-job/models/job-application-create-payload.model';
import { JobService } from '@features/apply-new-job/services/job.service';
import { SnackbarService } from '@shared/services/snackbar.service';

@Component({
  selector: 'app-add-application-dialog',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './add-application-dialog.component.html',
  styleUrl: './add-application-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddApplicationDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<AddApplicationDialogComponent, boolean>);
  private readonly jobService = inject(JobService);
  private readonly snackbar = inject(SnackbarService);
  private readonly destroyRef = inject(DestroyRef);

  readonly submitting = signal(false);

  companyName = '';
  jobTitle = '';
  jobUrl = '';
  jobDescription = '';

  cancel(): void {
    this.dialogRef.close(false);
  }

  submit(): void {
    const desc = this.jobDescription.trim();
    if (!this.companyName.trim() || !this.jobTitle.trim() || !desc) {
      this.snackbar.showWarning('Company, job title, and job description are required.');
      return;
    }
    const payload: JobApplicationCreatePayload = {
      application_source: 'direct_apply',
      company_name: this.companyName.trim(),
      job_position: this.jobTitle.trim(),
      job_description: desc,
    };
    const url = this.jobUrl.trim();
    if (url) {
      payload.job_url = url;
    }
    this.submitting.set(true);
    this.jobService
      .applyNewJobs(payload)
      .pipe(
        catchError((err: unknown) => {
          this.submitting.set(false);
          const msg =
            err && typeof err === 'object' && 'error' in err
              ? (err as { error?: { message?: string } }).error?.message
              : undefined;
          this.snackbar.showError(msg ?? 'Could not add application.');
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((res) => {
        this.submitting.set(false);
        if (res) {
          this.dialogRef.close(true);
        }
      });
  }
}
