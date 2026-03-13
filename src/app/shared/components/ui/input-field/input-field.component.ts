import { Component, forwardRef, input, output, computed, effect } from '@angular/core';
import { AbstractControl, FormControl, FormsModule, NG_VALIDATORS, NG_VALUE_ACCESSOR, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { InputFieldCustomValidator } from '@shared/components/ui/input-field/interface/input-field-custom-validator.interface';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-input-field',
  standalone: true,
  imports: [FormsModule, FormsModule, ReactiveFormsModule],
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
export class InputFieldComponent {

  // Component Inputs
  public label = input<string>('');
  public type = input<string>('text');
  public placeholder = input<string>('');
  public id = input<string>('');
  public required = input<boolean>(false);
  public customEvents = input<string[]>([]);
  public customValidators = input<InputFieldCustomValidator[]>([]);
  public minLength = input<number | null>(null);
  public maxLength = input<number | null>(null);

  // Component Outputs
  public onInput = output<Event>();
  public onChangeEvent = output<Event>();
  public onBlur = output<Event>();
  public onFocus = output<Event>();
  public onKeydown = output<KeyboardEvent>();
  public onKeyup = output<KeyboardEvent>();
  public onKeypress = output<KeyboardEvent>();
  public onClick = output<MouseEvent>();
  public customEvent = output<{ eventName: string; event: Event }>();

  // ControlValueAccessor properties
  public onChange: (value: any) => void = () => {};
  public onTouched: () => void = () => {};
  public control: FormControl = new FormControl('');

  private subscriptions$ = new Subscription();

  // Signal to track error messages
  public errorMessages = computed(() => {
    if (!this.control.errors || !(this.control.touched || this.control.dirty)) {
      return [];
    }
    return Object.keys(this.control.errors).map(errorKey => {
      const customValidator = this.customValidators().find(v => v.errorKey === errorKey);
      return customValidator ? customValidator.errorMessage : this.getDefaultErrorMessage(errorKey);
    });
  });

  constructor() {
    // Debug effect to log control state
    effect(() => {
      console.log('Control state:', {
        value: this.control.value,
        errors: this.control.errors,
        touched: this.control.touched,
        dirty: this.control.dirty,
      });
    });
  }

  writeValue(value: any): void {
    this.control.setValue(value, { emitEvent: false });
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
    // Sync with FormControl
    this.subscriptions$ = this.control.valueChanges.subscribe((value) => fn(value));
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
    this.control.statusChanges.subscribe(() => {
      if (this.control.touched) {
        fn();
      }
    });
  }

  setDisabledState(isDisabled: boolean): void {
    isDisabled ? this.control.disable() : this.control.enable();
  }

  validate(control: AbstractControl): ValidationErrors | null {
    this.control = control as FormControl; // Update the control instance

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
    const errorMessagesMap: { [key: string]: string } = {
      required: `${this.label()} is required`,
      email: `Please enter a valid email address`,
      minlength: `Minimum leng th is ${this.control.errors?.['minlength']?.requiredLength} characters`,
      maxlength: `Maximum length is ${this.control.errors?.['maxlength']?.requiredLength} characters`,
      pattern: `${this.label()} does not match the required pattern`,
    };

    return errorMessagesMap[errorKey] || `Invalid ${this.label()}`;
  }

  emitCustomEvent(event: Event): void {
    const customEvents = this.customEvents();
    if (customEvents?.includes(event.type)) {
      this.customEvent.emit({ eventName: event.type, event });
    }
  }

  ngOnDestroy() {
    this.subscriptions$.unsubscribe();
  }
}
