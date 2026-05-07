import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { saveAs } from 'file-saver';
import { generateResumeFilename } from '@core/utils/download-filename.util';
import JSZip from 'jszip';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BatchGenerateResponse, BatchJobResult } from '@features/tailor-apply/models/batch-tailoring.model';
import { BatchTailoringService } from '@features/tailor-apply/services/batch-tailoring.service';
import { JobApplicationCreatePayload } from '@features/apply-new-job/models/job-application-create-payload.model';
import { JobService } from '@features/apply-new-job/services/job.service';
import { ResumeService } from '@shared/services/resume.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { trackedApplicationAppliedAtIso } from '@features/applications/lib/date-input-helpers';
import { ResumeComparisonComponent } from '@features/tailor-apply/components/resume-comparison/resume-comparison.component';
import { UserState } from '@core/states/user.state';

@Component({
  selector: 'app-batch-results',
  standalone: true,
  imports: [ResumeComparisonComponent],
  templateUrl: './batch-results.component.html',
})
export class BatchResultsComponent {
  private readonly batchService = inject(BatchTailoringService);
  private readonly resumeService = inject(ResumeService);
  private readonly jobService = inject(JobService);
  private readonly snackbar = inject(SnackbarService);
  private readonly userState = inject(UserState);
  private readonly destroyRef = inject(DestroyRef);

  batchResponse = input.required<BatchGenerateResponse>();
  tailorAnother = output<void>();
  /** Emitted after applications are successfully tracked — signals the modal to close. */
  finishWithTracking = output<void>();

  activeComparisonId = signal<string | null>(null);

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

  /**
   * Resolves a PDF blob for a result. Inline `pdfContent` (v1 sync path) wins
   * when available; otherwise fetches by `resumeGenerationId` (v2 async path,
   * where SSE deliberately omits the base64 payload). Resolves to `null` if
   * neither source is available or the HTTP fetch fails.
   */
  private resolvePdfBlob(result: BatchJobResult) {
    const inline = this.batchService.buildBlob(result);
    if (inline) return of(inline);
    if (!result.resumeGenerationId) return of(null);
    return this.resumeService.downloadResumeById(result.resumeGenerationId).pipe(
      catchError(() => of(null)),
    );
  }

  downloadSingle(result: BatchJobResult, index: number): void {
    if (this.downloadingIndex() === index) return;
    this.downloadingIndex.set(index);

    this.resolvePdfBlob(result)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          if (!blob) {
            this.snackbar.showError('PDF not available for this result.');
            this.downloadingIndex.set(null);
            return;
          }
          const filename = generateResumeFilename(
            this.userState.currentUser()?.fullName ?? '',
            result.jobPosition ?? '',
          );
          saveAs(blob, filename);
          this.downloadingIndex.set(null);
        },
        error: () => {
          this.snackbar.showError('Could not download this resume. Please try again.');
          this.downloadingIndex.set(null);
        },
      });
  }

  downloadAllAsZip(): void {
    const items = this.succeeded;
    if (!items.length) return;
    this.isZipping.set(true);

    forkJoin(items.map((r) => this.resolvePdfBlob(r).pipe(map((blob) => ({ result: r, blob })))))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: async (entries) => {
          const usable = entries.filter((e): e is { result: BatchJobResult; blob: Blob } => e.blob !== null);
          if (!usable.length) {
            this.snackbar.showError('No PDFs available to bundle. Please try individual downloads.');
            this.isZipping.set(false);
            return;
          }
          try {
            const zip = new JSZip();
            for (const { result, blob } of usable) {
              const filename = generateResumeFilename(
                this.userState.currentUser()?.fullName ?? '',
                result.jobPosition ?? '',
              );
              zip.file(filename, blob);
            }
            const content = await zip.generateAsync({ type: 'blob' });
            const ts = new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');
            saveAs(content, `TailoredResumes_${ts}.zip`);
            if (usable.length < items.length) {
              this.snackbar.showWarning(
                `${items.length - usable.length} of ${items.length} resume(s) could not be included.`,
              );
            }
          } catch {
            this.snackbar.showError('Failed to create ZIP file. Please try individual downloads.');
          } finally {
            this.isZipping.set(false);
          }
        },
        error: () => {
          this.snackbar.showError('Failed to create ZIP file. Please try individual downloads.');
          this.isZipping.set(false);
        },
      });
  }

  openComparison(id: string): void {
    this.activeComparisonId.set(id);
  }

  closeComparison(): void {
    this.activeComparisonId.set(null);
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
          this.finishWithTracking.emit();
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
