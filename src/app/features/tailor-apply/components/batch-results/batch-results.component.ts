import { Component, inject, input, output, signal } from '@angular/core';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { forkJoin, from, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BatchGenerateResponse, BatchJobResult } from '@features/tailor-apply/models/batch-tailoring.model';
import { BatchTailoringService } from '@features/tailor-apply/services/batch-tailoring.service';
import { JobService } from '@features/apply-new-job/services/job.service';
import { SnackbarService } from '@shared/services/snackbar.service';

@Component({
  selector: 'app-batch-results',
  standalone: true,
  imports: [],
  templateUrl: './batch-results.component.html',
})
export class BatchResultsComponent {
  private readonly batchService = inject(BatchTailoringService);
  private readonly jobService = inject(JobService);
  private readonly snackbar = inject(SnackbarService);

  batchResponse = input.required<BatchGenerateResponse>();
  tailorAnother = output<void>();

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

  trackAllApplications(): void {
    if (this.tracked() || this.isTracking()) return;
    const items = this.succeeded;
    if (!items.length) return;

    this.isTracking.set(true);
    const requests = items
      .filter((r) => r.resumeGenerationId)
      .map((r) =>
        this.jobService.applyNewJobs({
          companyName: r.companyName,
          jobTitle: r.jobPosition,
          resumeGenerationId: r.resumeGenerationId,
          source: 'quick-tailor',
        }).pipe(catchError(() => of(null)))
      );

    forkJoin(requests.length ? requests : [of(null)]).subscribe({
      next: () => {
        this.isTracking.set(false);
        this.tracked.set(true);
        this.snackbar.showSuccess(`${items.length} application${items.length > 1 ? 's' : ''} tracked!`);
      },
      error: () => {
        this.isTracking.set(false);
        this.snackbar.showError('Some applications could not be tracked.');
      },
    });
  }
}
