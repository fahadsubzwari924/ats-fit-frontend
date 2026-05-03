import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { JobApplicationInterview } from '@features/applications/models/interview/job-application-interview.model';
import { InterviewFormat } from '@features/applications/models/enums/interview-format.enum';
import { InterviewOutcome } from '@features/applications/models/enums/interview-outcome.enum';
import { InterviewStage } from '@features/applications/models/enums/interview-stage.enum';

@Component({
  selector: 'app-interview-card',
  standalone: true,
  imports: [NgClass],
  template: `
    <article class="interview-card" [attr.aria-label]="'Interview: ' + stageLabel">
      <div class="interview-card__header">
        <div class="interview-card__meta">
          <!-- Stage chip -->
          <span class="interview-card__stage-chip">
            {{ stageLabel }}
          </span>

          <!-- Format indicator -->
          @if (interview.format) {
            <span
              class="interview-card__format"
              [attr.aria-label]="'Format: ' + formatLabel"
              [title]="formatLabel"
            >
              {{ formatIcon }}
            </span>
          }

          <!-- Outcome badge -->
          @if (interview.outcome) {
            <span
              class="interview-card__outcome-badge"
              [ngClass]="outcomeBadgeClass"
              [attr.aria-label]="'Outcome: ' + outcomeLabel"
            >
              {{ outcomeLabel }}
            </span>
          }
        </div>

        <!-- Actions -->
        <div class="interview-card__actions">
          <button
            type="button"
            class="interview-card__icon-btn"
            aria-label="Edit interview"
            (click)="edit.emit()"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button
            type="button"
            class="interview-card__icon-btn interview-card__icon-btn--destructive"
            aria-label="Delete interview"
            (click)="delete.emit()"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6"/>
              <path d="M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="interview-card__body">
        <!-- Scheduled date -->
        @if (interview.scheduledAt) {
          <div class="interview-card__date" [attr.aria-label]="'Scheduled: ' + absoluteDate">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span class="interview-card__date-relative">{{ relativeDate }}</span>
            <span class="interview-card__date-separator" aria-hidden="true">·</span>
            <span class="interview-card__date-absolute">{{ absoluteDate }}</span>
          </div>
        } @else {
          <div class="interview-card__date interview-card__date--unscheduled">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span>Not scheduled</span>
          </div>
        }

        <!-- Interviewer -->
        @if (interview.interviewerName) {
          <div class="interview-card__interviewer" [attr.aria-label]="'Interviewer: ' + interview.interviewerName">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span>{{ interview.interviewerName }}</span>
          </div>
        }

        <!-- Location / link -->
        @if (interview.locationOrLink) {
          <div class="interview-card__location" [attr.aria-label]="'Location: ' + interview.locationOrLink">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span class="interview-card__location-text">{{ interview.locationOrLink }}</span>
          </div>
        }

        <!-- Notes preview -->
        @if (interview.notes) {
          <p class="interview-card__notes">{{ interview.notes }}</p>
        }
      </div>
    </article>
  `,
  styles: [`
    @use 'design-tokens' as *;

    .interview-card {
      border: 1px solid $color-border;
      border-radius: $radius-md;
      background-color: $color-card;
      overflow: hidden;
      transition: box-shadow $transition-fast $easing-ease-in-out;

      &:hover {
        box-shadow: $shadow-sm;
      }

      &__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: $spacing-sm;
        padding: $spacing-sm $spacing-sm $spacing-xs;
      }

      &__meta {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: $spacing-xs;
        min-width: 0;
      }

      &__stage-chip {
        display: inline-flex;
        align-items: center;
        padding: 2px $spacing-sm;
        font-size: $font-size-xs;
        font-weight: $font-weight-semibold;
        color: $color-primary;
        background-color: hsl(221 83% 53% / 0.1);
        border-radius: $radius-full;
        white-space: nowrap;
        line-height: $line-height-snug;
      }

      &__format {
        font-size: $font-size-base;
        line-height: 1;
        cursor: default;
      }

      &__outcome-badge {
        display: inline-flex;
        align-items: center;
        padding: 2px $spacing-sm;
        font-size: $font-size-xs;
        font-weight: $font-weight-medium;
        border-radius: $radius-full;
        white-space: nowrap;
        line-height: $line-height-snug;

        &--pending {
          background-color: hsl(215 20% 55% / 0.15);
          color: hsl(215 20% 35%);
        }

        &--passed {
          background-color: hsl(142 76% 36% / 0.12);
          color: hsl(142 76% 28%);
        }

        &--failed {
          background-color: hsl(0 84% 60% / 0.12);
          color: hsl(0 84% 40%);
        }

        &--no_show {
          background-color: hsl(45 93% 47% / 0.15);
          color: hsl(36 77% 35%);
        }

        &--cancelled {
          background-color: hsl(25 95% 53% / 0.12);
          color: hsl(25 95% 35%);
        }
      }

      &__actions {
        display: flex;
        align-items: center;
        gap: $spacing-xs;
        flex-shrink: 0;
      }

      &__icon-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border: none;
        background: transparent;
        border-radius: $radius-sm;
        color: $color-muted-foreground;
        cursor: pointer;
        transition: background-color $transition-fast $easing-ease-in-out,
                    color $transition-fast $easing-ease-in-out;

        &:hover {
          background-color: $color-accent;
          color: $color-foreground;
        }

        &:focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px $color-ring;
        }

        &--destructive:hover {
          background-color: hsl(0 84% 60% / 0.1);
          color: $color-destructive;
        }
      }

      &__body {
        display: flex;
        flex-direction: column;
        gap: $spacing-xs;
        padding: 0 $spacing-sm $spacing-sm;
      }

      &__date {
        display: flex;
        align-items: center;
        gap: $spacing-xs;
        font-size: $font-size-xs;
        color: $color-muted-foreground;
        min-width: 0;

        svg {
          flex-shrink: 0;
          color: $color-muted-foreground;
        }

        &--unscheduled {
          color: $color-muted-foreground;
          font-style: italic;
        }
      }

      &__date-relative {
        font-weight: $font-weight-medium;
        color: $color-foreground;
      }

      &__date-separator {
        color: $color-muted-foreground;
      }

      &__date-absolute {
        color: $color-muted-foreground;
      }

      &__interviewer,
      &__location {
        display: flex;
        align-items: center;
        gap: $spacing-xs;
        font-size: $font-size-xs;
        color: $color-muted-foreground;
        min-width: 0;

        svg {
          flex-shrink: 0;
        }

        span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      &__location-text {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 200px;
      }

      &__notes {
        margin: 0;
        font-size: $font-size-xs;
        color: $color-muted-foreground;
        line-height: $line-height-normal;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        font-style: italic;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InterviewCardComponent {
  @Input({ required: true }) interview!: JobApplicationInterview;
  @Output() edit = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();

  /** Map enum values to human-readable labels. */
  get stageLabel(): string {
    const labels: Record<InterviewStage, string> = {
      [InterviewStage.RECRUITER_SCREEN]: 'Recruiter Screen',
      [InterviewStage.HR_SCREEN]: 'HR Screen',
      [InterviewStage.TAKE_HOME]: 'Take Home',
      [InterviewStage.TECHNICAL]: 'Technical',
      [InterviewStage.SYSTEM_DESIGN]: 'System Design',
      [InterviewStage.BEHAVIORAL]: 'Behavioral',
      [InterviewStage.HIRING_MANAGER]: 'Hiring Manager',
      [InterviewStage.ONSITE_LOOP]: 'Onsite Loop',
      [InterviewStage.FINAL]: 'Final',
      [InterviewStage.OTHER]: 'Other',
    };
    return labels[this.interview.stage] ?? this.interview.stage;
  }

  get formatLabel(): string {
    if (!this.interview.format) {
      return '';
    }
    const labels: Record<InterviewFormat, string> = {
      [InterviewFormat.PHONE]: 'Phone',
      [InterviewFormat.VIDEO]: 'Video',
      [InterviewFormat.IN_PERSON]: 'In Person',
    };
    return labels[this.interview.format] ?? this.interview.format;
  }

  get formatIcon(): string {
    if (!this.interview.format) {
      return '';
    }
    const icons: Record<InterviewFormat, string> = {
      [InterviewFormat.PHONE]: '📞',
      [InterviewFormat.VIDEO]: '💻',
      [InterviewFormat.IN_PERSON]: '🏢',
    };
    return icons[this.interview.format] ?? '';
  }

  get outcomeLabel(): string {
    if (!this.interview.outcome) {
      return '';
    }
    const labels: Record<InterviewOutcome, string> = {
      [InterviewOutcome.PENDING]: 'Pending',
      [InterviewOutcome.PASSED]: 'Passed',
      [InterviewOutcome.FAILED]: 'Failed',
      [InterviewOutcome.NO_SHOW]: 'No Show',
      [InterviewOutcome.CANCELLED]: 'Cancelled',
    };
    return labels[this.interview.outcome] ?? this.interview.outcome;
  }

  get outcomeBadgeClass(): string {
    if (!this.interview.outcome) {
      return '';
    }
    return `interview-card__outcome-badge--${this.interview.outcome}`;
  }

  get relativeDate(): string {
    if (!this.interview.scheduledAt) {
      return '';
    }
    const diff = new Date(this.interview.scheduledAt).getTime() - Date.now();
    const absDiff = Math.abs(diff);
    const isPast = diff < 0;

    const mins = Math.floor(absDiff / 60_000);
    if (mins < 60) {
      return isPast ? `${mins}m ago` : `in ${mins}m`;
    }
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) {
      return isPast ? `${hrs}h ago` : `in ${hrs}h`;
    }
    const days = Math.floor(hrs / 24);
    if (days === 1) {
      return isPast ? 'Yesterday' : 'Tomorrow';
    }
    return isPast ? `${days}d ago` : `in ${days} days`;
  }

  get absoluteDate(): string {
    if (!this.interview.scheduledAt) {
      return '';
    }
    try {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(this.interview.scheduledAt));
    } catch {
      return this.interview.scheduledAt;
    }
  }
}
