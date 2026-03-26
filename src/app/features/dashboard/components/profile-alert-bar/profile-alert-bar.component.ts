import { Component, computed, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResumeProfileState } from '@core/states/resume-profile.state';
import { StorageService } from '@shared/services/storage.service';
import { StorageKeys } from '@core/enums/storage-keys.enum';

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

@Component({
  selector: 'app-profile-alert-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-alert-bar.component.html',
  styleUrl: './profile-alert-bar.component.scss',
})
export class ProfileAlertBarComponent {
  private readonly profileState = inject(ResumeProfileState);
  private readonly storage = inject(StorageService);

  readonly scrollToQuestions = output<void>();

  readonly questionsTotal = this.profileState.questionsTotal;
  readonly questionsRemaining = this.profileState.questionsRemaining;

  private dismissedAt = signal<string | null>(null);

  /** Only shown when no questions have been answered yet (questions_pending). */
  readonly visible = computed(() => {
    const state = this.profileState.profileState();
    if (state !== 'questions_pending') return false;
    const at = this.dismissedAt() ?? this.storage.getItem(StorageKeys.PROFILE_NUDGE_DISMISSED_AT);
    if (!at) return true;
    const then = new Date(at).getTime();
    if (Number.isNaN(then)) return true;
    return Date.now() - then > FORTY_EIGHT_HOURS_MS;
  });

  constructor() {
    this.dismissedAt.set(this.storage.getItem(StorageKeys.PROFILE_NUDGE_DISMISSED_AT));
  }

  dismiss(): void {
    const value = new Date().toISOString();
    this.storage.setItem(StorageKeys.PROFILE_NUDGE_DISMISSED_AT, value);
    this.dismissedAt.set(value);
  }

  onAnswerNow(): void {
    this.scrollToQuestions.emit();
  }
}
