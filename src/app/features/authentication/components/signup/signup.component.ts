import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { finalize } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
// Components
import { InputFieldComponent } from '@shared/components/ui/input-field/input-field.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { InlineAlertComponent } from '@shared/components/ui/inline-alert/inline-alert.component';
// Services
import { AuthService } from '@features/authentication/services/auth.service';
import { StorageService } from '@shared/services/storage.service';
// States
import { UserState } from '@core/states/user.state';
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
  private storageService = inject(StorageService);
  private userState = inject(UserState);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  public signupForm!: FormGroup;
  public errorMessage = signal<string | null>(null);
  public isSubmitting = signal(false);

  passwordFieldType = signal<string>(InputType.PASSWORD);
  confirmPasswordFieldType = signal<string>(InputType.PASSWORD);
  InputType = InputType;

  private _emailPreFilled = false;

  ngOnInit(): void {
    this.initializeForm();
    const email = this.route.snapshot.queryParamMap.get('email');
    if (email) {
      this._emailPreFilled = true;
      this.signupForm.get('email')?.setValue(email);
      this.signupForm.get('email')?.disable();
    }
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
    if (this.isSubmitting()) return;
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);
    this.signupForm.disable({ emitEvent: false });

    const raw = this.signupForm.getRawValue();
    const payload = {
      full_name: raw.full_name,
      email: raw.email,
      password: raw.password,
    };

    this.authService.signup(payload as Record<string, unknown>)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.signupForm.enable({ emitEvent: false });
          if (this._emailPreFilled) {
            this.signupForm.get('email')?.disable({ emitEvent: false });
          }
        }),
      )
      .subscribe({
        next: (response) => {
          // Auto sign-in: store token and user
          this.storageService.setToken(response.accessToken);
          this.userState.setUser(response.user);

          // Navigate: if beta code present go to redeem, otherwise go to dashboard
          // (onboardingGuard on the dashboard layout handles the /onboarding redirect for new users)
          const code = this.route.snapshot.queryParamMap.get('code');
          if (code) {
            this.router.navigateByUrl(`/beta/redeem?code=${encodeURIComponent(code)}`);
          } else {
            this.router.navigateByUrl(AppRoutes.DASHBOARD);
          }
        },
        error: (error) => {
          this.errorMessage.set(error?.error?.message || error?.message || Messages.SIGNUP_FAILED);
          console.error('Signup failed', error);
        },
      });
  }
}
