import { Component, inject, OnInit, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { ResumeService } from '@shared/services/resume.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { JobService } from '@features/apply-new-job/services/job.service';
import { JobApplicationCreatePayload } from '@features/apply-new-job/models/job-application-create-payload.model';
import { TailoredResume } from '@features/resume-tailoring/models/tailored-resume.model';
import { TailorApplyStep } from './models/tailor-apply-form.model';
import { TailoringModalCloseResult } from './models/tailoring-modal-close-result.model';
import { StepJobDetailsComponent } from './components/step-job-details/step-job-details.component';
import { StepResumeSourceComponent } from './components/step-resume-source/step-resume-source.component';
import { StepTemplateSelectComponent } from './components/step-template-select/step-template-select.component';
import { StepResultsComponent } from './components/step-results/step-results.component';
import { Messages } from '@core/enums/messages.enum';
import { trackedApplicationAppliedAtIso } from '@features/applications/lib/date-input-helpers';

@Component({
  selector: 'app-tailor-apply-modal',
  standalone: true,
  imports: [
    NgClass,
    StepJobDetailsComponent,
    StepResumeSourceComponent,
    StepTemplateSelectComponent,
    StepResultsComponent,
  ],
  templateUrl: './tailor-apply-modal.component.html',
  styleUrl: './tailor-apply-modal.component.scss',
})
export class TailorApplyModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly resumeService = inject(ResumeService);
  private readonly snackbar = inject(SnackbarService);
  private readonly jobService = inject(JobService);
  readonly dialogRef = inject(MatDialogRef<TailorApplyModalComponent>);

  form!: FormGroup;
  currentStep = signal<TailorApplyStep>(1);
  isProcessing = signal(false);
  progress = signal(0);
  tailoredResume = signal<TailoredResume | null>(null);

  readonly STEP_LABELS = ['', 'Job Details', 'Resume', 'Generate', 'Results'];

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

  onNext(): void {
    const next = (this.currentStep() + 1) as TailorApplyStep;
    if (next <= 4) this.currentStep.set(next);
  }

  async onGenerate(): Promise<void> {
    this.isProcessing.set(true);
    this.progress.set(0);
    this.simulateProgress([20, 45]);
    this.resumeService.generateTailoredResume(this.buildPayload()).subscribe({
      next: async (resume) => {
        this.simulateProgress([75, 100]);
        await new Promise((r) => setTimeout(r, 600));
        this.isProcessing.set(false);
        this.tailoredResume.set(resume);
        this.currentStep.set(4);
      },
      error: (err) => {
        this.isProcessing.set(false);
        this.progress.set(0);
        this.snackbar.showError(err?.error?.message ?? Messages.ERROR_UPLOADING_RESUME);
      },
    });
  }

  private buildPayload(): FormData {
    const fd = new FormData();
    const v = this.form.value;
    fd.append('jobPosition', v.jobPosition);
    fd.append('companyName', v.companyName);
    fd.append('jobDescription', v.jobDescription);
    fd.append('templateId', v.selectedTemplate);
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
    this.isProcessing.set(false);
    this.progress.set(0);
    this.currentStep.set(1);
  }

  onAnswerQuestionsFirst(): void {
    const payload: TailoringModalCloseResult = { scrollToQuestions: true };
    this.dialogRef.close(payload);
  }

  onTrackApplication(track: boolean): void {
    const afterTailorClose: TailoringModalCloseResult = {
      refreshDashboard: true,
      tailoringCompleted: true,
    };
    if (!track) {
      this.dialogRef.close(afterTailorClose);
      return;
    }
    const resume = this.tailoredResume();
    const v = this.form.value;
    const payload: JobApplicationCreatePayload = {
      application_source: 'tailored_resume',
      company_name: v.companyName,
      job_position: v.jobPosition,
      job_description: v.jobDescription,
      applied_at: trackedApplicationAppliedAtIso(),
      resume_generation_id: resume?.resumeGenerationId,
    };
    this.jobService.applyNewJobs(payload).subscribe({
      next: () => {
        this.snackbar.showSuccess('Application tracked!');
        this.dialogRef.close(afterTailorClose);
      },
      error: (err) => {
        this.snackbar.showError(this.trackApplicationErrorMessage(err));
        this.dialogRef.close(afterTailorClose);
      },
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
    const result: TailoringModalCloseResult | undefined = hasTailored
      ? { refreshDashboard: true, tailoringCompleted: true }
      : undefined;
    this.dialogRef.close(result);
  }
}
