import { Component, computed, inject, output } from '@angular/core';
import { NgClass } from '@angular/common';
import { UserState } from '@core/states/user.state';
import { SnackbarService } from '@shared/services/snackbar.service';
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

  next = output<void>();

  readonly isPremiumUser = this.userState.isPremiumUser;
  readonly uploadedResumes = this.userState.uploadedResumes;

  readonly hasSavedResume = computed(
    () => this.uploadedResumes()?.length > 0
  );

  readonly isStepValid = computed(() => this.hasSavedResume());

  onNext(): void {
    if (this.isStepValid()) {
      this.next.emit();
    } else {
      this.snackbar.showWarning(Messages.PLEASE_UPLOAD_A_RESUME_FILE);
    }
  }
}
