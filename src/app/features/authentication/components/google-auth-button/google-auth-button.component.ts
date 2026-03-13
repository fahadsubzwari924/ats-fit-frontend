import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AppRoutes } from '@core/constants/app-routes.contant';
import { Messages } from '@core/enums/messages.enum';
import { UserState } from '@core/states/user.state';
import { environment } from '@env/environment';
import { AuthService } from '@features/authentication/services/auth.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { StorageService } from '@shared/services/storage.service';
declare const google: any;

@Component({
  selector: 'app-google-auth-button',
  imports: [],
  templateUrl: './google-auth-button.component.html',
  styleUrl: './google-auth-button.component.scss'
})
export class GoogleAuthButtonComponent {

  // Inject dependencies
  private router = inject(Router);
  private authService = inject(AuthService);
  private storageService = inject(StorageService);
  private snackbarService = inject(SnackbarService);
  private userState = inject(UserState);
  private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.initializeGoogleSignIn();
  }

  initializeGoogleSignIn(): void {
    google.accounts.id.initialize({
      client_id: environment.googleClientId, // <--- Your actual Google Client ID
      callback: (response: any) => this.handleCredentialResponse(response),
    });

    google.accounts.id.renderButton(
      document.getElementById('google-signin-button'),
      {
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        text: 'continue_with'
      } // Button customization
    );
    // You can also use google.accounts.id.prompt() for the One Tap dialog
  }

  public handleCredentialResponse(googleResponse: any): void {
    // response.credential is the JWT ID token
    const token = googleResponse.credential;

    this.cdr.detectChanges();
    this.authService.googleAuth({ token })
    .subscribe({
      next: (response) => {
        if (!response.user || !response.accessToken) {
          this.snackbarService.showError(Messages.LOGIN_FAILED);
          return;
        }

        // Type Cast the response data to Respective Model (Getting error if not done)
        this.storageService.setToken(response.accessToken);
        this.userState.setUser(response.user);
        this.cdr.detectChanges();
        // Navigate to a protected route
        this.router.navigateByUrl(AppRoutes.DASHBOARD);
      },
      error: (err) => {
        console.error('Google authentication failed:', err);
        this.snackbarService.showError(err?.error?.message || err?.message || Messages.GOOGLE_AUTH_FAILED);
        this.cdr.detectChanges();
      },
    });
  }

}
