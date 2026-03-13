import { Component, inject, signal } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
// Components
import { ResumeTailoreComponent } from '@features/apply-new-job/components/resume-tailore/resume-tailore.component';
import { NewJobComponent } from '@features/apply-new-job/components/new-job/new-job.component';
// Services
import { JobService } from '@features/apply-new-job/services/job.service';
import { SnackbarService } from '@shared/services/snackbar.service';
// States
import { ResumeState } from '@core/states/resume.state';
// Enums
import { ApplicationSource } from '@features/apply-new-job/enums/application-source.enum';

@Component({
  selector: 'app-apply-new-job-modal',
  imports: [
    ResumeTailoreComponent,
    NewJobComponent
  ],
  templateUrl: './apply-new-job-modal.component.html',
  styleUrl: './apply-new-job-modal.component.scss'
})
export class ApplyNewJobModalComponent {

  // Inject dependencies
  private _dialogRef = inject(MatDialogRef<ApplyNewJobModalComponent>);
  private formbuilder = inject(FormBuilder);
  private jobService = inject(JobService);
  private snackbarService = inject(SnackbarService);

  // State
  private resumeState = inject(ResumeState);

  // Internal States
  public showResumeTailoreSection = signal<boolean>(false);

  // form
  public jobForm!: FormGroup;

  ngOnInit() {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.jobForm = this.formbuilder.group({
      application_source: [ApplicationSource.DIRECT_APPLY, [Validators.required, Validators.minLength(2)]],
      company_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      job_position: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      job_description: ['', [Validators.required, Validators.minLength(20)]],
      ats_match_history_id: [null],
      resume_generation_id: [null],
      ats_score: ['']
    });
  }

  public handleResumeTailoring(): void {
    this.populateForm();
    this.showResumeTailoreSection.set(true);
  }

  public handleTrackJobClick(): void {
    this.populateForm();
    this.applyNewJob();
    this.showResumeTailoreSection.set(false);
  }

  public handleApplyNewJob(): void {
    this.populateForm();
    this.applyNewJob();
    this.showResumeTailoreSection.set(false);
  }

  public handleDoneClick(): void {
    this.populateForm(ApplicationSource.TAILORED_RESUME);
    this.applyNewJob();
    this.closeModal();
  }

  public closeModal(): void {
    this.resumeState.resetState();
    this._dialogRef.close();
  }

  private applyNewJob() {
    this.jobService.applyNewJobs(this.jobForm.value).subscribe({
      next: () => {
        this.closeModal();
      },
      error: (error) => {
        this.snackbarService.showError(error?.message || error?.error?.message);
        console.error('Error applying for job:', error);
      }
    });
  }

  private populateForm(applicationSource?: ApplicationSource): void {
    this.jobForm.patchValue({
      application_source: applicationSource ?? ApplicationSource.DIRECT_APPLY,
      company_name: this.resumeState.newJobAtsFormValues()?.companyName,
      job_position: this.resumeState.newJobAtsFormValues()?.jobPosition,
      job_description: this.resumeState.newJobAtsFormValues()?.jobDescription,
      ats_match_history_id: this.resumeState.newJobAtsFormValues()?.atsMatchHistoryId,
      ats_score: this.resumeState.newJobAtsFormValues()?.atsScore,
      resume_generation_id: this.resumeState.tailoredResume()?.resumeGenerationId || null
    });
  }


}
