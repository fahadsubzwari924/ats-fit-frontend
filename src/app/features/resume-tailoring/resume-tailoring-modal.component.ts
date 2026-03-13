import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
// Components
import { InputFieldComponent } from '@shared/components/ui/input-field/input-field.component';
// Services
import { ResumeService } from '@shared/services/resume.service';
import { SnackbarService } from '@shared/services/snackbar.service';
//States
import { ResumeState } from '@core/states/resume.state';
import { UserState } from '@core/states/user.state';
//Models
import { TailoredResume } from '@features/resume-tailoring/models/tailored-resume.model';
// Enums
import { AllowedFileType } from '@core/enums/allowed-file-type.enum';
import { Messages } from '@core/enums/messages.enum';
import { DownloadFileName } from '@core/enums/download-file-name.enum';
import { TemplateKey } from '@core/enums/template-key.enum';
// Others
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-resume-tailoring-modal',
  standalone: true,
  imports: [ReactiveFormsModule, NgClass, InputFieldComponent],
  templateUrl: './resume-tailoring-modal.component.html',
  styleUrl: './resume-tailoring-modal.component.scss',
})
export class ResumeTailoringModalComponent implements OnInit {
  // Inject dependencies
  private snackbarService = inject(SnackbarService);
  private resumeService = inject(ResumeService);
  private resumeState = inject(ResumeState);
  private formBuilder = inject(FormBuilder);
  public dialogRef = inject(MatDialogRef<ResumeTailoringModalComponent>);

  // State
  private userState = inject(UserState);

  // Form
  public resumeTailoringForm!: FormGroup;

  // Enums
  public TemplateKey = TemplateKey;

  // Component state variables
  public resumeFile = signal<File | null>(null);
  public isProcessing = signal<boolean>(false);
  public progress = signal<number>(0);
  public tailoredResume = signal<TailoredResume | null>(null);
  public templates = this.resumeState.templates;
  public uploadedResumes = this.userState.uploadedResumes;
  public isPremiumUser = this.userState.isPremiumUser;
  protected readonly hasValidResumes = computed<boolean>(
    () =>
      this.resumeFile() !== null ||
      (this.isPremiumUser() && this.uploadedResumes()?.length > 0)
  );

  ngOnInit() {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.resumeTailoringForm = this.formBuilder.group({
      jobPosition: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100),
        ],
      ],
      companyName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100),
        ],
      ],
      jobDescription: ['', [Validators.required, Validators.minLength(20)]],
      selectedTemplate: ['', [Validators.required]],
    });
  }

  // Form getters for easy access

  get selectedTemplate() {
    return this.resumeTailoringForm.get('selectedTemplate');
  }

  get jobDescription() {
    return this.resumeTailoringForm.get('jobDescription');
  }

  get jobDescriptionLength(): number {
    const jobDesc = this.jobDescription?.value || '';
    return jobDesc.length;
  }

  get canGenerateResume(): boolean {
    return !!(
      (this.resumeTailoringForm.valid || this.hasValidResumes()) &&
      this.jobDescriptionLength > 20
    );
  }

  public handleFileUpload(event: any): void {
    const file = event.target.files?.[0];

    if (!this.validateFile(file)) return;

    this.resumeFile.set(file);
  }

  private validateFile(file: File | null): boolean {
    if (!file) {
      this.snackbarService.showWarning(Messages.PLEASE_UPLOAD_A_RESUME_FILE);
      return false;
    }
    if (file.type !== AllowedFileType.PDF) {
      this.snackbarService.showWarning(Messages.PLEASE_UPLOAD_A_PDF_FILE);
      return false;
    }
    return true;
  }

  public handleTemplateSelection(templateId: string): void {
    this.selectedTemplate?.setValue(templateId);
  }

  public async handleGenerate(): Promise<void> {
    // Validate form before proceeding
    if (!this.validateForm()) {
      return;
    }
    this.isProcessing.set(true);
    this.progress.set(0);

    this.intializeProcessing([25, 50]);
    this.generateTailoredResume();
  }

  private validateForm(): boolean {
    if (this.resumeTailoringForm.invalid) {
      this.resumeTailoringForm.markAllAsTouched();
      return false;
    }

    if (!this.hasValidResumes()) {
      this.snackbarService.showWarning(Messages.PLEASE_UPLOAD_A_RESUME_FILE);
      return false;
    }

    if (!this.jobDescription?.value?.trim()) {
      this.snackbarService.showWarning(Messages.PLEASE_ADD_A_JOB_DESCRIPTION);
      return false;
    }

    return true;
  }

  private generateTailoredResume() {
    this.resumeService
      .generateTailoredResume(this.buildRequestPayload())
      .subscribe({
        next: async (response) => {
          this.snackbarService.showSuccess(
            Messages.RESUME_UPLOADED_SUCCESSFULLY
          );
          this.intializeProcessing([75, 100]);
          this.isProcessing.set(false);
          this.tailoredResume.set(response);
        },
        error: (error) => {
          console.log(error);
          this.snackbarService.showError(Messages.ERROR_UPLOADING_RESUME);
          this.isProcessing.set(false);
        },
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
    formData.append('templateId', formValues?.selectedTemplate);
    if (!this.isPremiumUser() || !this.uploadedResumes()?.length) {
      formData.append('resumeFile', this.resumeFile()!);
    }

    return formData;
  }

  private async intializeProcessing(progressPercentage: number[]) {
    for (const target of progressPercentage) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      this.progress.set(target);
    }
  }

  public downloadResume(): void {
    if (!this.tailoredResume()) {
      this.snackbarService.showWarning(Messages.NO_RESUME_AVAILABLE);
      return;
    }

    saveAs(this.tailoredResume()!.blob, DownloadFileName.TAILORED_RESUME);
  }

  public resetForm(): void {
    this.resumeTailoringForm.reset();
    this.tailoredResume.set(null);
    this.resumeFile.set(null);
    this.isProcessing.set(false);
    this.progress.set(0);
  }

  public closeModal(): void {
    this.dialogRef.close();
  }
}
