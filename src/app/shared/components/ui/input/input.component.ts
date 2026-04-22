import { NgClass } from '@angular/common';
import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [NgClass],
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ]
})
export class InputComponent implements ControlValueAccessor {
  private static nextFieldId = 0;
  readonly fieldId = `app-input-${InputComponent.nextFieldId++}`;

  @Input() type = 'text';
  @Input() placeholder = '';
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() label = '';
  @Input() error = '';
  @Input() hint = '';

  value = '';
  private propagateChange: (value: string) => void = () => {
    void 0;
  };
  private notifyTouched: () => void = () => {
    void 0;
  };

  writeValue(value: unknown): void {
    this.value = (value as string) || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.notifyTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.value = value;
    this.propagateChange(value);
  }

  onBlur(): void {
    this.notifyTouched();
  }

  get inputClasses(): string {
    const classes = ['input'];
    if (this.size !== 'md') {
      classes.push(`input--${this.size}`);
    }
    return classes.join(' ');
  }
}
