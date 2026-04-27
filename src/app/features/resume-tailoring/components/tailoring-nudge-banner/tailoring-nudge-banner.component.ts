import { Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResumeProfileState } from '@core/states/resume-profile.state';
import { StorageService } from '@shared/services/storage.service';
import { StorageKeys } from '@core/enums/storage-keys.enum';
import { ButtonComponent } from '@shared/components/ui/button/button.component';

@Component({
  selector: 'app-tailoring-nudge-banner',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './tailoring-nudge-banner.component.html',
  styleUrl: './tailoring-nudge-banner.component.scss',
})
export class TailoringNudgeBannerComponent {
  private readonly profileState = inject(ResumeProfileState);
  private readonly storage = inject(StorageService);

  /** When false, hide the banner (e.g. form not visible) */
  showForm = input<boolean>(true);

  /** Emitted when user clicks "Answer Questions First" (caller should close modal and navigate/scroll) */
  answerQuestionsFirst = output<void>();

  /** Emitted when user dismisses (Continue or close) */
  dismissed = output<void>();

  readonly visible = computed(() => {
    if (!this.showForm()) return false;
    const ps = this.profileState.profileState();
    const needsPrecisionSetup =
      ps === 'questions_pending' ||
      ps === 'questions_partial' ||
      ps === 'awaiting_precision_questions';
    if (!needsPrecisionSetup) return false;
    return !this.storage.getItem(StorageKeys.TAILORING_NUDGE_DISMISSED);
  });

  readonly completenessPercent = computed(() => {
    if (this.profileState.profileState() === 'awaiting_precision_questions') {
      return 33;
    }
    return Math.round(this.profileState.profileCompleteness() * 100);
  });

  dismiss(): void {
    this.storage.setItem(StorageKeys.TAILORING_NUDGE_DISMISSED, 'true');
    this.dismissed.emit();
  }

  onAnswerFirst(): void {
    this.storage.setItem(StorageKeys.TAILORING_NUDGE_DISMISSED, 'true');
    this.answerQuestionsFirst.emit();
  }

  onContinue(): void {
    this.dismiss();
  }
}
