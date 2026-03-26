import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
//Components
import { InputFieldComponent } from "@shared/components/ui/input-field/input-field.component";
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { GoogleAuthButtonComponent } from "../google-auth-button/google-auth-button.component";
//Services
import { AuthService } from '@features/authentication/services/auth.service';
import { SnackbarService } from '@shared/services/snackbar.service';
// Enums
import { Messages } from '@core/enums/messages.enum';
import { InputType } from '@shared/components/ui/input-field/enum/input-type.enum';
//Interfaces
// Constants
import { AppRoutes } from '@core/constants/app-routes.contant';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, InputFieldComponent, MatIconModule, ButtonComponent, GoogleAuthButtonComponent],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent {

  private authService = inject(AuthService);
  private snackbarService = inject(SnackbarService);
  private router = inject(Router);

  // component internal objects
  public signupForm!: FormGroup;

  // component state
  passwordFieldType = signal<string>(InputType.PASSWORD);
  confirmPasswordFieldType = signal<string>(InputType.PASSWORD);

  InputType = InputType;

  constructor(private fb: FormBuilder) { }

  ngOnInit() {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.signupForm = this.fb.group({
      full_name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      terms: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordsMatchValidator });
  }

  passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordsMismatch: true };
  }

  togglePasswordVisibility() {
    this.passwordFieldType.set(this.passwordFieldType() === InputType.PASSWORD ? InputType.TEXT : InputType.PASSWORD);
  }

  toggleConfirmPasswordVisibility() {
    this.confirmPasswordFieldType.set(this.confirmPasswordFieldType() === InputType.PASSWORD ? InputType.TEXT : InputType.PASSWORD);
  }

  get isTermsInvalid(): boolean {
    const termsControl = this.signupForm.get('terms');
    return termsControl ? termsControl.invalid && termsControl.touched : false;
  }

  submit() {
    if (this.signupForm.invalid) {
      return;
    }
    const payload = {
      full_name: this.signupForm.value.full_name,
      email: this.signupForm.value.email,
      password: this.signupForm.value.password,
    }

    this.authService.signup(payload).subscribe({
      next: (response) => {
        // Handle successful signup response
        this.snackbarService.showSuccess(response.message || Messages.SIGNUP_SUCCESS);
        this.router.navigateByUrl(AppRoutes.SIGNIN);
      },
      error: (error) => {
        this.snackbarService.showError(error?.message || Messages.SIGNUP_FAILED);
        console.error('Signup failed', error);
      }
    });
  }
}
