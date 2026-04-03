import { Component, computed, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, Subscription, switchMap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ProfileQuestionsService } from '@features/dashboard/services/profile-questions.service';
import { ResumeProfileState } from '@core/states/resume-profile.state';
import { EmployerQuestionGroup } from '@features/dashboard/models/profile-question.model';
import { EmployerQuestionGroupComponent } from './employer-question-group/employer-question-group.component';
import { ModalService } from '@shared/services/modal.service';
import { TailorApplyModalComponent } from '@features/tailor-apply/tailor-apply-modal.component';

const ENRICHMENT_POLL_INTERVAL_MS = 4000;
const ENRICHMENT_POLL_MAX_ATTEMPTS = 15;

@Component({
  selector: 'app-resume-insights-questions',
  standalone: true,
  imports: [CommonModule, EmployerQuestionGroupComponent],
  templateUrl: './resume-insights-questions.component.html',
  styleUrl: './resume-insights-questions.component.scss',
})
export class ResumeInsightsQuestionsComponent {
  private readonly profileQuestionsService = inject(ProfileQuestionsService);
  private readonly profileState = inject(ResumeProfileState);
  private readonly modalService = inject(ModalService);
  private readonly destroyRef = inject(DestroyRef);

  private enrichmentPollSub: Subscription | null = null;

  /** When true, show the card (e.g. when there are questions to answer) */
  visible = input<boolean>(true);

  questionsLoaded = output<void>();

  groups = signal<EmployerQuestionGroup[]>([]);
  loading = signal(true);
  editingQuestionId = signal<string | null>(null);
  saveError = signal<string | null>(null);
  completing = signal(false);
  expandedIndex = signal<number | null>(0);

  totalQuestions = computed(() =>
    this.groups().reduce((acc, g) => acc + g.questions.length, 0)
  );
  answeredCount = computed(() =>
    this.groups().reduce(
      (acc, g) => acc + g.questions.filter((q) => q.isAnswered).length,
      0
    )
  );
  progressPercentage = computed(() => {
    const total = this.totalQuestions();
    if (total === 0) return 0;
    return Math.round((this.answeredCount() / total) * 100);
  });
  allAnswered = computed(() => {
    const t = this.totalQuestions();
    return t > 0 && this.answeredCount() === t;
  });

  /** True when the enriched profile has been persisted (state transitions to complete). */
  isProfileComplete = computed(() => this.profileState.profileState() === 'complete');

  /** True while the backend is running Claude enrichment after all questions are answered. */
  isEnriching = computed(() => this.profileState.profileState() === 'enriching');

  /** True if all questions answered locally but enrichment hasn't returned yet (fallback CTA state). */
  needsFallbackComplete = computed(() =>
    this.allAnswered() && !this.isProfileComplete() && !this.isEnriching()
  );

  constructor() {
    this.loadQuestions();

    effect(() => {
      const editId = this.editingQuestionId();
      if (!editId) return;
      const index = this.groups().findIndex((g) =>
        g.questions.some((q) => q.id === editId)
      );
      if (index !== -1) {
        this.expandedIndex.set(index);
      }
    });
  }

  onGroupToggled(index: number): void {
    this.expandedIndex.update((current) => (current === index ? null : index));
  }

  loadQuestions(): void {
    this.loading.set(true);
    this.profileQuestionsService
      .getQuestions()
      .subscribe({
        next: (list) => {
          this.groups.set(list);
          this.loading.set(false);
          this.questionsLoaded.emit();
        },
        error: () => this.loading.set(false),
      });
  }

  onSaveAnswer(payload: { questionId: string; response: string }): void {
    this.saveError.set(null);
    this.editingQuestionId.set(null);
    const prevAnswered = this.answeredCount();
    const total = this.totalQuestions();
    const newAnswered = prevAnswered + 1;
    // Optimistic update
    this.groups.update((list) =>
      list.map((g) => ({
        ...g,
        questions: g.questions.map((q) =>
          q.id === payload.questionId
            ? { ...q, userResponse: payload.response, isAnswered: true }
            : q
        ),
      }))
    );
    this.profileState.updateQuestionAnswered(newAnswered, newAnswered / total);
    this.profileQuestionsService
      .saveAnswer(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.profileState.updateQuestionAnswered(newAnswered, res.profileCompleteness);
          if (res.enrichedProfileId) {
            this.profileState.setEnrichedProfileId(res.enrichedProfileId);
          } else if (newAnswered === total) {
            this.startEnrichmentPolling();
          }
        },
        error: () => {
          this.saveError.set('Failed to save, please try again.');
          this.groups.update((list) =>
            list.map((g) => ({
              ...g,
              questions: g.questions.map((q) =>
                q.id === payload.questionId
                  ? { ...q, userResponse: null, isAnswered: false }
                  : q
              ),
            }))
          );
          this.profileState.updateQuestionAnswered(prevAnswered, prevAnswered / total);
        },
      });
  }

  onSkipQuestion(questionId: string): void {
    this.saveError.set(null);
    this.editingQuestionId.set(null);
    const prevAnswered = this.answeredCount();
    const total = this.totalQuestions();
    const previousQuestion = this.groups()
      .flatMap((g) => g.questions)
      .find((q) => q.id === questionId);
    this.groups.update((list) =>
      list.map((g) => ({
        ...g,
        questions: g.questions.map((q) =>
          q.id === questionId
            ? { ...q, userResponse: null, isAnswered: true }
            : q
        ),
      }))
    );
    const newAnswered = this.answeredCount();
    this.profileState.updateQuestionAnswered(newAnswered, newAnswered / total);
    this.profileQuestionsService
      .skipQuestion(questionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.profileState.updateQuestionAnswered(newAnswered, res.profileCompleteness);
          if (res.enrichedProfileId) {
            this.profileState.setEnrichedProfileId(res.enrichedProfileId);
          } else if (newAnswered === total) {
            this.startEnrichmentPolling();
          }
        },
        error: () => {
          this.saveError.set('Failed to skip, please try again.');
          if (previousQuestion) {
            this.groups.update((list) =>
              list.map((g) => ({
                ...g,
                questions: g.questions.map((q) =>
                  q.id === questionId ? { ...previousQuestion } : q
                ),
              }))
            );
          }
          this.profileState.updateQuestionAnswered(prevAnswered, prevAnswered / total);
        },
      });
  }

  onStartEdit(questionId: string): void {
    this.editingQuestionId.set(questionId);
  }

  onCancelEdit(): void {
    this.editingQuestionId.set(null);
  }

  onComplete(): void {
    this.completing.set(true);
    this.profileQuestionsService
      .markComplete()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.completing.set(false);
          if (res.enrichedProfileId) {
            this.profileState.setEnrichedProfileId(res.enrichedProfileId);
            this.loadQuestions();
          } else {
            this.startEnrichmentPolling();
          }
        },
        error: () => this.completing.set(false),
      });
  }

  openTailorModal(): void {
    this.modalService.openModal(TailorApplyModalComponent).afterClosed().subscribe();
  }

  private startEnrichmentPolling(): void {
    this.stopEnrichmentPolling();

    let attempts = 0;
    this.enrichmentPollSub = interval(ENRICHMENT_POLL_INTERVAL_MS)
      .pipe(
        switchMap(() => this.profileQuestionsService.getProfileStatus()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (status) => {
          attempts++;
          this.profileState.setProfileStatus(status);

          if (status.enrichedProfileId) {
            this.profileState.setEnrichedProfileId(status.enrichedProfileId);
            this.stopEnrichmentPolling();
            return;
          }

          if (attempts >= ENRICHMENT_POLL_MAX_ATTEMPTS) {
            this.stopEnrichmentPolling();
          }
        },
        error: () => this.stopEnrichmentPolling(),
      });
  }

  private stopEnrichmentPolling(): void {
    this.enrichmentPollSub?.unsubscribe();
    this.enrichmentPollSub = null;
  }
}
