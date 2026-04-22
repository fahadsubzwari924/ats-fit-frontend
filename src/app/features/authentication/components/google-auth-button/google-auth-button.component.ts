import { ChangeDetectorRef, Component, inject, signal, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { Router } from '@angular/router';
import { AppRoutes } from '@core/constants/app-routes.contant';
import { Messages } from '@core/enums/messages.enum';
import { UserState } from '@core/states/user.state';
import { environment } from '@env/environment';
import { AuthService } from '@features/authentication/services/auth.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { StorageService } from '@shared/services/storage.service';

/** Minimal typings for Google Identity Services (script from CDN). */
interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleAccountsId {
  initialize: (cfg: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }) => void;
  renderButton: (el: HTMLElement | null, opts: Record<string, string>) => void;
}

declare const google: { accounts?: { id?: GoogleAccountsId } };

@Component({
  selector: 'app-google-auth-button',
  standalone: true,
  imports: [],
  templateUrl: './google-auth-button.component.html',
  styleUrl: './google-auth-button.component.scss',
})
export class GoogleAuthButtonComponent implements OnInit {

  /** Backend token exchange in flight after Google credential. */
  public isCompletingSignIn = signal(false);

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
    if (typeof google === 'undefined' || !google.accounts?.id) {
      return;
    }

    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: GoogleCredentialResponse) => this.handleCredentialResponse(response),
    });

    google.accounts.id.renderButton(
      document.getElementById('google-signin-button'),
      {
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        text: 'continue_with'
      }
    );
  }

  public handleCredentialResponse(googleResponse: GoogleCredentialResponse): void {
    const token = googleResponse.credential;
    if (!token) {
      return;
    }

    this.isCompletingSignIn.set(true);
    this.cdr.detectChanges();

    this.authService
      .googleAuth({ token } as Record<string, unknown>)
      .pipe(
        finalize(() => {
          this.isCompletingSignIn.set(false);
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          if (!response.user || !response.accessToken) {
            this.snackbarService.showError(Messages.LOGIN_FAILED);
            return;
          }

          this.storageService.setToken(response.accessToken);
          this.userState.setUser(response.user);
          this.router.navigateByUrl(AppRoutes.DASHBOARD);
        },
        error: (err) => {
          console.error('Google authentication failed:', err);
          this.snackbarService.showError(
            err?.error?.message || err?.message || Messages.GOOGLE_AUTH_FAILED,
          );
        },
      });
  }

}
