import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialogRef } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BatchJobInputComponent } from './components/batch-job-input/batch-job-input.component';
import { BatchResultsComponent } from './components/batch-results/batch-results.component';
import { BatchProcessingViewComponent } from './components/batch-processing-view/batch-processing-view.component';
import { BatchTailoringFlowController } from './state/batch-tailoring-flow.controller';
import { BatchTailoringV2State } from './state/batch-tailoring-v2.state';
import { ResumeService } from '@shared/services/resume.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { BlobDownloadService } from '@shared/services/blob-download.service';
import { ResumeTemplate } from '@features/resume-tailoring/models/resume-template.model';
import { QuotaAlertBannerComponent } from '@shared/components/quota-alert-banner/quota-alert-banner.component';
import { FeatureType } from '@core/enums/feature-type.enum';
import { QuotaState } from '@core/states/quota.state';
import {
  BatchGenerateRequest,
  BatchGenerateResponse,
  BatchJobResult,
  BatchTailoringStep,
} from './models/batch-tailoring.model';
import type { BatchJobLiveState } from './models/batch-tailoring-v2.model';
import { TailoringModalCloseResult } from './models/tailoring-modal-close-result.model';

@Component({
  selector: 'app-batch-tailoring-modal',
  standalone: true,
  imports: [
    BatchJobInputComponent,
    BatchResultsComponent,
    BatchProcessingViewComponent,
    QuotaAlertBannerComponent,
    MatTooltipModule,
  ],
  templateUrl: './batch-tailoring-modal.component.html',
  providers: [BatchTailoringV2State, BatchTailoringFlowController],
})
export class BatchTailoringModalComponent implements OnInit {
  private readonly resumeService = inject(ResumeService);
  private readonly snackbar = inject(SnackbarService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly quotaState = inject(QuotaState);
  private readonly downloader = inject(BlobDownloadService);
  readonly dialogRef = inject(MatDialogRef<BatchTailoringModalComponent>);

  readonly flow = inject(BatchTailoringFlowController);
  readonly batchV2State = inject(BatchTailoringV2State);

  step = signal<BatchTailoringStep>('input');
  templates = signal<ResumeTemplate[]>([]);
  batchResponse = signal<BatchGenerateResponse | null>(null);
  jobCount = signal(2);

  /**
   * Set of job UUIDs currently in flight to the retry endpoint. Owned by the
   * modal so it stays in sync across both the processing view and the
   * results view (a retry tapped during processing must keep its spinner
   * even if the modal transitions to `results` mid-flight).
   *
   * SSE is the source of truth for `state` / `error` transitions — this
   * signal exists purely as a UI affordance for the spinner.
   */
  readonly retryingJobIds = signal<ReadonlySet<string>>(new Set());

  /**
   * Guard against repeat firing of the quota-consumed notification (which
   * triggers a `/users/me` round-trip). Without this flag, any reactive
   * downstream signal write that re-runs the effect after a terminal
   * transition would refetch the user repeatedly. Reset by `onGenerate` for
   * a fresh batch run.
   */
  private quotaNotifiedForRun = false;

  protected readonly BATCH_FEATURES: FeatureType[] = [
    FeatureType.RESUME_BATCH_GENERATION,
  ];
  readonly isBatchQuotaExhausted = computed(
    () => this.quotaState.firstExhausted(this.BATCH_FEATURES)() !== null,
  );

  constructor() {
    // Drive `step` and the surfaced response/error from the flow controller's
    // status signal. The controller owns SSE/polling lifecycle; the modal is
    // a thin shell that reflects status into UI state.
    effect(() => {
      const status = this.flow.status();
      if (status === 'completed') {
        const response = this.flow.response();
        if (response) {
          this.batchResponse.set(response);
          this.step.set('results');
          if (!this.quotaNotifiedForRun) {
            this.quotaNotifiedForRun = true;
            this.quotaState.notifyFeatureConsumed(
              FeatureType.RESUME_BATCH_GENERATION,
            );
          }
        }
      } else if (status === 'failed') {
        const err = this.flow.error();
        if (err) this.snackbar.showError(err);
        this.step.set('input');
      }
    });
  }

  ngOnInit(): void {
    this.resumeService
      .getResumeTemplates()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((templates) => this.templates.set(templates));
  }

  onGenerate(payload: BatchGenerateRequest): void {
    this.jobCount.set(payload.jobs.length);
    this.step.set('processing');
    this.quotaNotifiedForRun = false;
    this.flow.start(payload);
  }

  onDownloadJob(job: BatchJobLiveState): void {
    const result = job.result;
    if (!result) return;

    // Snapshot replays from the `/status` endpoint do NOT include `pdfContent`
    // (only the live `job_completed` SSE event does), so fall back to fetching
    // the PDF from the backend by `resumeGenerationId`. Without this the
    // download button silently no-ops on reconnect/replay paths.
    if (result.pdfContent) {
      // `result.filename` is server-generated and now guaranteed for both
      // live SSE and snapshot/replay paths (see BatchTailoringV2Service.toResult).
      this.downloader.downloadFromBase64(
        result.pdfContent,
        result.filename ?? 'Resume.pdf',
        'application/pdf',
      );
      return;
    }

    if (result.resumeGenerationId) {
      this.resumeService
        .downloadResumeById(result.resumeGenerationId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: ({ blob, filename }) => this.downloader.download(blob, filename),
          error: () =>
            this.snackbar.showError(
              'Could not download this resume. Please try again.',
            ),
        });
      return;
    }

    this.snackbar.showError('Resume not yet available for download.');
  }

  onSeeChanges(_job: BatchJobLiveState): void {
    // The comparison view is handled by batch-results component.
    // No-op until the processing view has a comparison panel.
  }

  /** Retry from the processing-view (job-card surface). */
  onRetry(job: BatchJobLiveState): void {
    this.retryByJobId(job.jobId);
  }

  /** Retry from the consolidated batch-results surface. */
  onRetryResult(result: BatchJobResult): void {
    this.retryByJobId(result.jobId);
  }

  /**
   * Wire one retry POST. The BE re-enqueues the job and pushes the actual
   * state transitions back over SSE — we intentionally DO NOT mutate row
   * state here. The local `retryingJobIds` set is a pure UI affordance for
   * the spinner; it clears as soon as the HTTP response resolves.
   *
   * Error mapping mirrors the BE contract (Task E):
   *   429 + `ERR_RETRY_LIMIT_EXCEEDED` → limit toast (and a no-op going
   *     forward — the button will re-render in its "limit reached" state on
   *     the next snapshot).
   *   409 + `ERR_JOB_NOT_RETRYABLE`    → "can no longer be retried" toast.
   *   anything else                    → generic "couldn't retry" toast.
   */
  private retryByJobId(jobId: string | undefined): void {
    if (!jobId) {
      this.snackbar.showError("Couldn't retry. Please try again.");
      return;
    }
    const batchId = this.flow.response()?.batchId
      ?? this.batchV2State.snapshot()?.batchId;
    if (!batchId) {
      this.snackbar.showError("Couldn't retry. Please try again.");
      return;
    }

    const next = new Set(this.retryingJobIds());
    next.add(jobId);
    this.retryingJobIds.set(next);

    this.resumeService
      .retryBatchJob(batchId, jobId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.removeRetryingJobId(jobId),
        error: (err: HttpErrorResponse) => {
          this.removeRetryingJobId(jobId);
          this.snackbar.showError(this.retryErrorMessage(err));
        },
      });
  }

  private removeRetryingJobId(jobId: string): void {
    const next = new Set(this.retryingJobIds());
    next.delete(jobId);
    this.retryingJobIds.set(next);
  }

  private retryErrorMessage(err: HttpErrorResponse): string {
    const body = err?.error as { code?: string; message?: string } | undefined;
    const code = typeof body?.code === 'string' ? body.code : '';
    if (err?.status === 429 || code === 'ERR_RETRY_LIMIT_EXCEEDED') {
      return "You've reached the retry limit for this resume — start a new batch to try again.";
    }
    if (err?.status === 409 || code === 'ERR_JOB_NOT_RETRYABLE') {
      return 'This resume can no longer be retried.';
    }
    return "Couldn't retry. Please try again.";
  }

  onTailorAnother(): void {
    this.batchResponse.set(null);
    this.step.set('input');
    this.flow.reset();
  }

  /**
   * Wired to batch-results' `finishWithTracking` event. Backend already owns
   * application creation for every successful batch row (see
   * BatchTailoringV2Processor — auto-track on completion), so we just close
   * the modal.
   */
  onFinishWithTracking(): void {
    this.close();
  }

  /**
   * Close the modal and signal the dashboard to refresh. The backend already
   * created `job_applications` rows for every successful row in this batch
   * (see BatchTailoringV2Processor — auto-track on completion), so the
   * modal does not need to fire any tracking POSTs on close.
   */
  close(): void {
    const summary = this.batchResponse()?.summary;
    const shouldRefresh =
      this.step() === 'results' &&
      summary !== undefined &&
      summary.succeeded > 0;
    const result: TailoringModalCloseResult | undefined = shouldRefresh
      ? { refreshDashboard: true, tailoringCompleted: true }
      : undefined;
    this.dialogRef.close(result);
  }
}
