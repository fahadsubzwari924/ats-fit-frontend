import { ValidatorFn } from "@angular/forms";

export interface InputFieldCustomValidator {
  validator: ValidatorFn;
  errorKey: string;
  errorMessage: string;
}
