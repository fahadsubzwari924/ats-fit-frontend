import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BatchJobInputComponent } from './components/batch-job-input/batch-job-input.component';
import { BatchResultsComponent } from './components/batch-results/batch-results.component';
import { BatchTailoringService } from './services/batch-tailoring.service';
import { ResumeService } from '@shared/services/resume.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ResumeTemplate } from '@features/resume-tailoring/models/resume-template.model';
import {
  BatchGenerateRequest,
  BatchGenerateResponse,
  BatchJobInput,
  BatchTailoringStep,
} from './models/batch-tailoring.model';
import { TailoringModalCloseResult } from './models/tailoring-modal-close-result.model';

const ESTIMATED_SECONDS_PER_JOB = 40; // ~2 minutes for 3 jobs (120 seconds total)

@Component({
  selector: 'app-batch-tailoring-modal',
  standalone: true,
  imports: [BatchJobInputComponent, BatchResultsComponent],
  templateUrl: './batch-tailoring-modal.component.html',
})
export class BatchTailoringModalComponent implements OnInit {
  private readonly batchService = inject(BatchTailoringService);
  private readonly resumeService = inject(ResumeService);
  private readonly snackbar = inject(SnackbarService);
  private readonly destroyRef = inject(DestroyRef);
  readonly dialogRef = inject(MatDialogRef<BatchTailoringModalComponent>);

  step = signal<BatchTailoringStep>('input');
  templates = signal<ResumeTemplate[]>([]);
  batchResponse = signal<BatchGenerateResponse | null>(null);
  jobCount = signal(2);
  estimatedSeconds = signal(0);
  elapsedSeconds = signal(0);
  private timerInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.resumeService.getResumeTemplates().pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((templates) => this.templates.set(templates));
  }

  onGenerate(payload: BatchGenerateRequest): void {
    this.jobCount.set(payload.jobs.length);
    this.estimatedSeconds.set(payload.jobs.length * ESTIMATED_SECONDS_PER_JOB);
    this.elapsedSeconds.set(0);
    this.step.set('generating');
    this.startTimer();

    this.batchService.generateBatch(payload).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (response) => {
        this.stopTimer();
        this.batchResponse.set(this.attachJobDescriptions(response, payload.jobs));
        this.step.set('results');
      },
      error: (err) => {
        this.stopTimer();
        this.step.set('input');
        this.snackbar.showError(
          err?.error?.message ?? 'Batch generation failed. Please try again.',
        );
      },
    });
  }

  private startTimer(): void {
    this.timerInterval = setInterval(() => {
      this.elapsedSeconds.update((s) => s + 1);
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private attachJobDescriptions(
    response: BatchGenerateResponse,
    jobs: BatchJobInput[],
  ): BatchGenerateResponse {
    return {
      ...response,
      results: response.results.map((r, i) => ({
        ...r,
        jobDescription: jobs[i]?.jobDescription ?? r.jobDescription ?? '',
      })),
    };
  }

  get progressPercent(): number {
    const est = this.estimatedSeconds();
    if (!est) return 0;
    return Math.min(95, Math.round((this.elapsedSeconds() / est) * 100));
  }

  get remainingSeconds(): number {
    return Math.max(0, this.estimatedSeconds() - this.elapsedSeconds());
  }

  onTailorAnother(): void {
    this.batchResponse.set(null);
    this.step.set('input');
  }

  close(): void {
    this.stopTimer();
    const summary = this.batchResponse()?.summary;
    const shouldRefresh =
      this.step() === 'results' && summary !== undefined && summary.succeeded > 0;
    const result: TailoringModalCloseResult | undefined = shouldRefresh
      ? { refreshDashboard: true }
      : undefined;
    this.dialogRef.close(result);
  }
}
