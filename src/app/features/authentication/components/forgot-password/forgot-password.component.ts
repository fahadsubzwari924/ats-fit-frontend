import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '@features/authentication/services/auth.service';
import { InputFieldComponent } from '@shared/components/ui/input-field/input-field.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { InlineAlertComponent } from '@shared/components/ui/inline-alert/inline-alert.component';
import { Messages } from '@core/enums/messages.enum';
import { AppRoutes } from '@core/constants/app-routes.contant';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    InputFieldComponent,
    ButtonComponent,
    InlineAlertComponent,
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent implements OnInit {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  public AppRoutes = AppRoutes;
  public forgotForm!: FormGroup;
  public isSubmitting = signal(false);
  public errorMessage = signal<string | null>(null);
  public successMessage = signal<string | null>(null);
  public submittedEmail = signal<string | null>(null);

  ngOnInit(): void {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  public submit(): void {
    if (this.isSubmitting()) return;
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);
    this.forgotForm.disable({ emitEvent: false });

    this.authService
      .forgotPassword(this.forgotForm.value.email as string)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.forgotForm.enable({ emitEvent: false });
        }),
      )
      .subscribe({
        next: () => {
          this.submittedEmail.set(this.forgotForm.value.email as string);
          this.successMessage.set(Messages.FORGOT_PASSWORD_SUCCESS);
        },
        error: () => {
          this.errorMessage.set(Messages.FORGOT_PASSWORD_FAILED);
        },
      });
  }

  public resetForm(): void {
    this.successMessage.set(null);
    this.submittedEmail.set(null);
    this.errorMessage.set(null);
    this.forgotForm.reset();
    this.forgotForm.enable({ emitEvent: false });
  }
}
