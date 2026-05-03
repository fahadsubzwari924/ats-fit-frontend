import { Component, Input, forwardRef, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgClass, NgFor } from '@angular/common';

export interface SegmentedOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-segmented-control',
  standalone: true,
  imports: [NgClass, NgFor],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SegmentedControlComponent),
      multi: true,
    },
  ],
  template: `
    <div
      class="segmented-control"
      role="group"
      [attr.aria-label]="ariaLabel || null"
      [class.segmented-control--disabled]="isDisabled"
      (keydown)="onKeyDown($event)"
    >
      <button
        *ngFor="let option of options"
        #optionBtn
        type="button"
        role="radio"
        class="segmented-control__option"
        [ngClass]="{ 'segmented-control__option--active': option.value === selected }"
        [attr.aria-checked]="option.value === selected"
        [attr.tabindex]="option.value === selected ? 0 : -1"
        [disabled]="isDisabled"
        (click)="select(option.value)"
      >
        {{ option.label }}
      </button>
    </div>
  `,
  styles: [`
    @use 'design-tokens' as *;
    @use 'mixins' as *;

    :host {
      display: inline-block;
    }

    .segmented-control {
      display: inline-flex;
      align-items: center;
      gap: $spacing-xs;
      padding: $spacing-xs;
      background-color: $color-muted;
      border-radius: $radius-lg;

      &--disabled {
        opacity: 0.5;
        pointer-events: none;
      }

      &__option {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: $spacing-xs $spacing-md;
        border: none;
        border-radius: $radius-md;
        background: transparent;
        font-size: $font-size-sm;
        font-weight: $font-weight-medium;
        color: $color-muted-foreground;
        cursor: pointer;
        white-space: nowrap;
        line-height: $line-height-snug;
        @include transition(color background-color box-shadow, fast);
        user-select: none;

        &:focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px $color-background, 0 0 0 4px $color-ring;
          border-radius: $radius-md;
        }

        &:hover:not(:disabled):not(.segmented-control__option--active) {
          color: $color-foreground;
          background-color: hsl(222 47% 11% / 0.06);
        }

        &--active {
          background-color: $color-card;
          color: $color-foreground;
          box-shadow: $shadow-sm;

          &:hover {
            background-color: $color-card;
          }
        }
      }
    }
  `],
})
export class SegmentedControlComponent implements ControlValueAccessor {
  @Input() options: SegmentedOption[] = [];
  @Input() ariaLabel = '';

  @ViewChildren('optionBtn') optionButtons!: QueryList<ElementRef<HTMLButtonElement>>;

  selected: string | null = null;
  isDisabled = false;

  private propagateChange: (value: string | null) => void = () => void 0;
  private notifyTouched: () => void = () => void 0;

  // --- ControlValueAccessor ---

  writeValue(value: unknown): void {
    this.selected = typeof value === 'string' ? value : null;
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.notifyTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  // --- Interaction ---

  select(value: string): void {
    if (this.isDisabled) return;
    this.selected = value;
    this.propagateChange(value);
    this.notifyTouched();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (this.isDisabled || this.options.length === 0) return;
    const isNext = event.key === 'ArrowRight' || event.key === 'ArrowDown';
    const isPrev = event.key === 'ArrowLeft' || event.key === 'ArrowUp';
    if (!isNext && !isPrev) return;

    event.preventDefault();
    const currentIndex = this.options.findIndex((o) => o.value === this.selected);
    const total = this.options.length;
    const nextIndex = isNext
      ? (currentIndex + 1) % total
      : (currentIndex - 1 + total) % total;
    this.select(this.options[nextIndex].value);

    const buttons = this.optionButtons.toArray();
    if (buttons[nextIndex]) {
      buttons[nextIndex].nativeElement.focus();
    }
  }
}
