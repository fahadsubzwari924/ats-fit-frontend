import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
// Components
import { InputFieldComponent } from '@shared/components/ui/input-field/input-field.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { InlineAlertComponent } from '@shared/components/ui/inline-alert/inline-alert.component';
// Services
import { AuthService } from '@features/authentication/services/auth.service';
// Enums
import { Messages } from '@core/enums/messages.enum';
import { InputType } from '@shared/components/ui/input-field/enum/input-type.enum';
// Constants
import { AppRoutes } from '@core/constants/app-routes.contant';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, InputFieldComponent, MatIconModule, ButtonComponent, InlineAlertComponent],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  public signupForm!: FormGroup;
  public errorMessage = signal<string | null>(null);

  passwordFieldType = signal<string>(InputType.PASSWORD);
  confirmPasswordFieldType = signal<string>(InputType.PASSWORD);
  InputType = InputType;

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.signupForm = this.fb.group(
      {
        full_name: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
        terms: [false, [Validators.requiredTrue]],
      },
      { validators: this.passwordsMatchValidator },
    );
  }

  passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (!password || !confirmPassword) {
      return null;
    }

    return password === confirmPassword ? null : { passwordsMismatch: true };
  }

  togglePasswordVisibility(): void {
    this.passwordFieldType.set(
      this.passwordFieldType() === InputType.PASSWORD ? InputType.TEXT : InputType.PASSWORD,
    );
  }

  toggleConfirmPasswordVisibility(): void {
    this.confirmPasswordFieldType.set(
      this.confirmPasswordFieldType() === InputType.PASSWORD ? InputType.TEXT : InputType.PASSWORD,
    );
  }

  get isTermsInvalid(): boolean {
    const termsControl = this.signupForm.get('terms');
    return termsControl ? termsControl.invalid && termsControl.touched : false;
  }

  submit(): void {
    if (this.signupForm.invalid) {
      return;
    }

    this.errorMessage.set(null);

    const payload = {
      full_name: this.signupForm.value.full_name,
      email: this.signupForm.value.email,
      password: this.signupForm.value.password,
    };

    this.authService.signup(payload as Record<string, unknown>).subscribe({
      next: () => {
        this.router.navigate([AppRoutes.SIGNIN], { queryParams: { registered: 'true' } });
      },
      error: (error) => {
        this.errorMessage.set(error?.error?.message || error?.message || Messages.SIGNUP_FAILED);
        console.error('Signup failed', error);
      },
    });
  }
}
