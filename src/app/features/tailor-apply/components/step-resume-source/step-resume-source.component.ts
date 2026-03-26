import { Component, computed, inject, input, output, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { UserState } from '@core/states/user.state';
import { SnackbarService } from '@shared/services/snackbar.service';
import { AllowedFileType } from '@core/enums/allowed-file-type.enum';
import { Messages } from '@core/enums/messages.enum';

@Component({
  selector: 'app-step-resume-source',
  standalone: true,
  imports: [NgClass],
  templateUrl: './step-resume-source.component.html',
})
export class StepResumeSourceComponent {
  private readonly userState = inject(UserState);
  private readonly snackbar = inject(SnackbarService);

  resumeFile = input<File | null>(null);
  fileSelected = output<File>();
  next = output<void>();

  readonly isPremiumUser = this.userState.isPremiumUser;
  readonly uploadedResumes = this.userState.uploadedResumes;
  readonly useUpload = signal(false);

  readonly hasSavedResume = computed(
    () => this.uploadedResumes()?.length > 0
  );

  readonly isStepValid = computed(
    () => this.hasSavedResume() || this.resumeFile() !== null
  );

  showUploadArea(): void {
    this.useUpload.set(true);
  }

  handleFileUpload(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.type !== AllowedFileType.PDF) {
      this.snackbar.showWarning(Messages.PLEASE_UPLOAD_A_PDF_FILE);
      return;
    }
    this.fileSelected.emit(file);
    this.useUpload.set(false);
  }

  onNext(): void {
    if (this.isStepValid()) {
      this.next.emit();
    } else {
      this.snackbar.showWarning(Messages.PLEASE_UPLOAD_A_RESUME_FILE);
    }
  }
}
