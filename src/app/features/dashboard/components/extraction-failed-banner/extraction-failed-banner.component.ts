import { Component, inject, output } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ResumeService } from '../../../../shared/services/resume.service';
import { ResumeProfileState } from '../../../../core/states/resume-profile.state';
import { ModalService } from '../../../../shared/services/modal.service';
import { ReplaceResumeModalComponent } from '../replace-resume-modal/replace-resume-modal.component';
import { RESUME_REPLACEMENT_COPY } from '../../../../core/constants/resume-replacement.constants';
import { SnackbarService } from '../../../../shared/services/snackbar.service';

@Component({
  standalone: true,
  selector: 'app-extraction-failed-banner',
  imports: [],
  templateUrl: './extraction-failed-banner.component.html',
})
export class ExtractionFailedBannerComponent {
  private readonly resumeService = inject(ResumeService);
  private readonly profileState = inject(ResumeProfileState);
  private readonly modal = inject(ModalService);
  private readonly snackbar = inject(SnackbarService);

  readonly copy = RESUME_REPLACEMENT_COPY.banner;
  readonly lastArchivedExtractId = this.profileState.lastArchivedExtractId;
  readonly restoreCompleted = output<void>();
  readonly replacementSubmitted = output<void>();

  tryAgain(): void {
    this.modal.openModal(ReplaceResumeModalComponent)
      .afterClosed()
      .subscribe((result) => {
        if (result === 'submitted') {
          this.replacementSubmitted.emit();
        }
      });
  }

  async restorePrevious(): Promise<void> {
    const archivedId = this.lastArchivedExtractId();
    if (!archivedId) return;
    try {
      await firstValueFrom(this.resumeService.restoreArchivedResume(archivedId));
      this.snackbar.showSuccess(this.copy.restoreSuccess);
      this.restoreCompleted.emit();
    } catch {
      this.snackbar.showError(this.copy.restoreError);
    }
  }
}
