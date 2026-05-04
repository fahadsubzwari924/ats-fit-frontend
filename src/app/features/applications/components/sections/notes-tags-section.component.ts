import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AccordionSectionComponent } from '@shared/components/ui/accordion-section/accordion-section.component';
import { ChipInputComponent } from '@shared/components/ui/chip-input/chip-input.component';
import { JobService } from '@features/apply-new-job/services/job.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-notes-tags-section',
  standalone: true,
  imports: [ReactiveFormsModule, AccordionSectionComponent, ChipInputComponent],
  template: `
    <app-accordion-section title="Notes & tags" [expanded]="expanded" (expandedChange)="expandedChange.emit($event)">
      <div class="notes-tags-section">

        <!-- Tags field -->
        <div class="notes-tags-section__field">
          <div class="notes-tags-section__label">Tags</div>
          <app-chip-input
            [formControl]="tagsControl"
            [suggestions]="tagSuggestions()"
            placeholder="Add a tag…"
          />
        </div>

        <!-- Notes field -->
        <div class="notes-tags-section__field">
          <label class="notes-tags-section__label" [for]="notesId">Notes</label>
          <textarea
            [id]="notesId"
            class="notes-tags-section__textarea"
            [formControl]="notesControl"
            placeholder="Add notes about this application…"
            rows="5"
            maxlength="5000"
            (input)="onNotesInput($event)"
          ></textarea>
          <div class="notes-tags-section__hint notes-tags-section__hint--right">
            {{ notesLength() }} / 5000
          </div>
        </div>

      </div>
    </app-accordion-section>
  `,
  styles: [`
    @use 'design-tokens' as *;
    @use 'mixins' as *;

    .notes-tags-section {
      display: flex;
      flex-direction: column;
      gap: $spacing-md;

      &__field {
        display: flex;
        flex-direction: column;
        gap: $spacing-xs;
      }

      &__label {
        font-size: $font-size-sm;
        font-weight: $font-weight-medium;
        color: $color-foreground;
        line-height: $line-height-snug;
      }

      &__textarea {
        width: 100%;
        border: 1px solid $color-border;
        border-radius: $radius-md;
        padding: $spacing-sm $spacing-md;
        font-size: $font-size-sm;
        color: $color-foreground;
        background-color: $color-card;
        line-height: $line-height-normal;
        resize: vertical;
        font-family: inherit;
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

      &__hint {
        font-size: $font-size-xs;
        color: $color-muted-foreground;
        margin-top: 0.25rem;

        &--right {
          text-align: right;
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoteTagsSectionComponent implements OnInit {
  private readonly jobService = inject(JobService);
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true }) notesControl!: FormControl<string | null>;
  @Input({ required: true }) tagsControl!: FormControl<string[]>;
  @Input() expanded = false;
  @Output() expandedChange = new EventEmitter<boolean>();

  readonly notesId = 'notes-' + Math.random().toString(36).slice(2);
  readonly tagSuggestions = signal<string[]>([]);
  readonly notesLength = signal(0);

  ngOnInit(): void {
    this.notesLength.set(this.notesControl.value?.length ?? 0);

    this.jobService
      .getTags()
      .pipe(
        catchError(() => of([])),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((tags) => {
        this.tagSuggestions.set(tags);
      });
  }

  onNotesInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.notesLength.set(target.value.length);
  }
}
