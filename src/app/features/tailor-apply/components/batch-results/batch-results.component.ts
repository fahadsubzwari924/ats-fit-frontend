import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { saveAs } from 'file-saver';
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
import type {
  MatchScoreBlock,
  StatusColor,
} from '@shared/types/match-score-block.model';

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
  private readonly destroyRef = inject(DestroyRef);

  batchResponse = input.required<BatchGenerateResponse>();
  tailorAnother = output<void>();
  /** Emitted after applications are successfully tracked — signals the modal to close. */
  finishWithTracking = output<void>();

  activeComparisonId = signal<string | null>(null);
  /**
   * Match-score block of the result currently being compared. Captured at
   * open time so the comparison view renders the same numbers as the result
   * row without re-fetching.
   */
  activeComparisonMatchScore = signal<MatchScoreBlock | null>(null);

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
   * Resolves a PDF blob + server-provided filename for a result. Inline
   * `pdfContent` (live SSE path) wins when available, paired with the
   * filename from the live event. Otherwise fetches by `resumeGenerationId`
   * (snapshot/replay path) and uses the X-Filename header. Resolves to `null`
   * if neither source is available or the HTTP fetch fails.
   */
  private resolvePdfBlob(
    result: BatchJobResult,
  ) {
    const inline = this.batchService.buildBlob(result);
    if (inline) {
      return of({ blob: inline, filename: result.filename ?? 'Resume.pdf' });
    }
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
        next: (payload) => {
          if (!payload) {
            this.snackbar.showError('PDF not available for this result.');
            this.downloadingIndex.set(null);
            return;
          }
          saveAs(payload.blob, payload.filename);
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

    forkJoin(
      items.map((r) =>
        this.resolvePdfBlob(r).pipe(map((payload) => ({ result: r, payload }))),
      ),
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: async (entries) => {
          const usable = entries.filter(
            (e): e is { result: BatchJobResult; payload: { blob: Blob; filename: string } } =>
              e.payload !== null,
          );
          if (!usable.length) {
            this.snackbar.showError('No PDFs available to bundle. Please try individual downloads.');
            this.isZipping.set(false);
            return;
          }
          try {
            const zip = new JSZip();
            // Disambiguate entries that resolve to the same filename (e.g. two
            // "Software Engineer" jobs at different companies). Without this,
            // JSZip silently overwrites earlier entries and the ZIP ends up
            // with fewer files than the user expected.
            const usedNames = new Map<string, number>();
            for (const { result, payload } of usable) {
              const finalName = this.disambiguateZipName(
                payload.filename,
                result,
                usedNames,
              );
              zip.file(finalName, payload.blob);
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

  /**
   * If `name` has already been used in this ZIP, append `_<companyName>` (or
   * a numeric suffix if the company name does not disambiguate) before the
   * extension. Tracks usage in-place via `usedNames`.
   */
  private disambiguateZipName(
    name: string,
    result: BatchJobResult,
    usedNames: Map<string, number>,
  ): string {
    if (!usedNames.has(name)) {
      usedNames.set(name, 1);
      return name;
    }
    const dotIndex = name.lastIndexOf('.');
    const base = dotIndex > 0 ? name.slice(0, dotIndex) : name;
    const ext = dotIndex > 0 ? name.slice(dotIndex) : '';
    const sanitizedCompany = (result.companyName ?? '')
      .trim()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_');
    let candidate = sanitizedCompany ? `${base}_${sanitizedCompany}${ext}` : '';
    if (!candidate || usedNames.has(candidate)) {
      const count = (usedNames.get(name) ?? 1) + 1;
      usedNames.set(name, count);
      candidate = `${base}_${count}${ext}`;
    }
    usedNames.set(candidate, 1);
    return candidate;
  }

  openComparison(result: BatchJobResult): void {
    if (!result.resumeGenerationId) return;
    this.activeComparisonId.set(result.resumeGenerationId);
    this.activeComparisonMatchScore.set(result.matchScore ?? null);
  }

  closeComparison(): void {
    this.activeComparisonId.set(null);
    this.activeComparisonMatchScore.set(null);
  }

  /**
   * Maps the BE-supplied semantic status color to the Tailwind palette used in
   * the batch results surface. Mirrors the helper in batch-job-card.
   */
  statusColorClass(color: StatusColor): string {
    const map: Record<StatusColor, string> = {
      success: 'text-success-strong',
      warning: 'text-amber-600',
      muted: 'text-slate-500',
    };
    return map[color];
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
