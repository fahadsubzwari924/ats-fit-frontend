import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ResumeService } from '@shared/services/resume.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { TailoredResume } from '@features/resume-tailoring/models/tailored-resume.model';
import {
  JobRelevanceEngine,
  JobRelevanceResult,
  JobRelevanceSkipReason,
  JobRelevanceVerdict,
} from '@features/resume-tailoring/models/job-relevance.model';
import { TailorApplyStep } from './models/tailor-apply-form.model';
import { TailoringModalCloseResult } from './models/tailoring-modal-close-result.model';
import { StepJobDetailsComponent } from './components/step-job-details/step-job-details.component';
import { StepTemplateSelectComponent } from './components/step-template-select/step-template-select.component';
import { StepJobFitWarningComponent } from './components/step-job-fit-warning/step-job-fit-warning.component';
import { StepResultsComponent } from './components/step-results/step-results.component';
import { Messages } from '@core/enums/messages.enum';
import { QuotaAlertBannerComponent } from '@shared/components/quota-alert-banner/quota-alert-banner.component';
import { FeatureType } from '@core/enums/feature-type.enum';
import { QuotaState } from '@core/states/quota.state';

@Component({
  selector: 'app-tailor-apply-modal',
  standalone: true,
  imports: [
    NgClass,
    StepJobDetailsComponent,
    StepTemplateSelectComponent,
    StepJobFitWarningComponent,
    StepResultsComponent,
    QuotaAlertBannerComponent,
    MatTooltipModule,
  ],
  templateUrl: './tailor-apply-modal.component.html',
  styleUrl: './tailor-apply-modal.component.scss',
})
export class TailorApplyModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly resumeService = inject(ResumeService);
  private readonly snackbar = inject(SnackbarService);
  private readonly quotaState = inject(QuotaState);
  readonly dialogRef = inject(MatDialogRef<TailorApplyModalComponent>);

  protected readonly TAILOR_FEATURES: FeatureType[] = [FeatureType.RESUME_GENERATION];
  readonly isTailorQuotaExhausted = computed(() =>
    this.quotaState.firstExhausted(this.TAILOR_FEATURES)() !== null
  );

  form!: FormGroup;
  /**
   * Step ordering (post-refactor):
   *   1 = Job Details
   *   2 = Job Fit (relevance breakdown, shown after lightweight /relevance call)
   *   3 = Template Select (+ heavy Generate CTA)
   *   4 = Results
   */
  currentStep = signal<TailorApplyStep>(1);
  isProcessing = signal(false);
  progress = signal(0);
  tailoredResume = signal<TailoredResume | null>(null);
  pendingRelevance = signal<JobRelevanceResult | null>(null);

  /**
   * True when the BE rejected the standalone /relevance call with 403 (quota
   * exhausted via @RateLimitFeature) OR returned the UNAVAILABLE sentinel
   * with `unavailableReason: 'quota_exhausted'` (only the orchestrator path
   * uses this — kept for symmetry). When true, the Job Fit step is skipped
   * entirely and an inline banner explains the graceful degradation on the
   * Template step. Tailoring itself stays available — the user's tailoring
   * quota is independent.
   */
  jobFitQuotaExhausted = signal(false);

  readonly STEP_LABELS = ['', 'Job Details', 'Job Fit', 'Template', 'Results'];

  ngOnInit(): void {
    this.form = this.fb.group({
      jobPosition: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      companyName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      jobDescription: ['', [Validators.required, Validators.minLength(20)]],
      selectedTemplate: ['', [Validators.required]],
    });

    this.resumeService.getResumeTemplates().subscribe();
  }

  goToStep(step: TailorApplyStep): void {
    if (step < this.currentStep()) {
      this.currentStep.set(step);
    }
  }

  /**
   * Called when the user finishes Job Details (step 1) and clicks Check Job
   * Fit. Triggers the cheap /relevance endpoint (no quota, no PDF) and
   * advances to step 2 with the breakdown ready to display.
   */
  async onCheckRelevance(): Promise<void> {
    this.isProcessing.set(true);
    this.progress.set(0);
    this.simulateProgress([35, 70]);
    this.resumeService.checkJobRelevance(this.buildRelevancePayload()).subscribe({
      next: async (relevance) => {
        this.simulateProgress([90, 100]);
        await new Promise((r) => setTimeout(r, 350));
        this.isProcessing.set(false);
        this.progress.set(0);

        // BE returns an UNAVAILABLE sentinel when scoring couldn't run
        // (feature disabled, no profile, empty profile, quota exhausted).
        if (relevance.verdict === JobRelevanceVerdict.UNAVAILABLE) {
          // Quota-exhausted is a graceful-degradation case: skip the Job Fit
          // step entirely and proceed to Template. Tailoring is independent
          // and still available — the user's tailoring quota is untouched.
          if (relevance.unavailableReason === JobRelevanceSkipReason.QUOTA_EXHAUSTED) {
            this.jobFitQuotaExhausted.set(true);
            this.currentStep.set(3);
            return;
          }
          // Other unavailable reasons (no profile, empty profile, feature
          // disabled) keep the user on step 1 with a targeted warning —
          // moving to step 2 would render a meaningless 0/MISMATCH breakdown.
          this.snackbar.showWarning(
            this.mapJobFitUnavailableMessage(relevance.unavailableReason),
          );
          return;
        }

        this.pendingRelevance.set(relevance);
        this.currentStep.set(2);

        // Decrement the local Job Fit quota optimistically so the dashboard
        // hero + billing usage card update without a page refresh. Only
        // fires for `engine === 'llm'` — cache hits and fast-path skips
        // don't burn quota on the BE (see JobRelevanceService.score:
        // recordUsage is gated on engine === LLM), so an optimistic
        // decrement would briefly show a false +1 before the silent
        // /users/me refresh reverts it. QuotaState handles the refresh
        // internally; we just need to nudge it.
        if (relevance.engine === JobRelevanceEngine.LLM) {
          this.quotaState.notifyFeatureConsumed(
            FeatureType.JOB_RELEVANCE_SCORE,
          );
        }
      },
      error: (err) => {
        this.isProcessing.set(false);
        this.progress.set(0);
        // Standalone /relevance endpoint returns 403 via @RateLimitFeature
        // when the user has exhausted their JOB_RELEVANCE_SCORE quota for
        // the month. Treat this as the graceful-degradation case (skip Job
        // Fit, advance to Template). The banner on step 3 explains why.
        if (err?.status === 403) {
          this.jobFitQuotaExhausted.set(true);
          this.currentStep.set(3);
          return;
        }
        this.snackbar.showError(err?.error?.message ?? Messages.ERROR_UPLOADING_RESUME);
      },
    });
  }

  /**
   * Maps the BE-supplied skip reason to a user-facing message. Keeps the
   * mapping in one place so the modal HTML stays free of switch logic and
   * future reasons land here without touching the call sites.
   */
  private mapJobFitUnavailableMessage(
    reason: JobRelevanceSkipReason | undefined,
  ): string {
    switch (reason) {
      case JobRelevanceSkipReason.NO_PROFILE:
        return Messages.JOB_FIT_UNAVAILABLE_NO_PROFILE;
      case JobRelevanceSkipReason.EMPTY_PROFILE:
        return Messages.JOB_FIT_UNAVAILABLE_EMPTY_PROFILE;
      case JobRelevanceSkipReason.FEATURE_DISABLED:
        return Messages.JOB_FIT_UNAVAILABLE_FEATURE_DISABLED;
      case JobRelevanceSkipReason.QUOTA_EXHAUSTED:
        return Messages.JOB_FIT_UNAVAILABLE_QUOTA_EXHAUSTED;
      default:
        return Messages.JOB_FIT_UNAVAILABLE_DEFAULT;
    }
  }

  /** Step 2 (Job Fit) → step 3 (Template). No API call. */
  onContinueToTemplate(): void {
    this.currentStep.set(3);
  }

  /** Step 2 → step 1 (let the user revise the JD). */
  onBackToDetails(): void {
    // Clear the graceful-skip flag when the user returns to Job Details —
    // a new JD may succeed (e.g., quota reset, different cached state).
    this.jobFitQuotaExhausted.set(false);
    this.currentStep.set(1);
  }

  /**
   * Called when the user picks a template (step 3) and clicks Generate. This
   * is the heavy call: full tailoring pipeline, consumes quota. We always
   * send `acknowledgeLowFit=true` because the user has already seen the fit
   * breakdown on step 2 — no need for the backend to re-gate.
   */
  async onConfirmGenerate(): Promise<void> {
    this.isProcessing.set(true);
    this.progress.set(0);
    this.simulateProgress([20, 45]);
    this.resumeService.generateTailoredResume(this.buildGeneratePayload(true)).subscribe({
      next: async (outcome) => {
        if (outcome.kind === 'low_fit_warning') {
          // Defensive: shouldn't happen with acknowledgeLowFit=true. Bail out.
          this.isProcessing.set(false);
          this.progress.set(0);
          this.snackbar.showError('Resume generation was blocked by the server. Please retry.');
          return;
        }
        this.simulateProgress([75, 100]);
        await new Promise((r) => setTimeout(r, 600));
        this.isProcessing.set(false);
        outcome.resume.jobPosition = this.form.value.jobPosition ?? '';
        outcome.resume.companyName = this.form.value.companyName ?? '';
        this.tailoredResume.set(outcome.resume);
        this.currentStep.set(4);
        this.quotaState.notifyFeatureConsumed(FeatureType.RESUME_GENERATION);
      },
      error: (err) => {
        this.isProcessing.set(false);
        this.progress.set(0);
        this.snackbar.showError(err?.error?.message ?? Messages.ERROR_UPLOADING_RESUME);
      },
    });
  }

  /** Payload for /relevance — no template, no acknowledgement. */
  private buildRelevancePayload(): FormData {
    const fd = new FormData();
    const v = this.form.value;
    fd.append('jobPosition', v.jobPosition);
    fd.append('companyName', v.companyName);
    fd.append('jobDescription', v.jobDescription);
    return fd;
  }

  /** Payload for /generate — template + acknowledgement. */
  private buildGeneratePayload(acknowledgeLowFit = false): FormData {
    const fd = new FormData();
    const v = this.form.value;
    fd.append('jobPosition', v.jobPosition);
    fd.append('companyName', v.companyName);
    fd.append('jobDescription', v.jobDescription);
    fd.append('templateId', v.selectedTemplate);
    if (acknowledgeLowFit) {
      fd.append('acknowledgeLowFit', 'true');
    }
    return fd;
  }

  private async simulateProgress(targets: number[]): Promise<void> {
    for (const t of targets) {
      await new Promise((r) => setTimeout(r, 700));
      this.progress.set(t);
    }
  }

  onMinimize(): void {
    this.dialogRef.close(undefined);
  }

  onCreateAnother(): void {
    this.form.reset();
    this.tailoredResume.set(null);
    this.pendingRelevance.set(null);
    this.jobFitQuotaExhausted.set(false);
    this.isProcessing.set(false);
    this.progress.set(0);
    this.currentStep.set(1);
  }

  onAnswerQuestionsFirst(): void {
    const payload: TailoringModalCloseResult = { scrollToQuestions: true };
    this.dialogRef.close(payload);
  }

  closeModal(): void {
    const hasTailored = this.currentStep() === 4 && this.tailoredResume() !== null;
    const result: TailoringModalCloseResult | undefined = hasTailored
      ? { refreshDashboard: true, tailoringCompleted: true }
      : undefined;
    this.dialogRef.close(result);
  }
}
