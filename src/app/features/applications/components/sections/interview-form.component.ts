import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { JobApplicationInterview } from '@features/applications/models/interview/job-application-interview.model';
import {
  JobApplicationInterviewCreatePayload,
} from '@features/applications/models/interview/job-application-interview-create-payload.model';
import {
  JobApplicationInterviewUpdatePayload,
} from '@features/applications/models/interview/job-application-interview-update-payload.model';
import { InterviewFormat } from '@features/applications/models/enums/interview-format.enum';
import { InterviewOutcome } from '@features/applications/models/enums/interview-outcome.enum';
import { InterviewStage } from '@features/applications/models/enums/interview-stage.enum';

@Component({
  selector: 'app-interview-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="interview-form" novalidate>

      <div class="interview-form__row interview-form__row--two-col">
        <!-- Stage (required) -->
        <div class="interview-form__field">
          <label class="interview-form__label" for="interview-stage">
            Stage <span class="interview-form__required" aria-hidden="true">*</span>
          </label>
          <select
            id="interview-stage"
            class="interview-form__select"
            formControlName="stage"
            [class.interview-form__select--error]="form.controls['stage'].invalid && form.controls['stage'].touched"
          >
            <option value="">— Select stage —</option>
            <option [value]="InterviewStage.RECRUITER_SCREEN">Recruiter Screen</option>
            <option [value]="InterviewStage.HR_SCREEN">HR Screen</option>
            <option [value]="InterviewStage.TAKE_HOME">Take Home</option>
            <option [value]="InterviewStage.TECHNICAL">Technical</option>
            <option [value]="InterviewStage.SYSTEM_DESIGN">System Design</option>
            <option [value]="InterviewStage.BEHAVIORAL">Behavioral</option>
            <option [value]="InterviewStage.HIRING_MANAGER">Hiring Manager</option>
            <option [value]="InterviewStage.ONSITE_LOOP">Onsite Loop</option>
            <option [value]="InterviewStage.FINAL">Final</option>
            <option [value]="InterviewStage.OTHER">Other</option>
          </select>
          @if (form.controls['stage'].invalid && form.controls['stage'].touched) {
            <span class="interview-form__error" role="alert">Stage is required</span>
          }
        </div>

        <!-- Format -->
        <div class="interview-form__field">
          <label class="interview-form__label" for="interview-format">Format</label>
          <select
            id="interview-format"
            class="interview-form__select"
            formControlName="format"
          >
            <option value="">— Select format —</option>
            <option [value]="InterviewFormat.PHONE">Phone</option>
            <option [value]="InterviewFormat.VIDEO">Video</option>
            <option [value]="InterviewFormat.IN_PERSON">In Person</option>
          </select>
        </div>
      </div>

      <div class="interview-form__row interview-form__row--two-col">
        <!-- Scheduled at -->
        <div class="interview-form__field">
          <label class="interview-form__label" for="interview-scheduled-at">Scheduled date</label>
          <input
            id="interview-scheduled-at"
            type="datetime-local"
            class="interview-form__input"
            formControlName="scheduled_at"
          />
        </div>

        <!-- Outcome -->
        <div class="interview-form__field">
          <label class="interview-form__label" for="interview-outcome">Outcome</label>
          <select
            id="interview-outcome"
            class="interview-form__select"
            formControlName="outcome"
          >
            <option value="">— Select outcome —</option>
            <option [value]="InterviewOutcome.PENDING">Pending</option>
            <option [value]="InterviewOutcome.PASSED">Passed</option>
            <option [value]="InterviewOutcome.FAILED">Failed</option>
            <option [value]="InterviewOutcome.NO_SHOW">No Show</option>
            <option [value]="InterviewOutcome.CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      <div class="interview-form__row interview-form__row--two-col">
        <!-- Interviewer name -->
        <div class="interview-form__field">
          <label class="interview-form__label" for="interview-interviewer-name">Interviewer name</label>
          <input
            id="interview-interviewer-name"
            type="text"
            class="interview-form__input"
            formControlName="interviewer_name"
            placeholder="John Smith"
            autocomplete="off"
          />
        </div>

        <!-- Interviewer email -->
        <div class="interview-form__field">
          <label class="interview-form__label" for="interview-interviewer-email">Interviewer email</label>
          <input
            id="interview-interviewer-email"
            type="email"
            class="interview-form__input"
            formControlName="interviewer_email"
            placeholder="interviewer@company.com"
            autocomplete="off"
            [class.interview-form__input--error]="form.controls['interviewer_email'].invalid && form.controls['interviewer_email'].touched"
          />
          @if (form.controls['interviewer_email'].invalid && form.controls['interviewer_email'].touched) {
            <span class="interview-form__error" role="alert">Invalid email address</span>
          }
        </div>
      </div>

      <!-- Location or link -->
      <div class="interview-form__row">
        <div class="interview-form__field interview-form__field--full">
          <label class="interview-form__label" for="interview-location">Location or meeting link</label>
          <input
            id="interview-location"
            type="text"
            class="interview-form__input"
            formControlName="location_or_link"
            placeholder="e.g. https://meet.google.com/… or Office Room 2B"
            autocomplete="off"
          />
        </div>
      </div>

      <!-- Notes -->
      <div class="interview-form__row">
        <div class="interview-form__field interview-form__field--full">
          <label class="interview-form__label" for="interview-notes">Notes</label>
          <textarea
            id="interview-notes"
            class="interview-form__textarea"
            formControlName="notes"
            placeholder="Topics covered, feedback, next steps…"
            rows="3"
          ></textarea>
        </div>
      </div>

      <!-- Actions -->
      <div class="interview-form__actions">
        <button
          type="button"
          class="interview-form__btn interview-form__btn--cancel"
          (click)="onCancel()"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="interview-form__btn interview-form__btn--submit"
          [disabled]="form.invalid"
        >
          {{ isEditMode ? 'Update interview' : 'Add interview' }}
        </button>
      </div>

    </form>
  `,
  styles: [`
    @use 'design-tokens' as *;

    .interview-form {
      display: flex;
      flex-direction: column;
      gap: $spacing-sm;
      padding-top: $spacing-sm;

      &__row {
        display: flex;
        flex-direction: column;
        gap: $spacing-sm;

        &--two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: $spacing-sm;

          @media (max-width: 420px) {
            grid-template-columns: 1fr;
          }
        }
      }

      &__field {
        display: flex;
        flex-direction: column;
        gap: $spacing-xs;
        min-width: 0;

        &--full {
          grid-column: 1 / -1;
        }
      }

      &__label {
        font-size: $font-size-xs;
        font-weight: $font-weight-semibold;
        color: $color-muted-foreground;
        letter-spacing: 0.02em;
        line-height: $line-height-snug;
      }

      &__required {
        color: $color-destructive;
        margin-left: 2px;
      }

      &__input,
      &__select,
      &__textarea {
        width: 100%;
        padding: $spacing-xs $spacing-sm;
        font-size: $font-size-sm;
        color: $color-foreground;
        background-color: $color-card;
        border: 1px solid $color-border;
        border-radius: $radius-md;
        line-height: $line-height-normal;
        transition: border-color $transition-fast $easing-ease-in-out,
                    box-shadow $transition-fast $easing-ease-in-out;
        box-sizing: border-box;

        &:focus {
          outline: none;
          border-color: $color-ring;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
        }

        &--error {
          border-color: $color-destructive;

          &:focus {
            box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.15);
          }
        }
      }

      &__select {
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right $spacing-sm center;
        padding-right: $spacing-xl;
        cursor: pointer;
      }

      &__textarea {
        resize: vertical;
        min-height: 72px;
      }

      &__error {
        font-size: $font-size-xs;
        color: $color-destructive;
        line-height: $line-height-snug;
      }

      &__actions {
        display: flex;
        justify-content: flex-end;
        gap: $spacing-sm;
        padding-top: $spacing-xs;
      }

      &__btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: $spacing-xs $spacing-md;
        font-size: $font-size-sm;
        font-weight: $font-weight-medium;
        border-radius: $radius-md;
        border: 1px solid transparent;
        cursor: pointer;
        transition: background-color $transition-fast $easing-ease-in-out,
                    border-color $transition-fast $easing-ease-in-out,
                    color $transition-fast $easing-ease-in-out;

        &:focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px $color-ring;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        &--cancel {
          background-color: transparent;
          border-color: $color-border;
          color: $color-muted-foreground;

          &:hover:not(:disabled) {
            background-color: $color-accent;
            color: $color-foreground;
          }
        }

        &--submit {
          background-color: $color-primary;
          color: $color-primary-foreground;

          &:hover:not(:disabled) {
            background-color: hsl(221 83% 45%);
          }
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InterviewFormComponent implements OnChanges {
  @Input() initial: JobApplicationInterview | null = null;
  @Output() submitted = new EventEmitter<
    JobApplicationInterviewCreatePayload | JobApplicationInterviewUpdatePayload
  >();
  @Output() cancelled = new EventEmitter<void>();

  readonly InterviewStage = InterviewStage;
  readonly InterviewFormat = InterviewFormat;
  readonly InterviewOutcome = InterviewOutcome;

  private readonly fb = inject(FormBuilder);

  readonly form: FormGroup = this.fb.group({
    stage: ['', Validators.required],
    format: [''],
    outcome: [''],
    scheduled_at: [null as string | null],
    interviewer_name: [''],
    interviewer_email: ['', [Validators.email]],
    location_or_link: [''],
    notes: [''],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initial']) {
      this.patchForm(this.initial);
    }
  }

  get isEditMode(): boolean {
    return this.initial !== null;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue() as {
      stage: string;
      format: string;
      outcome: string;
      scheduled_at: string | null;
      interviewer_name: string;
      interviewer_email: string;
      location_or_link: string;
      notes: string;
    };

    if (this.initial === null) {
      // Create payload — stage is required, rest are optional (omit empty strings)
      const payload: JobApplicationInterviewCreatePayload = {
        stage: raw.stage as InterviewStage,
      };
      if (raw.format) {
        payload.format = raw.format as InterviewFormat;
      }
      if (raw.outcome) {
        payload.outcome = raw.outcome as InterviewOutcome;
      }
      if (raw.scheduled_at) {
        payload.scheduled_at = new Date(raw.scheduled_at).toISOString();
      }
      if (raw.interviewer_name.trim()) {
        payload.interviewer_name = raw.interviewer_name.trim();
      }
      if (raw.interviewer_email.trim()) {
        payload.interviewer_email = raw.interviewer_email.trim();
      }
      if (raw.location_or_link.trim()) {
        payload.location_or_link = raw.location_or_link.trim();
      }
      if (raw.notes.trim()) {
        payload.notes = raw.notes.trim();
      }
      this.submitted.emit(payload);
    } else {
      // Update payload — only include populated fields
      const payload: JobApplicationInterviewUpdatePayload = {};
      if (raw.stage) {
        payload.stage = raw.stage as InterviewStage;
      }
      if (raw.format) {
        payload.format = raw.format as InterviewFormat;
      }
      if (raw.outcome) {
        payload.outcome = raw.outcome as InterviewOutcome;
      }
      if (raw.scheduled_at) {
        payload.scheduled_at = new Date(raw.scheduled_at).toISOString();
      }
      if (raw.interviewer_name.trim()) {
        payload.interviewer_name = raw.interviewer_name.trim();
      }
      if (raw.interviewer_email.trim()) {
        payload.interviewer_email = raw.interviewer_email.trim();
      }
      if (raw.location_or_link.trim()) {
        payload.location_or_link = raw.location_or_link.trim();
      }
      if (raw.notes.trim()) {
        payload.notes = raw.notes.trim();
      }
      this.submitted.emit(payload);
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  private patchForm(interview: JobApplicationInterview | null): void {
    if (interview === null) {
      this.form.reset({
        stage: '',
        format: '',
        outcome: '',
        scheduled_at: null,
        interviewer_name: '',
        interviewer_email: '',
        location_or_link: '',
        notes: '',
      });
      return;
    }

    this.form.patchValue({
      stage: interview.stage ?? '',
      format: interview.format ?? '',
      outcome: interview.outcome ?? '',
      scheduled_at: interview.scheduledAt
        ? this.toDatetimeLocalValue(interview.scheduledAt)
        : null,
      interviewer_name: interview.interviewerName ?? '',
      interviewer_email: interview.interviewerEmail ?? '',
      location_or_link: interview.locationOrLink ?? '',
      notes: interview.notes ?? '',
    });
    this.form.markAsPristine();
  }

  /** Converts an ISO string to the value expected by datetime-local inputs. */
  private toDatetimeLocalValue(iso: string): string {
    if (!iso) {
      return '';
    }
    try {
      const d = new Date(iso);
      // Format: YYYY-MM-DDTHH:mm
      const pad = (n: number): string => n.toString().padStart(2, '0');
      return (
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
        `T${pad(d.getHours())}:${pad(d.getMinutes())}`
      );
    } catch {
      return '';
    }
  }
}
