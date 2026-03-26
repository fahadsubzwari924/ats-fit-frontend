import { Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileQuestionsService } from '@features/dashboard/services/profile-questions.service';
import { ResumeProfileState } from '@core/states/resume-profile.state';
import { EmployerQuestionGroup } from '@features/dashboard/models/profile-question.model';
import { EmployerQuestionGroupComponent } from './employer-question-group/employer-question-group.component';
import { ModalService } from '@shared/services/modal.service';
import { TailorApplyModalComponent } from '@features/tailor-apply/tailor-apply-modal.component';

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

  /** When true, show the card (e.g. when there are questions to answer) */
  visible = input<boolean>(true);

  questionsLoaded = output<void>();

  groups = signal<EmployerQuestionGroup[]>([]);
  loading = signal(true);
  editingQuestionId = signal<string | null>(null);
  saveError = signal<string | null>(null);
  completing = signal(false);

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
    this.profileQuestionsService.saveAnswer(payload).subscribe({
      next: (res) => {
        this.profileState.updateQuestionAnswered(newAnswered, res.profileCompleteness);
        if (res.enrichedProfileId) {
          this.profileState.setEnrichedProfileId(res.enrichedProfileId);
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
    this.profileQuestionsService.skipQuestion(questionId).subscribe({
      next: (res) => {
        this.profileState.updateQuestionAnswered(
          newAnswered,
          res.profileCompleteness
        );
        if (res.enrichedProfileId) {
          this.profileState.setEnrichedProfileId(res.enrichedProfileId);
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
    this.profileQuestionsService.markComplete().subscribe({
      next: (res) => {
        this.profileState.setEnrichedProfileId(res.enrichedProfileId);
        this.completing.set(false);
        this.loadQuestions();
      },
      error: () => this.completing.set(false),
    });
  }

  openTailorModal(): void {
    this.modalService.openModal(TailorApplyModalComponent).afterClosed().subscribe();
  }
}
