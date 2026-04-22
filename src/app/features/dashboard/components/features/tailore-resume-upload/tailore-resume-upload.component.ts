import { Component, effect, inject, signal, OnDestroy } from '@angular/core';
import { Messages } from '@core/enums/messages.enum';
import { ResponseStatus } from '@core/enums/response-status.enum';
import { IResumeUpload } from '@features/dashboard/enums/resume-upload.interface';
import { UploadedResume } from '@core/models/user/uploaded-resumes.model';
import { ResumeService } from '@shared/services/resume.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { UserState } from '@core/states/user.state';
import { saveAs } from 'file-saver';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tailore-resume-upload',
  imports: [],
  templateUrl: './tailore-resume-upload.component.html',
  styleUrl: './tailore-resume-upload.component.scss'
})
export class TailoreResumeUploadComponent implements OnDestroy {

  // Injections
  private resumeService = inject(ResumeService);
  private snackbarService = inject(SnackbarService);
  private userState = inject(UserState);

  // Internal state
  public isProcessing = signal<boolean>(false);
  public progress = signal<number>(0);
  public uploadedResumes = signal<UploadedResume[]>(this.userState.uploadedResumes());

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor() {
    // Effect to keep uploadedResumes in sync with userState
    effect(() => {
      this.uploadedResumes.set(this.userState.uploadedResumes());
    });
  }

  public async handleUpload(event: EventTarget | null): Promise<void> {

    const file = this.extractFile(event);
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append('resumeFile', file as Blob);

    this.startProcessing();
    await this.simulateProgress([25, 50], 700);

    this.subscriptions.push(
      this.resumeService.uploadResume(formData).subscribe({
        next: async (response) => {
          await this.simulateProgress([75, 100], 700);
          this.stopProcessing();
          if (response.status === ResponseStatus.SUCCESS && response?.data) {
            this.userState.updateUserResume(response.data as UploadedResume);
          }
        },
        error: (error) => {
          this.snackbarService.showError(error?.error?.message || error?.message || Messages.UPLOAD_FAILED_PLEASE_TRY_AGAIN);
          this.reset();
        }
      })
    );
  }

  private extractFile(event: EventTarget | null): File | null {

    if (!(event instanceof HTMLInputElement)) {
      return null;
    }

    const files = (event as HTMLInputElement)?.files;

    if (!files || files?.length === 0) {
      return null;
    }

    return files.item(0);
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

  public handleDeleteResume(resume: IResumeUpload): void {
    if (!resume?.id) {
      this.snackbarService.showWarning(Messages.RESUME_IS_NOT_VALID);
      return;
    }

    this.subscriptions.push(
      this.resumeService.deleteResume(resume?.id as string).subscribe({
        next: (response) => {
          // Update state first
          this.userState.deleteUploadedResume(resume?.id as string);

          // Update local signal with current state value
          this.uploadedResumes.set(this.userState.uploadedResumes());

          this.snackbarService.showSuccess(response?.message);
          this.reset();
        },
        error: (error) => {
          this.snackbarService.showError(error?.error?.message || error?.message);
        }
      })
    );
  }

  public reset(): void {
    this.isProcessing.set(false);
    this.progress.set(0);
    // this.resume.set(null);
  }

  public handleDownload(resume: IResumeUpload | null): void {
    if (resume?.s3Url) {
      saveAs(resume.s3Url, resume.fileName);
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

}
