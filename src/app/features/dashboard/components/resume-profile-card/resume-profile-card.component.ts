import { Component, inject, input, output } from '@angular/core';
import { ProfileStateEnum } from '@features/dashboard/models/resume-profile.model';
import { ResumeProfileState } from '@core/states/resume-profile.state';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-resume-profile-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resume-profile-card.component.html',
  styleUrl: './resume-profile-card.component.scss',
})
export class ResumeProfileCardComponent {
  private readonly profileStateService = inject(ResumeProfileState);

  /** Override visibility (e.g. hide for freemium when no profile feature) */
  visible = input<boolean>(true);

  readonly profileState = this.profileStateService.profileState;
  readonly profileCompleteness = this.profileStateService.profileCompleteness;
  readonly questionsProgress = this.profileStateService.questionsProgress;
  readonly questionsTotal = this.profileStateService.questionsTotal;
  readonly questionsAnswered = this.profileStateService.questionsAnswered;
  readonly questionsRemaining = this.profileStateService.questionsRemaining;

  /** Emitted when user selects a file to upload (no_resume state) */
  uploadRequested = output<File>();

  /** Emitted when user clicks Answer Questions / Continue */
  scrollToQuestions = output<void>();

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file && file.type === 'application/pdf') {
      this.uploadRequested.emit(file);
      input.value = '';
    }
  }

  scrollToQuestionsSection(): void {
    this.scrollToQuestions.emit();
  }

  protected readonly ProfileState = ProfileStateEnum;
}
