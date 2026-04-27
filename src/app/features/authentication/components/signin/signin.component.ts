import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { finalize } from 'rxjs';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
  selector: 'app-signin',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, InputFieldComponent, MatIconModule, ButtonComponent, InlineAlertComponent],
  templateUrl: './signin.component.html',
  styleUrl: './signin.component.scss'
})
export class SigninComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private formbuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private storageService = inject(StorageService);
  private userState = inject(UserState);

  public signinForm!: FormGroup;
  public passwordFieldType = signal<string>(InputType.PASSWORD);
  public InputType = InputType;
  public isSubmitting = signal(false);
  public errorMessage = signal<string | null>(null);
  public showRegistrationBanner = signal(false);

  private _bannerTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.initializeForm();
    this.checkRegistrationParam();
  }

  ngOnDestroy(): void {
    if (this._bannerTimer !== null) {
      clearTimeout(this._bannerTimer);
    }
  }

  private initializeForm(): void {
    this.signinForm = this.formbuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  private checkRegistrationParam(): void {
    const registered = this.route.snapshot.queryParamMap.get('registered');
    if (registered === 'true') {
      this.showRegistrationBanner.set(true);
      this._bannerTimer = setTimeout(() => {
        this.showRegistrationBanner.set(false);
      }, 6000);
    }
  }

  public togglePasswordVisibility(): void {
    this.passwordFieldType.set(
      this.passwordFieldType() === InputType.PASSWORD ? InputType.TEXT : InputType.PASSWORD,
    );
  }

  public login(): void {
    if (this.isSubmitting()) {
      return;
    }

    if (this.signinForm.invalid) {
      this.signinForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);
    this.signinForm.disable({ emitEvent: false });

    this.authService
      .login(this.signinForm.getRawValue() as Record<string, unknown>)
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.signinForm.enable({ emitEvent: false });
        }),
      )
      .subscribe({
        next: (response) => {
          if (!response.user || !response.accessToken) {
            this.errorMessage.set(Messages.LOGIN_FAILED);
            return;
          }
          this.storageService.setToken(response.accessToken);
          this.userState.setUser(response.user);
          this.router.navigateByUrl(AppRoutes.DASHBOARD);
        },
        error: (error) => {
          this.errorMessage.set(
            error?.error?.message || error?.message || Messages.LOGIN_FAILED,
          );
          console.error('Login failed', error);
        },
      });
  }
}

