import {
  ChangeDetectionStrategy,
  Component,
  Input,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AccordionSectionComponent } from '@shared/components/ui/accordion-section/accordion-section.component';
import { PayPeriod } from '@features/applications/models/enums/pay-period.enum';

@Component({
  selector: 'app-offer-section',
  standalone: true,
  imports: [ReactiveFormsModule, AccordionSectionComponent],
  template: `
    <app-accordion-section title="Offer details" [expanded]="true">
      <div class="offer-section" [formGroup]="group">

        <div class="offer-section__row">
          <div class="offer-section__field">
            <label class="offer-section__label" for="offer-base-salary">Base salary</label>
            <input
              id="offer-base-salary"
              type="number"
              class="offer-section__input app-detail-drawer__input"
              formControlName="base_salary"
              placeholder="0"
            />
          </div>

          <div class="offer-section__field">
            <label class="offer-section__label" for="offer-currency">Currency</label>
            <input
              id="offer-currency"
              type="text"
              class="offer-section__input app-detail-drawer__input"
              formControlName="currency"
              placeholder="USD"
              maxlength="10"
            />
          </div>

          <div class="offer-section__field">
            <label class="offer-section__label" for="offer-period">Period</label>
            <select
              id="offer-period"
              class="offer-section__select app-detail-drawer__input app-detail-drawer__select"
              formControlName="period"
            >
              <option value="">–</option>
              <option [value]="PayPeriod.HOURLY">Hourly</option>
              <option [value]="PayPeriod.MONTHLY">Monthly</option>
              <option [value]="PayPeriod.ANNUAL">Annually</option>
            </select>
          </div>
        </div>

        <div class="offer-section__field">
          <label class="offer-section__label" for="offer-signing-bonus">Signing bonus</label>
          <input
            id="offer-signing-bonus"
            type="number"
            class="offer-section__input app-detail-drawer__input"
            formControlName="signing_bonus"
            placeholder="0"
          />
        </div>

        <div class="offer-section__field">
          <label class="offer-section__label" for="offer-equity">Equity</label>
          <input
            id="offer-equity"
            type="text"
            class="offer-section__input app-detail-drawer__input"
            formControlName="equity"
            placeholder="e.g. 0.1% over 4 years"
          />
        </div>

        <div class="offer-section__field">
          <label class="offer-section__label" for="offer-benefits">Benefits</label>
          <textarea
            id="offer-benefits"
            class="offer-section__textarea app-detail-drawer__input"
            formControlName="benefits_summary"
            rows="3"
            placeholder="Health, dental, PTO…"
          ></textarea>
        </div>

        <div class="offer-section__field">
          <label class="offer-section__label" for="offer-deadline">Deadline to respond</label>
          <input
            id="offer-deadline"
            type="date"
            class="offer-section__input app-detail-drawer__input"
            formControlName="deadline_to_respond"
          />
        </div>

      </div>
    </app-accordion-section>
  `,
  styles: [`
    @use 'design-tokens' as *;

    :host {
      display: block;
    }

    .offer-section {
      display: flex;
      flex-direction: column;
      gap: $spacing-md;

      &__row {
        display: grid;
        grid-template-columns: 1fr 6rem 9rem;
        gap: $spacing-sm $spacing-md;
        align-items: end;
      }

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

      &__input {
        width: 100%;
      }

      &__select {
        width: 100%;
      }

      &__textarea {
        width: 100%;
        resize: vertical;
      }

      &__hint {
        font-size: $font-size-xs;
        color: $color-muted-foreground;
        line-height: $line-height-snug;
      }
    }

    @media (max-width: 480px) {
      .offer-section__row {
        grid-template-columns: 1fr;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferSectionComponent {
  @Input({ required: true }) group!: FormGroup;

  readonly PayPeriod = PayPeriod;
}
