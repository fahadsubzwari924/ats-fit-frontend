import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, Subscription, switchMap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ProfileQuestionsService } from '@features/dashboard/services/profile-questions.service';
import { ResumeProfileState } from '@core/states/resume-profile.state';
import { EmployerQuestionGroup } from '@features/dashboard/models/profile-question.model';
import { EmployerQuestionGroupComponent } from '../resume-insights-questions/employer-question-group/employer-question-group.component';

const ENRICHMENT_POLL_INTERVAL_MS = 4000;
const ENRICHMENT_POLL_MAX_ATTEMPTS = 15;

export const DRAWER_COMPANY_COLORS = ['#2563EB', '#7C3AED', '#0891B2'];

export interface DrawerCompanyPill {
  name: string;
  answeredCount: number;
  totalCount: number;
  color: string;
  allDone: boolean;
}

@Component({
  selector: 'app-questions-drawer',
  standalone: true,
  imports: [CommonModule, EmployerQuestionGroupComponent],
  templateUrl: './questions-drawer.component.html',
  styleUrl: './questions-drawer.component.scss',
})
export class QuestionsDrawerComponent {
  private readonly profileQuestionsService = inject(ProfileQuestionsService);
  private readonly profileState = inject(ResumeProfileState);
  private readonly destroyRef = inject(DestroyRef);

  /** Whether the drawer is open */
  open = input.required<boolean>();

  /** Emitted when user requests to close the drawer */
  closed = output<void>();

  // ── Internal state ────────────────────────────────────────────────────────
  groups = signal<EmployerQuestionGroup[]>([]);
  loading = signal(false);
  loaded = signal(false);
  editingQuestionId = signal<string | null>(null);
  saveError = signal<string | null>(null);
  completing = signal(false);
  expandedIndex = signal<number | null>(0);

  private enrichmentPollSub: Subscription | null = null;

  // ── Derived counts ────────────────────────────────────────────────────────
  readonly totalQ = computed(() =>
    this.groups().reduce((acc, g) => acc + g.questions.length, 0)
  );
  readonly answeredQ = computed(() =>
    this.groups().reduce(
      (acc, g) => acc + g.questions.filter((q) => q.isAnswered).length,
      0
    )
  );
  readonly pendingQ = computed(() => this.totalQ() - this.answeredQ());
  readonly progress = computed(() => {
    const total = this.totalQ();
    if (total === 0) return 0;
    return Math.round((this.answeredQ() / total) * 100);
  });
  readonly allAnswered = computed(() => {
    const t = this.totalQ();
    return t > 0 && this.answeredQ() === t;
  });

  /** Company pills for the header */
  readonly companyPills = computed<DrawerCompanyPill[]>(() =>
    this.groups().map((g, i) => {
      const answered = g.questions.filter((q) => q.isAnswered).length;
      const total = g.questions.length;
      const allDone = total > 0 && answered === total;
      return {
        name: g.companyName,
        answeredCount: answered,
        totalCount: total,
        color: DRAWER_COMPANY_COLORS[i % DRAWER_COMPANY_COLORS.length],
        allDone,
      };
    })
  );

  readonly isEnriching = computed(
    () => this.profileState.profileState() === 'enriching'
  );
  readonly isProfileComplete = computed(
    () => this.profileState.profileState() === 'complete'
  );
  readonly needsFallbackComplete = computed(
    () => this.allAnswered() && !this.isProfileComplete() && !this.isEnriching()
  );

  constructor() {
    effect(() => {
      if (this.open() && !this.loaded() && !this.loading()) {
        this.loadQuestions();
      }
    });

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

  // ── Public API ────────────────────────────────────────────────────────────

  onClose(): void {
    this.closed.emit();
  }

  onGroupToggled(index: number): void {
    this.expandedIndex.update((current) => (current === index ? null : index));
  }

  onSaveAnswer(payload: { questionId: string; response: string }): void {
    this.saveError.set(null);
    this.editingQuestionId.set(null);
    const prevAnswered = this.answeredQ();
    const total = this.totalQ();
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
          this.saveError.set('Failed to save. Please try again.');
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
    const prevAnswered = this.answeredQ();
    const total = this.totalQ();
    const previousQuestion = this.groups()
      .flatMap((g) => g.questions)
      .find((q) => q.id === questionId);

    this.groups.update((list) =>
      list.map((g) => ({
        ...g,
        questions: g.questions.map((q) =>
          q.id === questionId ? { ...q, userResponse: null, isAnswered: true } : q
        ),
      }))
    );
    const newAnswered = this.answeredQ();
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
          this.saveError.set('Failed to skip. Please try again.');
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

  onFinishOrClose(): void {
    if (this.needsFallbackComplete()) {
      this.onComplete();
    } else {
      this.onClose();
    }
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private loadQuestions(): void {
    this.loading.set(true);
    this.profileQuestionsService
      .getQuestions()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          this.groups.set(list);
          this.loading.set(false);
          this.loaded.set(true);
        },
        error: () => {
          this.loading.set(false);
          this.loaded.set(true);
        },
      });
  }

  private onComplete(): void {
    this.completing.set(true);
    this.profileQuestionsService
      .markComplete()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.completing.set(false);
          if (res.enrichedProfileId) {
            this.profileState.setEnrichedProfileId(res.enrichedProfileId);
            this.onClose();
          } else {
            // Enrichment is running in the background — show spinner, poll for completion.
            this.startEnrichmentPolling();
          }
        },
        error: () => {
          this.completing.set(false);
          this.onClose();
        },
      });
  }

  /**
   * Polls GET /resume-profile-status every 4s until enrichedProfileId appears.
   * Stops automatically when enrichment completes, max attempts are reached,
   * or the component is destroyed (takeUntilDestroyed via manual sub cleanup).
   */
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

  companyColorFor(index: number): string {
    return DRAWER_COMPANY_COLORS[index % DRAWER_COMPANY_COLORS.length];
  }
}
