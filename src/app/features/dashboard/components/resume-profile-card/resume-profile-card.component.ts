import { Component, effect, inject, input, output, signal } from '@angular/core';
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
  readonly pollingTimedOut = this.profileStateService.pollingTimedOut;

  /** Briefly true when processing transitions to questions_pending, drives the glow animation */
  readonly questionsJustArrived = signal(false);

  /** Emitted when user selects a file to upload (no_resume state) */
  uploadRequested = output<File>();

  /** Emitted when user clicks Answer Questions / Continue */
  scrollToQuestions = output<void>();

  /** Emitted when user clicks "Check Again" after polling times out */
  retryRequested = output<void>();

  constructor() {
    let prevState = this.profileState();
    effect(() => {
      const currentState = this.profileState();
      const transitionedToQuestions =
        prevState === ProfileStateEnum.PROCESSING &&
        (currentState === ProfileStateEnum.QUESTIONS_PENDING ||
          currentState === ProfileStateEnum.QUESTIONS_PARTIAL);

      if (transitionedToQuestions) {
        this.questionsJustArrived.set(true);
        setTimeout(() => this.questionsJustArrived.set(false), 2000);
      }

      prevState = currentState;
    });
  }

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

  getSteps(): { label: string; done: boolean; inProgress?: boolean }[] {
    const allDone = this.profileState() === ProfileStateEnum.COMPLETE;
    const hasAnswers = this.questionsAnswered() > 0;
    return [
      { label: 'Resume uploaded', done: true },
      { label: 'Questions answered', done: allDone, inProgress: hasAnswers && !allDone },
      { label: 'Precision ready', done: allDone },
    ];
  }

  protected readonly ProfileState = ProfileStateEnum;
}
