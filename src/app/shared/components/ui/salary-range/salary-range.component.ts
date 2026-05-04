import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SalaryRangeValue {
  min: number | null;
  max: number | null;
}

@Component({
  selector: 'app-salary-range',
  standalone: true,
  imports: [],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SalaryRangeComponent),
      multi: true,
    },
  ],
  template: `
    <div class="salary-range">
      <!-- Min input -->
      <div class="salary-range__field">
        @if (showLabels) {
          <label class="salary-range__label" [attr.for]="minId">Min</label>
        }
        <div class="salary-range__input-wrap" [class.salary-range__input-wrap--focused]="minFocused">
          @if (currency) {
            <span class="salary-range__prefix">{{ currency }}</span>
          }
          <input
            [id]="minId"
            type="number"
            class="salary-range__input"
            [class.salary-range__input--with-prefix]="!!currency"
            placeholder="0"
            [disabled]="isDisabled"
            [value]="value.min ?? ''"
            (input)="onMinInput($event)"
            (focus)="minFocused = true"
            (blur)="onBlur(); minFocused = false"
            [attr.aria-label]="'Minimum ' + (currency ? currency + ' ' : '') + 'salary'"
            min="0"
          />
        </div>
      </div>

      <!-- Separator -->
      <span class="salary-range__separator" aria-hidden="true">—</span>

      <!-- Max input -->
      <div class="salary-range__field">
        @if (showLabels) {
          <label class="salary-range__label" [attr.for]="maxId">Max</label>
        }
        <div class="salary-range__input-wrap" [class.salary-range__input-wrap--focused]="maxFocused">
          @if (currency) {
            <span class="salary-range__prefix">{{ currency }}</span>
          }
          <input
            [id]="maxId"
            type="number"
            class="salary-range__input"
            [class.salary-range__input--with-prefix]="!!currency"
            placeholder="0"
            [disabled]="isDisabled"
            [value]="value.max ?? ''"
            (input)="onMaxInput($event)"
            (focus)="maxFocused = true"
            (blur)="onBlur(); maxFocused = false"
            [attr.aria-label]="'Maximum ' + (currency ? currency + ' ' : '') + 'salary'"
            min="0"
          />
        </div>
      </div>
    </div>
  `,
  styles: [`
    @use 'design-tokens' as *;
    @use 'mixins' as *;

    :host {
      display: block;
      width: 100%;
    }

    .salary-range {
      display: flex;
      align-items: flex-end;
      gap: $spacing-sm;

      &__field {
        flex: 1 1 0;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: $spacing-xs;
      }

      &__label {
        font-size: $font-size-sm;
        font-weight: $font-weight-medium;
        color: $color-muted-foreground;
        line-height: $line-height-snug;
      }

      &__separator {
        flex-shrink: 0;
        margin-bottom: 0.625rem;
        color: $color-muted-foreground;
        font-size: $font-size-sm;
        line-height: 1;
      }

      &__input-wrap {
        position: relative;
        display: flex;
        align-items: center;
        border: 1px solid $color-border;
        border-radius: $radius-md;
        background-color: $color-card;
        height: 2.5rem;
        overflow: hidden;
        @include transition(border-color box-shadow, fast);

        &--focused {
          border-color: $color-ring;
          box-shadow: 0 0 0 3px hsl(221 83% 53% / 0.12);
        }
      }

      &__prefix {
        display: flex;
        align-items: center;
        padding: 0 $spacing-sm;
        font-size: $font-size-sm;
        color: $color-muted-foreground;
        border-right: 1px solid $color-border;
        height: 100%;
        flex-shrink: 0;
        user-select: none;
      }

      &__input {
        flex: 1 1 auto;
        min-width: 0;
        height: 100%;
        border: none;
        outline: none;
        background: transparent;
        padding: 0 $spacing-sm;
        font-size: $font-size-sm;
        color: $color-foreground;
        line-height: $line-height-normal;

        /* Remove browser number input arrows */
        -moz-appearance: textfield;
        &::-webkit-inner-spin-button,
        &::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        &::placeholder {
          color: $color-muted-foreground;
        }

        &:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        &--with-prefix {
          padding-left: $spacing-xs;
        }
      }
    }
  `],
})
export class SalaryRangeComponent implements ControlValueAccessor {
  private static nextId = 0;
  private readonly idSuffix = SalaryRangeComponent.nextId++;

  readonly minId = `salary-min-${this.idSuffix}`;
  readonly maxId = `salary-max-${this.idSuffix}`;

  @Input() currency: string | null = null;
  @Input() showLabels = true;

  value: SalaryRangeValue = { min: null, max: null };
  isDisabled = false;
  minFocused = false;
  maxFocused = false;

  private propagateChange: (value: SalaryRangeValue) => void = () => void 0;
  private notifyTouched: () => void = () => void 0;

  // --- ControlValueAccessor ---

  writeValue(value: unknown): void {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const v = value as Partial<SalaryRangeValue>;
      this.value = {
        min: v.min ?? null,
        max: v.max ?? null,
      };
    } else {
      this.value = { min: null, max: null };
    }
  }

  registerOnChange(fn: (value: SalaryRangeValue) => void): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.notifyTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  // --- Interaction ---

  onMinInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const num = Number(raw);
    const min = raw === '' || !Number.isFinite(num) ? null : num;
    this.value = { ...this.value, min };
    this.propagateChange({ ...this.value });
  }

  onMaxInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const num = Number(raw);
    const max = raw === '' || !Number.isFinite(num) ? null : num;
    this.value = { ...this.value, max };
    this.propagateChange({ ...this.value });
  }

  onBlur(): void {
    this.notifyTouched();
  }
}
