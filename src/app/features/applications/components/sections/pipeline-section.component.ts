import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  Input,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AccordionSectionComponent } from '@shared/components/ui/accordion-section/accordion-section.component';
import {
  SegmentedControlComponent,
  SegmentedOption,
} from '@shared/components/ui/segmented-control/segmented-control.component';
import {
  ApplicationStatus,
  ApplicationPriority,
  AppliedVia,
} from '@features/applications/models/enums';

@Component({
  selector: 'app-pipeline-section',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AccordionSectionComponent,
    SegmentedControlComponent,
  ],
  template: `
    <app-accordion-section title="Pipeline & timing" [expanded]="true">
      <div class="pipeline-section" [formGroup]="group">

        <!-- Row 1: Status -->
        <div class="pipeline-section__field">
          <label class="pipeline-section__label" for="ps-status">Status</label>
          <select
            id="ps-status"
            class="pipeline-section__select"
            formControlName="status"
          >
            <option [value]="null">— select —</option>
            @for (opt of statusOptions; track opt.value) {
              <option [value]="opt.value">{{ opt.label }}</option>
            }
          </select>
        </div>

        <!-- Row 2: Priority -->
        <div class="pipeline-section__field">
          <span class="pipeline-section__label" id="ps-priority-label">Priority</span>
          <app-segmented-control
            formControlName="priority"
            [options]="priorityOptions"
            ariaLabel="Priority"
          />
        </div>

        <!-- Row 3: Applied via -->
        <div class="pipeline-section__field">
          <label class="pipeline-section__label" for="ps-applied-via">Applied via</label>
          <select
            id="ps-applied-via"
            class="pipeline-section__select"
            formControlName="applied_via"
          >
            <option [value]="null">— select —</option>
            @for (opt of appliedViaOptions; track opt.value) {
              <option [value]="opt.value">{{ opt.label }}</option>
            }
          </select>
        </div>

        <!-- Date grid: 2 columns on md+ -->
        <div class="pipeline-section__date-grid">

          <!-- Applied date -->
          <div class="pipeline-section__field">
            <label class="pipeline-section__label" for="ps-applied-at">Applied date</label>
            <input
              id="ps-applied-at"
              type="date"
              class="pipeline-section__date-input"
              formControlName="applied_at"
            />
          </div>

          <!-- Application deadline -->
          <div class="pipeline-section__field">
            <label class="pipeline-section__label" for="ps-app-deadline">Application deadline</label>
            <input
              id="ps-app-deadline"
              type="date"
              class="pipeline-section__date-input"
              formControlName="application_deadline"
            />
          </div>

          <!-- Decision deadline — highlight when <= 3 days away -->
          <div class="pipeline-section__field">
            <label class="pipeline-section__label" for="ps-decision-deadline">Decision deadline</label>
            <input
              id="ps-decision-deadline"
              type="date"
              class="pipeline-section__date-input"
              [class.pipeline-section__date-input--urgent]="isDecisionDeadlineUrgent()"
              formControlName="decision_deadline"
            />
            @if (isDecisionDeadlineUrgent()) {
              <span class="pipeline-section__urgent-hint" role="alert" aria-live="polite">
                Deadline in {{ decisionDeadlineDaysAway() }} day{{ decisionDeadlineDaysAway() === 1 ? '' : 's' }}
              </span>
            }
          </div>

          <!-- Follow-up date -->
          <div class="pipeline-section__field">
            <label class="pipeline-section__label" for="ps-follow-up">Follow-up date</label>
            <input
              id="ps-follow-up"
              type="date"
              class="pipeline-section__date-input"
              formControlName="follow_up_date"
            />
          </div>

        </div>

        <!-- Archive toggle -->
        <div class="pipeline-section__field pipeline-section__field--toggle">
          <label class="pipeline-section__toggle-label" for="ps-archived">
            <input
              id="ps-archived"
              type="checkbox"
              class="pipeline-section__checkbox"
              formControlName="is_archived"
            />
            <span class="pipeline-section__toggle-text">Archive this application</span>
          </label>
        </div>

      </div>
    </app-accordion-section>
  `,
  styles: [`
    @use 'design-tokens' as *;
    @use 'mixins' as *;

    .pipeline-section {
      display: flex;
      flex-direction: column;
      gap: $spacing-md;

      &__field {
        display: flex;
        flex-direction: column;
        gap: $spacing-xs;
      }

      &__field--toggle {
        padding-top: $spacing-xs;
      }

      &__label {
        font-size: $font-size-sm;
        font-weight: $font-weight-medium;
        color: $color-foreground;
        line-height: $line-height-snug;
      }

      &__select,
      &__date-input {
        width: 100%;
        height: 2.25rem;
        padding: 0 $spacing-sm;
        border: 1px solid $color-input;
        border-radius: $radius-md;
        background-color: $color-card;
        color: $color-foreground;
        font-size: $font-size-sm;
        line-height: $line-height-normal;
        appearance: auto;
        @include transition(border-color box-shadow, fast);

        &:focus-visible {
          outline: none;
          border-color: $color-ring;
          box-shadow: 0 0 0 3px hsl(221 83% 53% / 0.15);
        }

        &::placeholder {
          color: $color-muted-foreground;
        }
      }

      &__select {
        cursor: pointer;
      }

      &__date-input--urgent {
        border-color: $color-destructive;
        color: $color-destructive;

        &:focus-visible {
          border-color: $color-destructive;
          box-shadow: 0 0 0 3px hsl(0 84% 60% / 0.15);
        }
      }

      &__urgent-hint {
        font-size: $font-size-xs;
        font-weight: $font-weight-medium;
        color: $color-destructive;
        line-height: $line-height-snug;
      }

      &__date-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: $spacing-md;

        @media (min-width: $breakpoint-md) {
          grid-template-columns: 1fr 1fr;
        }
      }

      &__toggle-label {
        display: inline-flex;
        align-items: center;
        gap: $spacing-sm;
        cursor: pointer;
        user-select: none;
      }

      &__checkbox {
        width: 1rem;
        height: 1rem;
        accent-color: $color-primary;
        cursor: pointer;
        flex-shrink: 0;
      }

      &__toggle-text {
        font-size: $font-size-sm;
        font-weight: $font-weight-normal;
        color: $color-foreground;
        line-height: $line-height-snug;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PipelineSectionComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true }) group!: FormGroup;

  readonly statusOptions: ReadonlyArray<{ value: string; label: string }> = [
    { value: ApplicationStatus.WISHLIST, label: 'Wishlist' },
    { value: ApplicationStatus.INTERESTED, label: 'Interested' },
    { value: ApplicationStatus.APPLIED, label: 'Applied' },
    { value: ApplicationStatus.SCREENING, label: 'Screening' },
    { value: ApplicationStatus.TECHNICAL_ROUND, label: 'Technical round' },
    { value: ApplicationStatus.INTERVIEWED, label: 'Interviewed' },
    { value: ApplicationStatus.OFFER_RECEIVED, label: 'Offer received' },
    { value: ApplicationStatus.ACCEPTED, label: 'Accepted' },
    { value: ApplicationStatus.OFFER_DECLINED, label: 'Offer declined' },
    { value: ApplicationStatus.REJECTED, label: 'Rejected' },
    { value: ApplicationStatus.WITHDRAWN, label: 'Withdrawn' },
  ];

  readonly priorityOptions: SegmentedOption[] = [
    { value: ApplicationPriority.TOP_CHOICE, label: 'Urgent' },
    { value: ApplicationPriority.HIGH, label: 'High' },
    { value: ApplicationPriority.MEDIUM, label: 'Medium' },
    { value: ApplicationPriority.LOW, label: 'Low' },
  ];

  readonly appliedViaOptions: ReadonlyArray<{ value: string; label: string }> = [
    { value: AppliedVia.EASY_APPLY, label: 'Easy Apply' },
    { value: AppliedVia.COMPANY_PORTAL, label: 'Company portal' },
    { value: AppliedVia.EMAIL, label: 'Email' },
    { value: AppliedVia.RECRUITER, label: 'Recruiter' },
    { value: AppliedVia.REFERRAL, label: 'Referral' },
    { value: AppliedVia.OTHER, label: 'Other' },
  ];

  /** Reactive signal tracking `decision_deadline` form control value. */
  private readonly decisionDeadlineValue = signal<string | null>(null);

  ngOnInit(): void {
    const ctrl = this.group.get('decision_deadline');
    if (ctrl) {
      this.decisionDeadlineValue.set(ctrl.value as string | null);
      ctrl.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((v: string | null) => {
          this.decisionDeadlineValue.set(v);
        });
    }
  }

  /** Number of full calendar days until decision deadline (negative = past). */
  decisionDeadlineDaysAway(): number {
    const v = this.decisionDeadlineValue();
    if (!v) {
      return Infinity;
    }
    const deadline = new Date(`${v}T12:00:00.000Z`);
    const now = new Date();
    const msPerDay = 86_400_000;
    return Math.ceil((deadline.getTime() - now.getTime()) / msPerDay);
  }

  /** True when deadline is non-null and <= 3 days away (including today and past). */
  isDecisionDeadlineUrgent(): boolean {
    const v = this.decisionDeadlineValue();
    if (!v) {
      return false;
    }
    return this.decisionDeadlineDaysAway() <= 3;
  }
}
