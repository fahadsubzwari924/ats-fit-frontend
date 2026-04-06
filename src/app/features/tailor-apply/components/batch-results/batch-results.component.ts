import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BatchGenerateResponse, BatchJobResult } from '@features/tailor-apply/models/batch-tailoring.model';
import { BatchTailoringService } from '@features/tailor-apply/services/batch-tailoring.service';
import { JobApplicationCreatePayload } from '@features/apply-new-job/models/job-application-create-payload.model';
import { JobService } from '@features/apply-new-job/services/job.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { trackedApplicationAppliedAtIso } from '@features/applications/lib/date-input-helpers';

@Component({
  selector: 'app-batch-results',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './batch-results.component.html',
})
export class BatchResultsComponent {
  private readonly batchService = inject(BatchTailoringService);
  private readonly jobService = inject(JobService);
  private readonly snackbar = inject(SnackbarService);

  batchResponse = input.required<BatchGenerateResponse>();
  tailorAnother = output<void>();
  /** Emitted when the user finishes without saving to the job tracker (checkbox off). */
  finishWithoutTracking = output<void>();

  /** Default on: user can uncheck to skip tracking when using the primary action. */
  readonly trackApplicationsChecked = signal(true);

  downloadingIndex = signal<number | null>(null);
  isZipping = signal(false);
  isTracking = signal(false);
  tracked = signal(false);

  get succeeded(): BatchJobResult[] {
    return this.batchResponse().results.filter((r) => r.status === 'success');
  }

  get failed(): BatchJobResult[] {
    return this.batchResponse().results.filter((r) => r.status === 'failed');
  }

  downloadSingle(result: BatchJobResult, index: number): void {
    if (this.downloadingIndex() === index) return;
    const blob = this.batchService.buildBlob(result);
    if (!blob) {
      this.snackbar.showError('PDF not available for this result.');
      return;
    }
    this.downloadingIndex.set(index);
    const filename = `${result.companyName}_${result.jobPosition}_Resume.pdf`
      .replace(/\s+/g, '_');
    saveAs(blob, filename);
    setTimeout(() => this.downloadingIndex.set(null), 1000);
  }

  async downloadAllAsZip(): Promise<void> {
    const items = this.succeeded;
    if (!items.length) return;
    this.isZipping.set(true);
    try {
      const zip = new JSZip();
      for (const result of items) {
        const blob = this.batchService.buildBlob(result);
        if (blob) {
          const filename = `${result.companyName}_${result.jobPosition}_Resume.pdf`
            .replace(/\s+/g, '_');
          zip.file(filename, blob);
        }
      }
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'tailored-resumes.zip');
    } catch {
      this.snackbar.showError('Failed to create ZIP file. Please try individual downloads.');
    } finally {
      this.isZipping.set(false);
    }
  }

  onFinishWithoutTracking(): void {
    this.finishWithoutTracking.emit();
  }

  trackAllApplications(): void {
    if (this.tracked() || this.isTracking()) return;
    const items = this.succeeded.filter(
      (r) =>
        !!r.resumeGenerationId?.trim() &&
        (r.jobDescription?.trim().length ?? 0) >= 20,
    );
    if (!items.length) {
      this.snackbar.showWarning(
        'Cannot track: each completed job needs a job description (re-run batch with full descriptions).',
      );
      return;
    }

    this.isTracking.set(true);
    const appliedAt = trackedApplicationAppliedAtIso();
    const requests = items.map((r) => {
      const payload: JobApplicationCreatePayload = {
        application_source: 'tailored_resume',
        company_name: r.companyName,
        job_position: r.jobPosition,
        job_description: r.jobDescription!.trim(),
        applied_at: appliedAt,
        resume_generation_id: r.resumeGenerationId,
      };
      return this.jobService.applyNewJobs(payload).pipe(
        map(() => true as const),
        catchError(() => of(false as const)),
      );
    });

    forkJoin(requests).subscribe({
      next: (outcomes) => {
        this.isTracking.set(false);
        const ok = outcomes.filter(Boolean).length;
        const bad = outcomes.length - ok;
        if (ok > 0) {
          this.tracked.set(true);
          const suffix = bad > 0 ? ` (${bad} failed)` : '';
          this.snackbar.showSuccess(
            `${ok} application${ok > 1 ? 's' : ''} tracked!${suffix}`,
          );
        }
        if (ok === 0) {
          this.snackbar.showError('Could not track applications. Please try again.');
        }
      },
      error: () => {
        this.isTracking.set(false);
        this.snackbar.showError('Some applications could not be tracked.');
      },
    });
  }
}
