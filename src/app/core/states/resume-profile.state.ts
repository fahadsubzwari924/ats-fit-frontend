import { computed, Injectable, signal } from '@angular/core';
import {
  ProcessingStatusEnum,
  ProfileState,
  ResumeProfileStatus,
  TailoringModeEnum,
} from '@features/dashboard/models/resume-profile.model';

@Injectable({
  providedIn: 'root',
})
export class ResumeProfileState {
  private _profileStatus = signal<ResumeProfileStatus | null>(null);
  private _pollingTimedOut = signal<boolean>(false);

  readonly profileStatus = this._profileStatus.asReadonly();
  readonly pollingTimedOut = this._pollingTimedOut.asReadonly();

  readonly profileState = computed<ProfileState>(() => {
    const s = this._profileStatus();
    if (!s) return 'no_resume';
    if (!s.hasResume) return 'no_resume';
    if (s.processingStatus === ProcessingStatusEnum.QUEUED || s.processingStatus === ProcessingStatusEnum.PROCESSING) {
      return 'processing';
    }
    if (s.processingStatus === ProcessingStatusEnum.FAILED) return 'failed';

    // Precision-ready only when the API says precision AND an enriched profile exists.
    // Do not treat "zero questions" as complete — that means generation/pipeline not done yet.
    const precisionProfileReady =
      s.tailoringMode === TailoringModeEnum.PRECISION &&
      s.enrichedProfileId != null &&
      s.processingStatus === ProcessingStatusEnum.COMPLETED;

    if (precisionProfileReady) return 'complete';

    const allQuestionSlotsAnswered =
      s.questionsTotal > 0 && s.questionsAnswered >= s.questionsTotal;

    if (allQuestionSlotsAnswered && !s.enrichedProfileId) return 'enriching';

    if (s.questionsTotal > 0 && s.questionsAnswered === 0) return 'questions_pending';
    if (s.questionsTotal > 0 && s.questionsAnswered < s.questionsTotal) {
      return 'questions_partial';
    }

    // Extraction finished but no question rows yet, or still on standard tailoring only.
    if (s.processingStatus === ProcessingStatusEnum.COMPLETED) return 'awaiting_precision_questions';

    return 'no_resume';
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

  /** True when the active extract is processing AND a previous archived extract exists */
  readonly replacementInProgress = computed(
    () => this._profileStatus()?.replacementInProgress ?? false,
  );

  /** Whether the current processing state is from a replacement (vs initial upload) */
  readonly isReplacement = computed(
    () =>
      this.profileState() === 'processing' &&
      (this._profileStatus()?.replacementInProgress ?? false),
  );

  readonly lastArchivedExtractId = computed(
    () => this._profileStatus()?.lastArchivedExtractId ?? null,
  );

  readonly replacementQuota = computed(
    () => this._profileStatus()?.quota ?? null,
  );

  setProfileStatus(status: ResumeProfileStatus | null): void {
    this._profileStatus.set(status);
  }

  setPollingTimedOut(timedOut: boolean): void {
    this._pollingTimedOut.set(timedOut);
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
    this._pollingTimedOut.set(false);
  }
}
