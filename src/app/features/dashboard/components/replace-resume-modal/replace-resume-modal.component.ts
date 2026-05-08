import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { MatDialogRef } from '@angular/material/dialog';
import { ResumeService } from '../../../../shared/services/resume.service';
import { ResumeProfileState } from '../../../../core/states/resume-profile.state';
import {
  RESUME_REPLACEMENT_COPY,
  RESUME_REPLACEMENT_LIMITS,
} from '../../../../core/constants/resume-replacement.constants';
import { ResumeReplacementErrorCode } from '../../../../core/enums/resume-replacement.enum';
import { SnackbarService } from '../../../../shared/services/snackbar.service';

@Component({
  standalone: true,
  selector: 'app-replace-resume-modal',
  imports: [DatePipe],
  templateUrl: './replace-resume-modal.component.html',
  styles: [],
})
export class ReplaceResumeModalComponent {
  private readonly dialogRef = inject(MatDialogRef<ReplaceResumeModalComponent>);
  private readonly resumeService = inject(ResumeService);
  private readonly profileState = inject(ResumeProfileState);
  private readonly snackbar = inject(SnackbarService);

  readonly copy = RESUME_REPLACEMENT_COPY.modal;
  readonly toastCopy = RESUME_REPLACEMENT_COPY.toast;
  readonly limits = RESUME_REPLACEMENT_LIMITS;
  readonly questionsAnswered = this.profileState.questionsAnswered;
  readonly replacementQuota = this.profileState.replacementQuota;
  readonly selectedFile = signal<File | null>(null);
  readonly inlineError = signal<string | null>(null);
  readonly submitting = signal(false);

  readonly canSubmit = computed(
    () => !!this.selectedFile() && !this.submitting() && !this.inlineError(),
  );

  onFileSelected(file: File | null): void {
    this.inlineError.set(null);
    if (!file) {
      this.selectedFile.set(null);
      return;
    }
    if (file.size > this.limits.MAX_FILE_SIZE_BYTES) {
      this.inlineError.set('File too large (max 5 MB).');
      return;
    }
    if (!(this.limits.ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
      this.inlineError.set('Unsupported file type. Use PDF or DOCX.');
      return;
    }
    this.selectedFile.set(file);
  }

  async submit(): Promise<void> {
    const file = this.selectedFile();
    if (!file) return;
    this.submitting.set(true);
    const idempotencyKey = crypto.randomUUID();
    const formData = new FormData();
    formData.append('file', file);
    try {
      await firstValueFrom(this.resumeService.replaceResume(formData, idempotencyKey));
      this.snackbar.showSuccess(this.toastCopy.submitted);
      this.dialogRef.close('submitted');
    } catch (err: unknown) {
      this.handleError(err);
    } finally {
      this.submitting.set(false);
    }
  }

  private handleError(err: unknown): void {
    const code = (err as { error?: { code?: string } })?.error?.code;
    switch (code) {
      case ResumeReplacementErrorCode.SAME_FILE_AS_ACTIVE:
        this.inlineError.set(this.copy.sameFileMessage);
        break;
      case ResumeReplacementErrorCode.REPLACEMENT_QUOTA_EXCEEDED:
        this.snackbar.showError(
          this.toastCopy.quotaExceeded(
            (err as { error?: { details?: { resetsAt?: string } } }).error?.details?.resetsAt ?? '',
          ),
        );
        this.dialogRef.close();
        break;
      case ResumeReplacementErrorCode.STORAGE_UPLOAD_FAILED:
        this.snackbar.showError(this.toastCopy.storageFailed);
        break;
      case ResumeReplacementErrorCode.REPLACEMENT_TX_FAILED:
        this.snackbar.showError(this.toastCopy.txFailed);
        break;
      case ResumeReplacementErrorCode.INVALID_FILE:
        this.inlineError.set('Invalid file.');
        break;
      case ResumeReplacementErrorCode.RESUME_PROFILE_NOT_READY:
        this.snackbar.showWarning(this.toastCopy.profileNotReady);
        this.dialogRef.close();
        break;
      case ResumeReplacementErrorCode.PROFILE_ENRICHMENT_IN_PROGRESS:
        this.snackbar.showWarning(this.toastCopy.enrichmentInProgress);
        this.dialogRef.close();
        break;
      case ResumeReplacementErrorCode.NO_ACTIVE_RESUME:
        this.snackbar.showError(this.toastCopy.noActiveResume);
        this.dialogRef.close();
        break;
      case ResumeReplacementErrorCode.UPGRADE_REQUIRED:
        this.snackbar.showError(this.toastCopy.upgradeRequired);
        this.dialogRef.close();
        break;
      case ResumeReplacementErrorCode.IDEMPOTENT_REPLAY:
        // Backend detected a duplicate submission — original already succeeded
        this.snackbar.showSuccess(this.toastCopy.submitted);
        this.dialogRef.close('submitted');
        break;
      default:
        this.snackbar.showError(this.toastCopy.txFailed);
    }
  }

  asFileInput(target: EventTarget | null): HTMLInputElement | null {
    return target instanceof HTMLInputElement ? target : null;
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
