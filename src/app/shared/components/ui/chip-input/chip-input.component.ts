import {
  Component,
  Input,
  forwardRef,
  ElementRef,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chip-input',
  standalone: true,
  imports: [NgClass, NgFor, NgIf, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ChipInputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="chip-input-wrapper" [ngClass]="{ 'chip-input-wrapper--focused': isFocused, 'chip-input-wrapper--disabled': isDisabled }">
      <!-- Chips -->
      <span
        *ngFor="let chip of chips; let i = index"
        class="chip"
      >
        <span class="chip__label">{{ chip }}</span>
        <button
          type="button"
          class="chip__remove"
          [disabled]="isDisabled"
          (click)="removeChip(i)"
          [attr.aria-label]="'Remove ' + chip"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
          </svg>
        </button>
      </span>

      <!-- Text input -->
      <input
        #inputRef
        type="text"
        class="chip-input__text-input"
        [placeholder]="chips.length === 0 ? placeholder : ''"
        [disabled]="isDisabled"
        [(ngModel)]="inputValue"
        (ngModelChange)="onInputChange($event)"
        (keydown)="onKeyDown($event)"
        (focus)="onFocus()"
        (blur)="onBlur()"
        [attr.aria-label]="label || placeholder"
        [attr.aria-autocomplete]="suggestions.length ? 'list' : null"
        autocomplete="off"
      />
    </div>

    <!-- Autocomplete dropdown -->
    <div *ngIf="showDropdown && filteredSuggestions.length > 0" class="chip-input-dropdown" role="listbox">
      <button
        *ngFor="let suggestion of filteredSuggestions; let i = index"
        type="button"
        role="option"
        class="chip-input-dropdown__item"
        [ngClass]="{ 'chip-input-dropdown__item--active': i === activeIndex }"
        (mousedown)="selectSuggestion(suggestion)"
      >
        {{ suggestion }}
      </button>
    </div>
  `,
  styles: [`
    @use 'design-tokens' as *;
    @use 'mixins' as *;

    :host {
      display: block;
      position: relative;
      width: 100%;
    }

    .chip-input-wrapper {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: $spacing-xs;
      min-height: 2.5rem;
      padding: $spacing-xs $spacing-sm;
      border: 1px solid $color-border;
      border-radius: $radius-md;
      background-color: $color-card;
      cursor: text;
      @include transition(border-color box-shadow, fast);

      &--focused {
        border-color: $color-ring;
        box-shadow: 0 0 0 3px hsl(221 83% 53% / 0.12);
        outline: none;
      }

      &--disabled {
        opacity: 0.5;
        cursor: not-allowed;
        background-color: $color-muted;
      }
    }

    .chip {
      display: inline-flex;
      align-items: center;
      gap: $spacing-xs;
      padding: 0.1875rem $spacing-sm;
      background-color: $color-secondary;
      color: $color-secondary-foreground;
      border-radius: $radius-full;
      font-size: $font-size-sm;
      font-weight: $font-weight-medium;
      line-height: $line-height-snug;
      max-width: 100%;

      &__label {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 12rem;
      }

      &__remove {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1rem;
        height: 1rem;
        padding: 0;
        border: none;
        background: transparent;
        color: $color-muted-foreground;
        border-radius: $radius-full;
        cursor: pointer;
        flex-shrink: 0;
        @include transition(color background-color, fast);

        &:hover:not(:disabled) {
          color: $color-foreground;
          background-color: hsl(222 47% 11% / 0.08);
        }

        &:focus-visible {
          outline: 2px solid $color-ring;
          outline-offset: 1px;
        }

        &:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }
      }
    }

    .chip-input__text-input {
      flex: 1 1 6rem;
      min-width: 6rem;
      border: none;
      outline: none;
      background: transparent;
      font-size: $font-size-sm;
      color: $color-foreground;
      line-height: $line-height-normal;
      padding: 0.125rem 0;

      &::placeholder {
        color: $color-muted-foreground;
      }

      &:disabled {
        cursor: not-allowed;
      }
    }

    .chip-input-dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      z-index: 50;
      background-color: $color-popover;
      border: 1px solid $color-border;
      border-radius: $radius-md;
      @include shadow(md);
      overflow: hidden;
      max-height: 14rem;
      overflow-y: auto;

      &__item {
        display: block;
        width: 100%;
        padding: $spacing-sm $spacing-md;
        text-align: left;
        font-size: $font-size-sm;
        color: $color-foreground;
        background: transparent;
        border: none;
        cursor: pointer;
        @include transition(background-color, fast);

        &:hover,
        &--active {
          background-color: $color-accent;
          color: $color-accent-foreground;
        }

        &:focus-visible {
          outline: none;
          background-color: $color-accent;
        }
      }
    }
  `],
})
export class ChipInputComponent implements ControlValueAccessor, OnDestroy {
  @Input() placeholder = 'Add...';
  @Input() label = '';
  @Input() suggestions: string[] = [];

  @ViewChild('inputRef') inputRef!: ElementRef<HTMLInputElement>;

  chips: string[] = [];
  inputValue = '';
  isFocused = false;
  isDisabled = false;
  showDropdown = false;
  activeIndex = -1;

  private blurTimeout: ReturnType<typeof setTimeout> | null = null;

  private propagateChange: (value: string[]) => void = () => void 0;
  private notifyTouched: () => void = () => void 0;

  // --- ControlValueAccessor ---

  writeValue(value: unknown): void {
    this.chips = Array.isArray(value) ? [...(value as string[])] : [];
  }

  registerOnChange(fn: (value: string[]) => void): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.notifyTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  // --- Computed ---

  get filteredSuggestions(): string[] {
    const term = this.inputValue.trim().toLowerCase();
    if (!term) return [];
    return this.suggestions.filter(
      (s) =>
        s.toLowerCase().includes(term) && !this.chips.includes(s),
    );
  }

  // --- Interaction ---

  onInputChange(value: string): void {
    this.inputValue = value;
    this.showDropdown = true;
    this.activeIndex = -1;
  }

  onKeyDown(event: KeyboardEvent): void {
    const dropdown = this.filteredSuggestions;

    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      if (this.activeIndex >= 0 && dropdown[this.activeIndex]) {
        this.selectSuggestion(dropdown[this.activeIndex]);
      } else {
        this.commitInput();
      }
      return;
    }

    if (event.key === 'Backspace' && this.inputValue === '') {
      event.preventDefault();
      this.removeLastChip();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex = Math.min(this.activeIndex + 1, dropdown.length - 1);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex = Math.max(this.activeIndex - 1, -1);
      return;
    }

    if (event.key === 'Escape') {
      this.closeDropdown();
      return;
    }
  }

  onFocus(): void {
    this.isFocused = true;
    this.showDropdown = true;
  }

  onBlur(): void {
    this.isFocused = false;
    // Use a brief timeout so mousedown on a dropdown item fires first
    this.blurTimeout = setTimeout(() => {
      this.closeDropdown();
      this.notifyTouched();
    }, 150);
  }

  ngOnDestroy(): void {
    if (this.blurTimeout !== null) {
      clearTimeout(this.blurTimeout);
    }
  }

  selectSuggestion(suggestion: string): void {
    this.addChip(suggestion);
    this.closeDropdown();
  }

  removeChip(index: number): void {
    this.chips = this.chips.filter((_, i) => i !== index);
    this.propagateChange([...this.chips]);
  }

  removeLastChip(): void {
    if (this.chips.length > 0) {
      this.chips = this.chips.slice(0, -1);
      this.propagateChange([...this.chips]);
    }
  }

  // --- Private ---

  private commitInput(): void {
    const value = this.inputValue.replace(/,/g, '').trim();
    if (value) {
      this.addChip(value);
    }
  }

  private addChip(value: string): void {
    const trimmed = value.trim();
    if (trimmed && !this.chips.includes(trimmed)) {
      this.chips = [...this.chips, trimmed];
      this.propagateChange([...this.chips]);
    }
    this.inputValue = '';
  }

  private closeDropdown(): void {
    this.showDropdown = false;
    this.activeIndex = -1;
  }
}
