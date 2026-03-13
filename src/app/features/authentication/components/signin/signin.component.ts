import { Component, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from "@angular/material/icon";
// Components
import { InputFieldComponent } from "@shared/components/ui/input-field/input-field.component";
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { GoogleAuthButtonComponent } from "../google-auth-button/google-auth-button.component";
// Services
import { AuthService } from '@features/authentication/services/auth.service';
import { StorageService } from '@shared/services/storage.service';
import { SnackbarService } from '@shared/services/snackbar.service';
// States
import { UserState } from '@core/states/user.state';
// Enums
import { Messages } from '@core/enums/messages.enum';
import { InputType } from '@shared/components/ui/input-field/enum/input-type.enum';
//Constants
import { AppRoutes } from '@core/constants/app-routes.contant';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, InputFieldComponent, MatIconModule, ButtonComponent, GoogleAuthButtonComponent],
  templateUrl: './signin.component.html',
  styleUrl: './signin.component.scss'
})
export class SigninComponent {

  // Inject dependencies
  private router = inject(Router);
  private formbuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private storageService = inject(StorageService);
  private snackbarService = inject(SnackbarService);
  private userState = inject(UserState);

  // Form
  public signinForm!: FormGroup;

  // Component state
  public passwordFieldType = signal<string>(InputType.PASSWORD);
  public InputType = InputType;

  ngOnInit() {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.signinForm = this.formbuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  public togglePasswordVisibility(): void {
    this.passwordFieldType.set(this.passwordFieldType() === InputType.PASSWORD ? InputType.TEXT : InputType.PASSWORD);
  }

  public login(): void {

    if (this.signinForm.invalid) {
      return;
    }

    this.authService.login(this.signinForm.value)
    .subscribe({
      next: (response) => {
        if (!response.user || !response.accessToken) {
          this.snackbarService.showError(Messages.LOGIN_FAILED);
          return;
        }

        // Type Cast the response data to Respective Model (Getting error if not done)
        this.storageService.setToken(response.accessToken);
        this.userState.setUser(response.user);
        this.router.navigateByUrl(AppRoutes.DASHBOARD);
      },
      error: (error) => {
        this.snackbarService.showError(error?.error?.message || error?.message || Messages.LOGIN_FAILED);
        console.error('Login failed', error);
      }
    });
  }
}

