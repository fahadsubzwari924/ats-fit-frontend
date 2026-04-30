import { Component, inject, signal, OnInit, OnDestroy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '@features/authentication/services/auth.service';
import { InputFieldComponent } from '@shared/components/ui/input-field/input-field.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { InlineAlertComponent } from '@shared/components/ui/inline-alert/inline-alert.component';
import { Messages } from '@core/enums/messages.enum';
import { InputType } from '@shared/components/ui/input-field/enum/input-type.enum';
import { AppRoutes } from '@core/constants/app-routes.contant';

type TokenState = 'checking' | 'valid' | 'invalid';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatIconModule,
    InputFieldComponent,
    ButtonComponent,
    InlineAlertComponent,
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  public AppRoutes = AppRoutes;
  public InputType = InputType;

  public resetForm!: FormGroup;
  public tokenState = signal<TokenState>('checking');
  public emailHint = signal<string | null>(null);
  public isSubmitting = signal(false);
  public errorMessage = signal<string | null>(null);
  public successMessage = signal<string | null>(null);
  public passwordFieldType = signal<string>(InputType.PASSWORD);
  public confirmPasswordFieldType = signal<string>(InputType.PASSWORD);

  private token: string | null = null;
  private _redirectTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');

    this.resetForm = this.fb.group(
      {
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordsMatchValidator },
    );

    if (!this.token) {
      this.tokenState.set('invalid');
      return;
    }

    this.authService.validateResetToken(this.token).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => {
        if (result.valid) {
          this.tokenState.set('valid');
          this.emailHint.set(result.emailHint ?? null);
        } else {
          this.tokenState.set('invalid');
        }
      },
      error: () => this.tokenState.set('invalid'),
    });
  }

  ngOnDestroy(): void {
    if (this._redirectTimer !== null) {
      clearTimeout(this._redirectTimer);
    }
  }

  private passwordsMatchValidator(
    group: AbstractControl,
  ): ValidationErrors | null {
    const pw = group.get('newPassword')?.value;
    const confirm = group.get('confirmPassword')?.value;
    if (!pw || !confirm) return null;
    return pw === confirm ? null : { passwordsMismatch: true };
  }

  public togglePasswordVisibility(): void {
    this.passwordFieldType.set(
      this.passwordFieldType() === InputType.PASSWORD
        ? InputType.TEXT
        : InputType.PASSWORD,
    );
  }

  public toggleConfirmPasswordVisibility(): void {
    this.confirmPasswordFieldType.set(
      this.confirmPasswordFieldType() === InputType.PASSWORD
        ? InputType.TEXT
        : InputType.PASSWORD,
    );
  }

  public submit(): void {
    if (this.isSubmitting() || this.resetForm.invalid || !this.token) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);
    this.resetForm.disable({ emitEvent: false });

    this.authService
      .resetPassword(this.token, this.resetForm.value.newPassword as string)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.resetForm.enable({ emitEvent: false });
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage.set(Messages.RESET_PASSWORD_SUCCESS);
          this._redirectTimer = setTimeout(() => this.router.navigateByUrl(AppRoutes.SIGNIN), 3000);
        },
        error: () => {
          this.errorMessage.set(Messages.RESET_PASSWORD_FAILED);
        },
      });
  }
}
