import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
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
import { UserState } from '@core/states/user.state';
import { generateResumeFilename } from '@core/utils/download-filename.util';
import { ResumeTemplate } from '@features/resume-tailoring/models/resume-template.model';
import { QuotaAlertBannerComponent } from '@shared/components/quota-alert-banner/quota-alert-banner.component';
import { FeatureType } from '@core/enums/feature-type.enum';
import { QuotaState } from '@core/states/quota.state';
import {
  BatchGenerateRequest,
  BatchGenerateResponse,
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
  private readonly userState = inject(UserState);
  readonly dialogRef = inject(MatDialogRef<BatchTailoringModalComponent>);

  readonly flow = inject(BatchTailoringFlowController);
  readonly batchV2State = inject(BatchTailoringV2State);

  step = signal<BatchTailoringStep>('input');
  templates = signal<ResumeTemplate[]>([]);
  batchResponse = signal<BatchGenerateResponse | null>(null);
  jobCount = signal(2);

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
    const filename =
      result.filename ?? generateResumeFilename(this.userState.currentUser()?.fullName ?? '', job.jobPosition ?? '');

    // Snapshot replays from the `/status` endpoint do NOT include `pdfContent`
    // (only the live `job_completed` SSE event does), so fall back to fetching
    // the PDF from the backend by `resumeGenerationId`. Without this the
    // download button silently no-ops on reconnect/replay paths.
    if (result.pdfContent) {
      this.downloader.downloadFromBase64(
        result.pdfContent,
        filename,
        'application/pdf',
      );
      return;
    }

    if (result.resumeGenerationId) {
      this.resumeService
        .downloadResumeById(result.resumeGenerationId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (blob) => this.downloader.download(blob, filename),
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

  onRetry(_job: BatchJobLiveState): void {
    this.snackbar.showError(
      'Retry not yet available — please re-run via Tailor Another Set.',
    );
  }

  onTailorAnother(): void {
    this.batchResponse.set(null);
    this.step.set('input');
    this.flow.reset();
  }

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
