import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { NgClass } from '@angular/common';
// Components
import { InputFieldComponent } from '@shared/components/ui/input-field/input-field.component';
// Services
import { SnackbarService } from '@shared/services/snackbar.service';
import { ATSService } from '@features/ats-scoring/services/ats.service';
// States
import { UserState } from '@core/states/user.state';
// Models
import { UploadedResume } from '@core/models/user/uploaded-resumes.model';
import { ATSMatchScore } from '@features/ats-scoring/models/ats-match-score.model';
//Enums
import { AllowedFileType } from '@core/enums/allowed-file-type.enum';
import { Messages } from '@core/enums/messages.enum';
// Constants
import { ATSScoreRatingService } from '@features/ats-scoring/constants/ats-score-rating-config.constant';

@Component({
  selector: 'app-ats-scoring-modal',
  standalone: true,
  imports: [NgClass, FormsModule, ReactiveFormsModule, InputFieldComponent],
  templateUrl: './ats-scoring-modal.component.html',
  styleUrl: './ats-scoring-modal.component.scss'
})
export class AtsScoringModalComponent {

  // Inject dependencies
  private dialogRef = inject(MatDialogRef<AtsScoringModalComponent>);
  private snackbarService = inject(SnackbarService);
  private atsService = inject(ATSService);
  private formbuilder = inject(FormBuilder);
  private userState = inject(UserState);

  // Form
  public atsResumeForm!: FormGroup;

  // Internal State
  public resumeFile = signal<File | null>(null);
  public isProcessing = signal<boolean>(false);
  public progress = signal<number>(0);
  public result = signal<ATSMatchScore | null>(null);
  public uploadedResumes = this.userState.uploadedResumes;
  public isPremiumUser = this.userState.isPremiumUser;
  protected readonly hasValidResumes = computed<boolean>(() => {
      console.log('uploadedResumes: ', this.uploadedResumes())
      return this.resumeFile() !== null || (this.isPremiumUser() && this.uploadedResumes().length > 0)
  });

  ngOnInit() {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.atsResumeForm = this.formbuilder.group({
      jobPosition: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      companyName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      jobDescription: ['', [Validators.required, Validators.minLength(20)]]
    });
  }

  get canAnalyze(): boolean {
    return !!((this.atsResumeForm.valid || this.hasValidResumes()) && this.atsResumeFormValue?.jobDescription?.trim().length > 20);
  }

  get atsResumeFormValue() {
    return this.atsResumeForm?.value;
  }

  /**
   * Get formatted score rating message for display
   * Clean, maintainable approach using configuration mapping
   */
  get scoreRatingMessage(): string {
    if (!this.result()) return '';

    const ratingConfig = ATSScoreRatingService.getRatingConfig(this.result()?.score ?? 0);
    return `${ratingConfig.emoji} ${ratingConfig.rating}`;
  }

  /**
   * Get CSS class for score rating
   */
  get scoreRatingClass(): string {
    return ATSScoreRatingService.getRatingConfig(this.result()?.score ?? 0)?.className;
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

  public async handleAnalyze(): Promise<void> {
    if (!this.validateInputs()) return;

    this.startProcessing();

    await this.simulateProgress([30, 60,], 700);

    this.getAtsScore();
  }

  private getAtsScore(): void {
      this.atsService.generateATSMatchScore(this.buildRequestPayload()).subscribe({
      next: async (response) => {
        await this.simulateProgress([85, 100], 700);
        this.stopProcessing();
        if (response?.score && response?.details) {
          this.result.set(response);
        }
      },
      error: (error) => {
        console.log(error);
        this.snackbarService.showError(Messages.ERROR_UPLOADING_RESUME);
        this.stopProcessing();
      }
    })
  }

  private buildRequestPayload(): FormData {
    const formData = new FormData();
    formData.append('jobPosition', this.atsResumeFormValue?.jobPosition);
    formData.append('companyName', this.atsResumeFormValue?.companyName);
    formData.append('jobDescription', this.atsResumeFormValue?.jobDescription);
    if (!this.isPremiumUser() || !this.uploadedResumes()?.length) {
      formData.append('resumeFile', this.resumeFile()!);
    }
    return formData;
  }

  private validateInputs(): boolean {

    if (this.atsResumeForm.invalid) {
      this.atsResumeForm.markAllAsTouched();
      return false;
    }

    if (!this.hasValidResumes()) {
      this.snackbarService.showWarning(Messages.PLEASE_UPLOAD_A_RESUME_FILE);
      return false;
    }
    if (!this.atsResumeFormValue?.jobDescription?.trim()) {
      this.snackbarService.showWarning(Messages.PLEASE_ADD_A_JOB_DESCRIPTION);
      return false;
    }
    return true;
  }

  private startProcessing() {
    this.isProcessing.set(true);
    this.progress.set(0);
  }

  private async simulateProgress(intervals: number[], delay: number) {
    for (const target of intervals) {
      await new Promise(resolve => setTimeout(resolve, delay));
      this.progress.set(target);
    }
  }

  private stopProcessing(): void {
    this.isProcessing.set(false);
  }

  public resetForm(): void {
    this.resumeFile.set(null);
    this.result.set(null);
    this.isProcessing.set(false);
    this.progress.set(0);
    this.atsResumeForm.reset();
  }

  public closeModal(): void {
    this.dialogRef.close();
  }
}
