import { computed, inject, Injectable, signal } from '@angular/core';
import {
  ProfileState,
  ResumeProfileStatus,
} from '@features/dashboard/models/resume-profile.model';

@Injectable({
  providedIn: 'root',
})
export class ResumeProfileState {
  private _profileStatus = signal<ResumeProfileStatus | null>(null);

  readonly profileStatus = this._profileStatus.asReadonly();

  readonly profileState = computed<ProfileState>(() => {
    const s = this._profileStatus();
    if (!s) return 'no_resume';
    if (!s.hasResume) return 'no_resume';
    if (s.processingStatus === 'queued' || s.processingStatus === 'processing') {
      return 'processing';
    }
    if (s.processingStatus === 'failed') return 'failed';
    if (s.questionsTotal === 0) return 'complete';
    if (s.profileCompleteness >= 1.0 && s.enrichedProfileId) return 'complete';
    if (s.profileCompleteness >= 1.0 && !s.enrichedProfileId) return 'enriching';
    if (s.questionsAnswered === 0) return 'questions_pending';
    if (s.questionsAnswered < s.questionsTotal) return 'questions_partial';
    return 'enriching';
  });

  readonly profileCompleteness = computed(() => {
    const s = this._profileStatus();
    return s?.profileCompleteness ?? 0;
  });

  readonly questionsProgress = computed(() => {
    const s = this._profileStatus();
    if (!s || s.questionsTotal === 0) return null;
    return `${s.questionsAnswered} of ${s.questionsTotal} answered`;
  });

  readonly questionsTotal = computed(() => this._profileStatus()?.questionsTotal ?? 0);
  readonly questionsAnswered = computed(() => this._profileStatus()?.questionsAnswered ?? 0);
  readonly questionsRemaining = computed(() => {
    const s = this._profileStatus();
    if (!s || s.questionsTotal === 0) return 0;
    return Math.max(0, s.questionsTotal - s.questionsAnswered);
  });

  setProfileStatus(status: ResumeProfileStatus | null): void {
    this._profileStatus.set(status);
  }

  /** Update local state after answering/skipping a question (optimistic or after API) */
  updateQuestionAnswered(answeredCount: number, profileCompleteness: number): void {
    this._profileStatus.update((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        questionsAnswered: answeredCount,
        profileCompleteness,
      };
    });
  }

  /** After enrichment completes, set enrichedProfileId */
  setEnrichedProfileId(enrichedProfileId: string): void {
    this._profileStatus.update((prev) => {
      if (!prev) return prev;
      return { ...prev, enrichedProfileId, profileCompleteness: 1 };
    });
  }

  reset(): void {
    this._profileStatus.set(null);
  }
}
