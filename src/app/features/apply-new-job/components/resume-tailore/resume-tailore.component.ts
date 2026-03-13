import { NgClass } from '@angular/common';
import { Component, inject, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
// Services
import { ResumeService } from '@shared/services/resume.service';
import { SnackbarService } from '@shared/services/snackbar.service';
// States
import { ResumeState } from '@core/states/resume.state';
// Enums
import { Messages } from '@core/enums/messages.enum';
import { DownloadFileName } from '@core/enums/download-file-name.enum';
// Models
import { ATSMatchScore } from '@features/ats-scoring/models/ats-match-score.model';
import { ResumeTemplate } from '@features/resume-tailoring/models/resume-template.model';
import { TailoredResume } from '@features/resume-tailoring/models/tailored-resume.model';
// Others
import saveAs from 'file-saver';

@Component({
  selector: 'app-resume-tailore',
  imports: [NgClass],
  templateUrl: './resume-tailore.component.html',
  styleUrl: './resume-tailore.component.scss',
})
export class ResumeTailoreComponent {
  // Injections
  private resumeService = inject(ResumeService);
  private formBuilder = inject(FormBuilder);
  private snackbarService = inject(SnackbarService);

  // State
  private resumeState = inject(ResumeState);

  // Emitters
  public onBackClick = output<void>();
  public onDoneClick = output<void>();

  // Internal States
  public isProcessing = signal<boolean>(false);
  public progress = signal<number>(0);

  // Use cached templates from state (which gets from service)
  public templates = this.resumeState.templates;

  public tailoredResume = signal<TailoredResume | null>(null);
  public atsMatch = signal<ATSMatchScore | null>(
    this.resumeState.atsMatchScore()
  );

  // Form
  resumeTailoringForm!: FormGroup;

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.resumeTailoringForm = this.formBuilder.group({
      jobPosition: [
        this.resumeState.newJobAtsFormValues()?.jobPosition,
        [Validators.required, Validators.minLength(2)],
      ],
      companyName: [
        this.resumeState.newJobAtsFormValues()?.companyName,
        [Validators.required, Validators.minLength(2)],
      ],
      jobDescription: [
        this.resumeState.newJobAtsFormValues()?.jobDescription,
        [Validators.required, Validators.minLength(20)],
      ],
      templateId: [null, [Validators.required]],
    });
  }

  private buildRequestPayload(): FormData {
    // Create FormData for file upload with form fields
    const formData = new FormData();
    const formValues = this.resumeTailoringForm.value;

    // Add all form fields to FormData
    formData.append('jobPosition', formValues?.jobPosition);
    formData.append('companyName', formValues?.companyName);
    formData.append('jobDescription', formValues?.jobDescription);
    formData.append('templateId', formValues?.templateId);
    /**
     * TODO: Future Improvements
     * - Need to remove below line after resume selection handled on BE
     */
    formData.append('resumeFile', this.resumeState.resumeFile()!);

    return formData;
  }

  public async handleGenerateResume(): Promise<void> {
    this.startProcessing();
    // Simulate an API call
    await this.simulateProgress([25, 50], 1000);

    this.resumeService
      .generateTailoredResume(this.buildRequestPayload())
      .subscribe({
        next: async (response) => {
          await this.simulateProgress([75, 100], 1000);
          this.stopProcessing();
          this.tailoredResume.set(response);
          this.resumeState.setTailoredResume(response);
        },
        error: (error) => {
          console.log(error);
          this.snackbarService.showError(Messages.ERROR_UPLOADING_RESUME);
          this.stopProcessing();
        },
      });
  }

  public handleTemplateSelection(template: ResumeTemplate): void {
    this.resumeTailoringForm.get('templateId')?.setValue(template.id);
  }

  public handleBackClick(): void {
    this.onBackClick.emit();
  }

  public handleDownload(): void {
    if (!this.tailoredResume()) {
      this.snackbarService.showWarning(Messages.NO_RESUME_AVAILABLE);
      return;
    }

    saveAs(this.tailoredResume()!.blob, DownloadFileName.TAILORED_RESUME);
  }

  public handleDoneClick(): void {
    this.onDoneClick.emit();
  }

  private startProcessing(): void {
    this.isProcessing.set(true);
    this.progress.set(0);
  }

  private async simulateProgress(
    intervals: number[],
    delay: number
  ): Promise<void> {
    for (const target of intervals) {
      new Promise((resolve) => setTimeout(resolve, delay));
      this.progress.set(target);
    }
  }

  private stopProcessing(): void {
    this.isProcessing.set(false);
  }
}
