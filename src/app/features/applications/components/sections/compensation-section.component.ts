import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AccordionSectionComponent } from '@shared/components/ui/accordion-section/accordion-section.component';
import { SalaryRangeComponent, SalaryRangeValue } from '@shared/components/ui/salary-range/salary-range.component';
import { PayPeriod } from '@features/applications/models/enums/pay-period.enum';

/** Cross-field validator: salary_min must not exceed salary_max. */
const salaryMinMaxValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const min = (group as FormGroup).get('salary_min')?.value as number | null;
  const max = (group as FormGroup).get('salary_max')?.value as number | null;
  if (min !== null && max !== null && min > max) {
    return { salaryMinExceedsMax: true };
  }
  return null;
};

@Component({
  selector: 'app-compensation-section',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AccordionSectionComponent,
    SalaryRangeComponent,
  ],
  template: `
    <app-accordion-section title="Compensation" [expanded]="expanded">
      <div class="compensation-section" [formGroup]="group">

        <!-- Salary range row -->
        <div class="compensation-section__row">
          <div class="compensation-section__field compensation-section__field--full">
            <span class="compensation-section__label">Salary range</span>
            <app-salary-range
              [formControl]="salaryRangeControl"
              [showLabels]="true"
            />
            @if (group.hasError('salaryMinExceedsMax') && (group.touched || group.dirty)) {
              <span class="compensation-section__error" role="alert">
                Minimum salary cannot exceed maximum salary.
              </span>
            }
          </div>
        </div>

        <!-- Currency + Pay period row -->
        <div class="compensation-section__row compensation-section__row--two-col">
          <div class="compensation-section__field">
            <label class="compensation-section__label" for="salary-currency">Currency</label>
            <select
              id="salary-currency"
              class="app-detail-drawer__input app-detail-drawer__select app-detail-drawer__input--sm"
              formControlName="salary_currency"
            >
              <option [value]="null">— Select currency —</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="CAD">CAD</option>
              <option value="AUD">AUD</option>
              <option value="INR">INR</option>
              <option value="SGD">SGD</option>
              <option value="AED">AED</option>
            </select>
          </div>

          <div class="compensation-section__field">
            <label class="compensation-section__label" for="pay-period">Pay period</label>
            <select
              id="pay-period"
              class="app-detail-drawer__input app-detail-drawer__select app-detail-drawer__input--sm"
              formControlName="pay_period"
            >
              <option [value]="null">— Select period —</option>
              <option [value]="PayPeriod.HOURLY">Hourly</option>
              <option [value]="PayPeriod.MONTHLY">Monthly</option>
              <option [value]="PayPeriod.ANNUAL">Annually</option>
            </select>
          </div>
        </div>

      </div>
    </app-accordion-section>
  `,
  styles: [`
    @use 'design-tokens' as *;
    @use 'mixins' as *;

    :host {
      display: block;
    }

    .compensation-section {
      display: flex;
      flex-direction: column;
      gap: $spacing-md;

      &__row {
        display: flex;
        flex-direction: column;
        gap: $spacing-md;

        &--two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: $spacing-sm $spacing-md;
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
        line-height: $line-height-snug;
        letter-spacing: 0.02em;
      }

      &__error {
        font-size: $font-size-xs;
        color: $color-destructive;
        line-height: $line-height-snug;
        margin-top: $spacing-xs;
      }
    }

    @media (max-width: 380px) {
      .compensation-section__row--two-col {
        grid-template-columns: 1fr;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompensationSectionComponent implements OnInit, OnDestroy {
  @Input({ required: true }) group!: FormGroup;

  readonly PayPeriod = PayPeriod;

  /** Internal reactive FormControl for the SalaryRangeComponent CVA. */
  readonly salaryRangeControl = new FormBuilder().control<SalaryRangeValue>({ min: null, max: null });

  expanded = false;

  private readonly subscriptions = new Subscription();

  ngOnInit(): void {
    // Auto-open if salary data is already present on load
    const min = this.group.get('salary_min')?.value as number | null;
    const max = this.group.get('salary_max')?.value as number | null;
    if (min !== null || max !== null) {
      this.expanded = true;
    }

    // Seed the composite control from the form group values
    this.salaryRangeControl.setValue({ min: min ?? null, max: max ?? null }, { emitEvent: false });

    // Attach the cross-field validator to the group (non-destructively)
    const existing = this.group.validator;
    this.group.setValidators(
      existing ? [existing, salaryMinMaxValidator] : salaryMinMaxValidator,
    );
    this.group.updateValueAndValidity({ emitEvent: false });

    // Sync composite control → individual salary_min / salary_max controls
    this.subscriptions.add(
      this.salaryRangeControl.valueChanges.subscribe((val) => {
        const v = val as SalaryRangeValue | null;
        this.group.get('salary_min')?.setValue(v?.min ?? null, { emitEvent: true });
        this.group.get('salary_max')?.setValue(v?.max ?? null, { emitEvent: true });
        this.group.get('salary_min')?.markAsDirty();
        this.group.get('salary_max')?.markAsDirty();
        this.group.updateValueAndValidity();
      }),
    );

    // Sync parent form group patches back → composite control (e.g. when Cancel resets)
    this.subscriptions.add(
      this.group.valueChanges.subscribe((v: { salary_min?: number | null; salary_max?: number | null }) => {
        const current = this.salaryRangeControl.value as SalaryRangeValue;
        const newMin = v['salary_min'] ?? null;
        const newMax = v['salary_max'] ?? null;
        if (current?.min !== newMin || current?.max !== newMax) {
          this.salaryRangeControl.setValue({ min: newMin, max: newMax }, { emitEvent: false });
        }
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
