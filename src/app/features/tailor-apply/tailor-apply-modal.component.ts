import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ResumeService } from '@shared/services/resume.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { JobService } from '@features/apply-new-job/services/job.service';
import { JobApplicationCreatePayload } from '@features/apply-new-job/models/job-application-create-payload.model';
import { TailoredResume } from '@features/resume-tailoring/models/tailored-resume.model';
import { JobRelevanceResult } from '@features/resume-tailoring/models/job-relevance.model';
import { TailorApplyStep } from './models/tailor-apply-form.model';
import { TailoringModalCloseResult } from './models/tailoring-modal-close-result.model';
import { StepJobDetailsComponent } from './components/step-job-details/step-job-details.component';
import { StepTemplateSelectComponent } from './components/step-template-select/step-template-select.component';
import { StepJobFitWarningComponent } from './components/step-job-fit-warning/step-job-fit-warning.component';
import { StepResultsComponent } from './components/step-results/step-results.component';
import { Messages } from '@core/enums/messages.enum';
import { trackedApplicationAppliedAtIso } from '@features/applications/lib/date-input-helpers';
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
  private readonly jobService = inject(JobService);
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
        this.pendingRelevance.set(relevance);
        this.currentStep.set(2);
      },
      error: (err) => {
        this.isProcessing.set(false);
        this.progress.set(0);
        this.snackbar.showError(err?.error?.message ?? Messages.ERROR_UPLOADING_RESUME);
      },
    });
  }

  /** Step 2 (Job Fit) → step 3 (Template). No API call. */
  onContinueToTemplate(): void {
    this.currentStep.set(3);
  }

  /** Step 2 → step 1 (let the user revise the JD). */
  onBackToDetails(): void {
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
    // If the user hadn't yet tracked the previous tailoring (e.g. they clicked
    // "Create Another" directly without using Done), record it now so the
    // application isn't silently dropped on reset.
    if (this.tailoredResume() !== null && !this.appTracked) {
      this.fireTrackingInBackground();
    }
    this.form.reset();
    this.tailoredResume.set(null);
    this.pendingRelevance.set(null);
    this.isProcessing.set(false);
    this.progress.set(0);
    this.appTracked = false;
    this.currentStep.set(1);
  }

  onAnswerQuestionsFirst(): void {
    const payload: TailoringModalCloseResult = { scrollToQuestions: true };
    this.dialogRef.close(payload);
  }

  /**
   * Marks whether the current tailored resume has already been recorded as a
   * job application — set by `onTrackApplication(true)` after a successful
   * `applyNewJobs` call. Guards `closeModal()` from double-tracking when the
   * user clicks the X icon after already clicking Done.
   */
  private appTracked = false;

  onTrackApplication(track: boolean): void {
    const afterTailorClose: TailoringModalCloseResult = {
      refreshDashboard: true,
      tailoringCompleted: true,
    };
    if (!track) {
      this.dialogRef.close(afterTailorClose);
      return;
    }
    const payload = this.buildTrackingPayload();
    if (!payload) {
      this.dialogRef.close(afterTailorClose);
      return;
    }
    this.jobService.applyNewJobs(payload).subscribe({
      next: () => {
        this.appTracked = true;
        this.dialogRef.close(afterTailorClose);
      },
      error: (err) => {
        this.snackbar.showError(this.trackApplicationErrorMessage(err));
        this.dialogRef.close(afterTailorClose);
      },
    });
  }

  private buildTrackingPayload(): JobApplicationCreatePayload | null {
    const resume = this.tailoredResume();
    if (!resume) return null;
    const v = this.form.value;
    return {
      application_source: 'tailored_resume',
      company_name: v.companyName,
      job_position: v.jobPosition,
      job_description: v.jobDescription,
      applied_at: trackedApplicationAppliedAtIso(),
      resume_generation_id: resume.resumeGenerationId,
    };
  }

  /**
   * Fire-and-forget tracking used when the user dismisses the modal via the
   * X icon. The modal closes immediately; the application record is created
   * in the background. Errors are swallowed because there's no longer a UI
   * surface to show them on — the dashboard refresh that follows will
   * reflect whether the call landed.
   */
  private fireTrackingInBackground(): void {
    const payload = this.buildTrackingPayload();
    if (!payload) return;
    this.jobService.applyNewJobs(payload).subscribe({
      error: () => undefined,
    });
  }

  private trackApplicationErrorMessage(err: unknown): string {
    const message = (err as { error?: { message?: string | string[] } })?.error?.message;
    if (Array.isArray(message)) {
      return message.filter(Boolean).join(', ');
    }
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
    return 'Could not save application to tracker.';
  }

  closeModal(): void {
    const hasTailored = this.currentStep() === 4 && this.tailoredResume() !== null;
    if (hasTailored && !this.appTracked) {
      // Default policy: every successful tailor counts as a job application.
      // Even when the user dismisses via the X icon (rather than the explicit
      // Done button), record the application in the background so the
      // dashboard accurately reflects what was tailored.
      this.fireTrackingInBackground();
    }
    const result: TailoringModalCloseResult | undefined = hasTailored
      ? { refreshDashboard: true, tailoringCompleted: true }
      : undefined;
    this.dialogRef.close(result);
  }
}
