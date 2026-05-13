import { Component, forwardRef, input, output, effect, signal, OnDestroy } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormsModule,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors,
} from '@angular/forms';
import { InputFieldCustomValidator } from '@shared/components/ui/input-field/interface/input-field-custom-validator.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-input-field',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './input-field.component.html',
  styleUrl: './input-field.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputFieldComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => InputFieldComponent),
      multi: true,
    },
  ],
})
export class InputFieldComponent implements OnDestroy {
  public label = input<string>('');
  public type = input<string>('text');
  public placeholder = input<string>('');
  public id = input<string>('');
  public required = input<boolean>(false);
  public customEvents = input<string[]>([]);
  public customValidators = input<InputFieldCustomValidator[]>([]);
  public minLength = input<number | null>(null);
  public maxLength = input<number | null>(null);

  public fieldInput = output<Event>();
  public domChange = output<Event>();
  public blurEvent = output<Event>();
  public focusEvent = output<Event>();
  public keydownEvent = output<KeyboardEvent>();
  public keyupEvent = output<KeyboardEvent>();
  public keypressEvent = output<KeyboardEvent>();
  public pointerClick = output<MouseEvent>();
  public customEvent = output<{ eventName: string; event: Event }>();

  private propagateChange: (value: unknown) => void = () => {
    void 0;
  };
  private notifyTouched: () => void = () => {
    void 0;
  };
  public control: FormControl = new FormControl('');

  private subscriptions$ = new Subscription();

  public errorMessages(): string[] {
    if (!this.control.errors || !(this.control.touched || this.control.dirty)) {
      return [];
    }
    return Object.keys(this.control.errors).map((errorKey) => {
      // Backend-issued field errors (set via control.setErrors({ server: '...' }))
      // are passed through verbatim — they are already user-facing copy.
      if (errorKey === 'server') {
        const serverMessage = this.control.errors?.['server'];
        if (typeof serverMessage === 'string' && serverMessage.length > 0) {
          return serverMessage;
        }
      }
      const customValidator = this.customValidators().find((v) => v.errorKey === errorKey);
      return customValidator ? customValidator.errorMessage : this.getDefaultErrorMessage(errorKey);
    });
  }

  constructor() {
    effect(() => {
      console.log('Control state:', {
        value: this.control.value,
        errors: this.control.errors,
        touched: this.control.touched,
        dirty: this.control.dirty,
      });
    });
  }

  writeValue(value: unknown): void {
    this.control.setValue(value, { emitEvent: false });
  }

  registerOnChange(fn: (value: unknown) => void): void {
    this.propagateChange = fn;
    this.subscriptions$ = this.control.valueChanges.subscribe((value) => fn(value));
  }

  registerOnTouched(fn: () => void): void {
    this.notifyTouched = fn;
    this.control.statusChanges.subscribe(() => {
      if (this.control.touched) {
        fn();
      }
    });
  }

  public readonly isDisabled = signal(false);

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  validate(control: AbstractControl): ValidationErrors | null {
    this.control = control as FormControl;

    const errors: ValidationErrors = {};

    this.customValidators().forEach(({ validator, errorKey }) => {
      const result = validator(control);
      if (result) {
        errors[errorKey] = result[errorKey] || true;
      }
    });

    return Object.keys(errors).length > 0 ? errors : null;
  }

  private getDefaultErrorMessage(errorKey: string): string {
    const label = this.label() || 'This field';
    const requiredMinLength = this.control.errors?.['minlength']?.requiredLength;
    const requiredMaxLength = this.control.errors?.['maxlength']?.requiredLength;

    const errorMessagesMap: Record<string, string> = {
      required: `${label} is required.`,
      email: 'Please enter a valid email address.',
      minlength: `${label} must be at least ${requiredMinLength} characters.`,
      maxlength: `${label} must be no more than ${requiredMaxLength} characters.`,
      pattern: `${label} format is invalid.`,
    };

    return errorMessagesMap[errorKey] || `${label} is invalid.`;
  }

  emitCustomEvent(event: Event): void {
    const customEvents = this.customEvents();
    if (customEvents?.includes(event.type)) {
      this.customEvent.emit({ eventName: event.type, event });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions$.unsubscribe();
  }

  onModelChange(value: unknown): void {
    this.propagateChange(value);
  }

  onInputBlur(event: Event): void {
    this.notifyTouched();
    this.blurEvent.emit(event);
  }
}

