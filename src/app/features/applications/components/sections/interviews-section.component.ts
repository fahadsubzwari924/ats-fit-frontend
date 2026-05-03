import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  OnChanges,
  OnInit,
  signal,
  SimpleChanges,
} from '@angular/core';
import { catchError, of } from 'rxjs';
import { JobApplicationInterview } from '@features/applications/models/interview/job-application-interview.model';
import {
  JobApplicationInterviewCreatePayload,
} from '@features/applications/models/interview/job-application-interview-create-payload.model';
import {
  JobApplicationInterviewUpdatePayload,
} from '@features/applications/models/interview/job-application-interview-update-payload.model';
import { JobApplicationInterviewService } from '@features/applications/services/job-application-interview.service';
import { AccordionSectionComponent } from '@shared/components/ui/accordion-section/accordion-section.component';
import { InterviewCardComponent } from './interview-card.component';
import { InterviewFormComponent } from './interview-form.component';

@Component({
  selector: 'app-interviews-section',
  standalone: true,
  imports: [AccordionSectionComponent, InterviewCardComponent, InterviewFormComponent],
  template: `
    <app-accordion-section
      title="Interviews"
      [expanded]="interviews().length > 0"
    >
      <div class="interviews-section">

        <!-- Loading skeleton -->
        @if (isLoading()) {
          <div class="interviews-section__skeleton" aria-busy="true" aria-label="Loading interviews">
            <div class="interviews-section__skeleton-line"></div>
            <div class="interviews-section__skeleton-line interviews-section__skeleton-line--short"></div>
          </div>
        }

        <!-- Empty state -->
        @if (!isLoading() && interviews().length === 0 && !showAddForm()) {
          <div class="interviews-section__empty">
            <p class="interviews-section__empty-text">No interviews scheduled yet.</p>
            <button
              type="button"
              class="interviews-section__add-btn"
              (click)="onAddClick()"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Schedule interview
            </button>
          </div>
        }

        <!-- Interview list -->
        @if (!isLoading() && interviews().length > 0) {
          <ul class="interviews-section__list" aria-label="Scheduled interviews">
            @for (interview of sortedInterviews; track interview.id) {
              <li class="interviews-section__item">
                <app-interview-card
                  [interview]="interview"
                  (edit)="onEditClick(interview)"
                  (delete)="onDeleteClick(interview)"
                />
              </li>
            }
          </ul>
        }

        <!-- Add / edit form -->
        @if (showAddForm()) {
          <div class="interviews-section__form-wrapper">
            <app-interview-form
              [initial]="editingInterview()"
              (submitted)="onFormSubmit($event)"
              (cancelled)="onFormCancel()"
            />
          </div>
        }

        <!-- Add interview button (non-empty list, form hidden) -->
        @if (!isLoading() && interviews().length > 0 && !showAddForm()) {
          <button
            type="button"
            class="interviews-section__add-btn interviews-section__add-btn--inline"
            (click)="onAddClick()"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add interview
          </button>
        }

        <!-- Error state -->
        @if (loadError()) {
          <p class="interviews-section__error" role="alert">
            Failed to load interviews.
            <button
              type="button"
              class="interviews-section__retry-btn"
              (click)="loadInterviews()"
            >
              Retry
            </button>
          </p>
        }

      </div>
    </app-accordion-section>
  `,
  styles: [`
    @use 'design-tokens' as *;

    .interviews-section {
      display: flex;
      flex-direction: column;
      gap: $spacing-sm;

      &__skeleton {
        display: flex;
        flex-direction: column;
        gap: $spacing-sm;
        padding: $spacing-xs 0;
      }

      &__skeleton-line {
        height: 14px;
        background-color: $color-muted;
        border-radius: $radius-sm;
        animation: skeleton-pulse 1.5s ease-in-out infinite;

        &--short {
          width: 60%;
        }
      }

      @keyframes skeleton-pulse {
        0%, 100% { opacity: 1; }
        50%       { opacity: 0.5; }
      }

      &__empty {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: $spacing-sm;
        padding: $spacing-xs 0;
      }

      &__empty-text {
        margin: 0;
        font-size: $font-size-xs;
        color: $color-muted-foreground;
        font-style: italic;
      }

      &__list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: $spacing-sm;
      }

      &__item {
        display: block;
      }

      &__form-wrapper {
        border: 1px solid $color-border;
        border-radius: $radius-md;
        padding: $spacing-sm $spacing-md;
        background-color: $color-background;
      }

      &__add-btn {
        display: inline-flex;
        align-items: center;
        gap: $spacing-xs;
        padding: $spacing-xs $spacing-sm;
        font-size: $font-size-xs;
        font-weight: $font-weight-medium;
        color: $color-primary;
        background-color: transparent;
        border: 1px dashed $color-primary;
        border-radius: $radius-md;
        cursor: pointer;
        transition: background-color $transition-fast $easing-ease-in-out,
                    border-style $transition-fast $easing-ease-in-out;

        &:hover {
          background-color: hsl(221 83% 53% / 0.06);
          border-style: solid;
        }

        &:focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px $color-ring;
        }

        &--inline {
          margin-top: $spacing-xs;
        }
      }

      &__error {
        display: flex;
        align-items: center;
        gap: $spacing-xs;
        margin: 0;
        font-size: $font-size-xs;
        color: $color-destructive;
      }

      &__retry-btn {
        display: inline;
        background: transparent;
        border: none;
        color: $color-primary;
        font-size: $font-size-xs;
        cursor: pointer;
        padding: 0;
        text-decoration: underline;
        font-weight: $font-weight-medium;

        &:hover {
          text-decoration: none;
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InterviewsSectionComponent implements OnInit, OnChanges {
  @Input({ required: true }) jobApplicationId!: string;

  private readonly interviewService = inject(JobApplicationInterviewService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly interviews = signal<JobApplicationInterview[]>([]);
  readonly isLoading = signal(false);
  readonly loadError = signal(false);
  readonly showAddForm = signal(false);
  readonly editingInterview = signal<JobApplicationInterview | null>(null);

  ngOnInit(): void {
    this.loadInterviews();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['jobApplicationId'] && !changes['jobApplicationId'].isFirstChange()) {
      this.loadInterviews();
    }
  }

  get sortedInterviews(): JobApplicationInterview[] {
    return [...this.interviews()].sort((a, b) => {
      // Nulls last
      if (!a.scheduledAt && !b.scheduledAt) {
        return 0;
      }
      if (!a.scheduledAt) {
        return 1;
      }
      if (!b.scheduledAt) {
        return -1;
      }
      // Descending: most recent first
      return new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime();
    });
  }

  loadInterviews(): void {
    this.isLoading.set(true);
    this.loadError.set(false);

    this.interviewService
      .list(this.jobApplicationId)
      .pipe(
        catchError(() => {
          this.isLoading.set(false);
          this.loadError.set(true);
          this.cdr.markForCheck();
          return of([]);
        }),
      )
      .subscribe((list) => {
        this.interviews.set(list);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      });
  }

  onAddClick(): void {
    this.editingInterview.set(null);
    this.showAddForm.set(true);
  }

  onEditClick(interview: JobApplicationInterview): void {
    this.editingInterview.set(interview);
    this.showAddForm.set(true);
  }

  onDeleteClick(interview: JobApplicationInterview): void {
    const confirmed = window.confirm('Delete this interview?');
    if (!confirmed) {
      return;
    }
    this.interviewService
      .delete(this.jobApplicationId, interview.id)
      .pipe(
        catchError(() => {
          return of(undefined);
        }),
      )
      .subscribe(() => {
        this.loadInterviews();
      });
  }

  onFormSubmit(
    payload: JobApplicationInterviewCreatePayload | JobApplicationInterviewUpdatePayload,
  ): void {
    const editing = this.editingInterview();

    const request$ =
      editing !== null
        ? this.interviewService.update(
            this.jobApplicationId,
            editing.id,
            payload as JobApplicationInterviewUpdatePayload,
          )
        : this.interviewService.create(
            this.jobApplicationId,
            payload as JobApplicationInterviewCreatePayload,
          );

    request$
      .pipe(
        catchError(() => {
          return of(null);
        }),
      )
      .subscribe((result) => {
        if (result !== null) {
          this.showAddForm.set(false);
          this.editingInterview.set(null);
          this.loadInterviews();
        }
      });
  }

  onFormCancel(): void {
    this.showAddForm.set(false);
    this.editingInterview.set(null);
  }
}
