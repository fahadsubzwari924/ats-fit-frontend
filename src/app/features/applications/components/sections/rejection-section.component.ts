import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  signal,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef, inject } from '@angular/core';
import { startWith } from 'rxjs/operators';
import { AccordionSectionComponent } from '@shared/components/ui/accordion-section/accordion-section.component';
import { RejectionStage } from '@features/applications/models/enums/rejection-stage.enum';

@Component({
  selector: 'app-rejection-section',
  standalone: true,
  imports: [ReactiveFormsModule, AccordionSectionComponent],
  template: `
    <app-accordion-section title="Rejection details" [expanded]="true">
      <div class="rejection-section" [formGroup]="group">

        <div class="rejection-section__field">
          <label class="rejection-section__label" for="rejection-stage">Stage</label>
          <select
            id="rejection-stage"
            class="rejection-section__select app-detail-drawer__input app-detail-drawer__select"
            formControlName="rejection_stage"
          >
            <option value="">Select stage…</option>
            <option [value]="RejectionStage.AUTO_REJECTED">Auto rejected</option>
            <option [value]="RejectionStage.AFTER_SCREENING">After screening</option>
            <option [value]="RejectionStage.AFTER_INTERVIEW">After interview</option>
            <option [value]="RejectionStage.AFTER_OFFER_DECLINED">After offer declined</option>
            <option [value]="RejectionStage.OTHER">Other</option>
          </select>
        </div>

        <div class="rejection-section__field">
          <label class="rejection-section__label" for="rejection-reason">Reason</label>
          <textarea
            id="rejection-reason"
            class="rejection-section__textarea app-detail-drawer__input"
            formControlName="rejection_reason"
            rows="3"
            placeholder="Note why the application was rejected…"
            maxlength="1000"
          ></textarea>
          <div class="rejection-section__hint--right">{{ rejectionReasonLength() }} / 1000</div>
        </div>

      </div>
    </app-accordion-section>
  `,
  styles: [`
    @use 'design-tokens' as *;

    :host {
      display: block;
    }

    .rejection-section {
      display: flex;
      flex-direction: column;
      gap: $spacing-md;

      &__field {
        display: flex;
        flex-direction: column;
        gap: $spacing-xs;
        min-width: 0;
      }

      &__label {
        font-size: $font-size-xs;
        font-weight: $font-weight-semibold;
        color: $color-muted-foreground;
        line-height: $line-height-snug;
        letter-spacing: 0.02em;
      }

      &__select {
        width: 100%;
      }

      &__textarea {
        width: 100%;
        resize: vertical;
      }

      &__hint--right {
        font-size: $font-size-xs;
        color: $color-muted-foreground;
        line-height: $line-height-snug;
        text-align: right;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RejectionSectionComponent implements OnInit {
  @Input({ required: true }) group!: FormGroup;

  readonly RejectionStage = RejectionStage;

  readonly rejectionReasonLength = signal(0);

  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.group.controls['rejection_reason'].valueChanges
      .pipe(startWith(this.group.controls['rejection_reason'].value), takeUntilDestroyed(this.destroyRef))
      .subscribe((val: string | null) => {
        this.rejectionReasonLength.set((val ?? '').length);
      });
  }
}
