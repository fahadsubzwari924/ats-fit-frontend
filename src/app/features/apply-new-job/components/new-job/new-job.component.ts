import { Component, inject, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
// Components
import { ButtonComponent } from '@shared/components/ui/button/button.component';
// Services
import { SnackbarService } from '@shared/services/snackbar.service';
import { ATSService } from '@features/ats-scoring/services/ats.service';
// States
import { ResumeState } from '@core/states/resume.state';
// Models
import { ATSMatchScore } from '@features/ats-scoring/models/ats-match-score.model';
import { ATSRequestForm } from '@features/ats-scoring/types/ats-request-form.type';

@Component({
  selector: 'app-new-job',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ButtonComponent
  ],
  templateUrl: './new-job.component.html',
  styleUrl: './new-job.component.scss'
})
export class NewJobComponent {

  // Inject dependencies
  private snackbarService = inject(SnackbarService);
  private atsService = inject(ATSService);
  private formbuilder = inject(FormBuilder);
  private resumeState = inject(ResumeState);

  // Emitters
  onTailorResumeClick = output<void>();
  onTrackJobClick = output<void>();

  // Form Group
  public atsForm!: FormGroup;

  // Internal States
  public isProcessing = signal<boolean>(false);
  public progress = signal<number>(0);
  public atsMatch = signal<ATSMatchScore | null>(null);

  ngOnInit() {
    this.initializeAtsForm();
  }

  private initializeAtsForm(): void {
    this.atsForm = this.formbuilder.group({
      jobPosition: ['', [Validators.required, Validators.minLength(2)], Validators.maxLength(100)],
      companyName: ['', [Validators.required, Validators.minLength(2)], Validators.maxLength(100)],
      jobDescription: ['', [Validators.required, Validators.minLength(20), Validators.minLength(1000)]],
      atsScore: ['']
    });
  }

  get controls() {
    return this.atsForm.controls;
  }

  public async handleAnalyze(): Promise<void> {
    this.startProcessing();
    // Simulate an API call
    await this.simulateProgress([25, 50], 1000);
    this.atsService.generateATSMatchScore(this.buildRequestPayload()).subscribe({
      next: async (response) => {
        if (response?.score && response?.details) {
          this.atsMatch.set(response);
        }
        await this.simulateProgress([75, 100], 1000);
      },
      error: (error) => {
        this.snackbarService.showError(error);
        this.resetForm();
      },
      complete: () => {
        this.stopProcessing();
      }
    });
  }

  private buildRequestPayload(): FormData {
    const formData = new FormData();
    const data = this.atsForm.value
    formData.append('jobPosition', data?.jobPosition);
    formData.append('companyName', data?.companyName);
    formData.append('jobDescription', data?.jobDescription);
    /**
     * TODO: Future Improvements
     * - Need to remove below line after resume selection handled on BE
    */
    formData.append('resumeFile', this.resumeFile()!);
    return formData;
  }

  /**
   * TODO: Future Improvements
   * - Need to remove "resumeFile" below line after resume selection handled on BE
   * - Need to remove "handleFileUpload" below line after resume selection handled on BE
  */
  resumeFile = signal<File | null>(null);

  public handleFileUpload(event: any): void {
    const file = event.target.files?.[0];
    this.resumeFile.set(file);
    this.resumeState.setResumeFile(file);
  }

  private startProcessing(): void {
    this.isProcessing.set(true);
    this.progress.set(0);
  }

  private async simulateProgress(intervals: number[], delay: number): Promise<void> {
    for (const target of intervals) {
      await new Promise(resolve => setTimeout(resolve, delay));
      this.progress.set(target);
    }
  }

  private stopProcessing(): void {
    this.isProcessing.set(false);
  }

  public handleTailorResume(): void {
    this.resumeState.setAtsMatchScore(this.atsMatch()!);
    this.resumeState.setNewJobAtsFormValues(this.buildEmitData());
    this.onTailorResumeClick.emit();
    this.resetForm();
  }

  public handleTrackJob(): void {
    this.resumeState.setAtsMatchScore(this.atsMatch()!);
    this.resumeState.setNewJobAtsFormValues(this.buildEmitData());
    this.onTrackJobClick.emit();
    this.resetForm();
  }

  private buildEmitData(): ATSRequestForm {
    return {
      jobPosition: this.atsForm.value.jobPosition,
      companyName: this.atsForm.value.companyName,
      jobDescription: this.atsForm.value.jobDescription,
      atsScore: this.atsMatch()?.score as number,
      atsMatchHistoryId: this.atsMatch()?.atsMatchHistoryId as string
    };
  }

  public resetForm(): void {
    this.atsForm.reset();
    this.atsMatch.set(null);
    this.isProcessing.set(false);
    this.progress.set(0);
  }

}
