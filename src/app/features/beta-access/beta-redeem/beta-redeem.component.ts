import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { catchError, finalize, of, switchMap, tap } from 'rxjs';

import { BetaApiService } from '@shared/services/beta-api.service';
import { BetaState } from '@core/states/beta.state';
import { UserState } from '@core/states/user.state';
import { UserApiService } from '@shared/services/user-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { AppRoutes } from '@core/constants/app-routes.contant';
import { BetaStatus } from '@core/models/beta/beta-status.model';

import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { InlineAlertComponent } from '@shared/components/ui/inline-alert/inline-alert.component';

const ERROR_CODE_MAP: Record<string, string> = {
  BETA_CODE_NOT_FOUND: 'This code is invalid. Double-check your invite email.',
  BETA_INVALID_CODE_FORMAT: 'This code is invalid. Double-check your invite email.',
  BETA_CODE_EXPIRED: 'This code has expired. Contact support.',
  BETA_CODE_ALREADY_REDEEMED: "Code already redeemed. You're all set!",
  BETA_EMAIL_MISMATCH: 'This code belongs to a different email address.',
  BETA_RATE_LIMITED: 'Too many attempts. Please wait 10 minutes.',
  BETA_CODE_REVOKED: 'This code has been revoked. Contact support.',
};

const DEFAULT_ERROR = 'Something went wrong. Please try again.';

@Component({
  selector: 'app-beta-redeem',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonComponent,
    InlineAlertComponent,
  ],
  templateUrl: './beta-redeem.component.html',
  styleUrl: './beta-redeem.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BetaRedeemComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly betaApiService = inject(BetaApiService);
  private readonly betaState = inject(BetaState);
  private readonly userState = inject(UserState);
  private readonly userApiService = inject(UserApiService);
  private readonly snackbar = inject(SnackbarService);

  public readonly isSubmitting = signal(false);
  public readonly errorMessage = signal<string | null>(null);
  public readonly inviteeEmail = signal<string | null>(null);

  public readonly currentUser = this.userState.currentUser;

  public readonly redeemForm: FormGroup = this.fb.group({
    code: ['', [Validators.required, Validators.minLength(4)]],
  });

  public ngOnInit(): void {
    const code = this.route.snapshot.queryParamMap.get('code');
    if (code) {
      this.redeemForm.get('code')?.setValue(code.toUpperCase());
    }
    const email = this.route.snapshot.queryParamMap.get('email');
    if (email) {
      try {
        this.inviteeEmail.set(decodeURIComponent(email));
      } catch {
        this.inviteeEmail.set(email);
      }
    }
  }

  public onCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const upper = input.value.toUpperCase();
    this.redeemForm.get('code')?.setValue(upper, { emitEvent: false });
    input.value = upper;
  }

  public submit(): void {
    if (this.isSubmitting()) {
      return;
    }

    if (this.redeemForm.invalid) {
      this.redeemForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);
    this.redeemForm.disable({ emitEvent: false });

    const code: string = this.redeemForm.getRawValue().code as string;

    // Redemption is a two-stage flow:
    //   1) POST /beta/redeem — backend flips is_beta_user + beta_access_until
    //      inside a single transaction. By the time the response lands, the
    //      DB row already reflects premium-equivalent access.
    //   2) GET /users/me — pull the fresh user (now isPremium=true via
    //      resolveEffectivePlan on the server) so every UI consumer of
    //      userState.currentUser() — header chip, resume-replacement gate,
    //      hero quota strip, beta banner — renders the correct premium
    //      surface from first paint after the dashboard mounts.
    //
    // We chain (2) via switchMap so navigation only happens after the
    // refresh resolves. Without this, the dashboard renders with a stale
    // freemium user and only self-corrects on a hard refresh — the exact
    // bug reported by beta invitees.
    this.betaApiService
      .redeemCode(code)
      .pipe(
        tap((result) => this.applyBetaStatus(result)),
        switchMap(() =>
          this.userApiService.getCurrentUser().pipe(
            // If /users/me fails for any reason, do NOT block the redemption
            // celebration — the redeem itself already succeeded server-side.
            // Worst case the user sees stale state until the next refresh,
            // which is the pre-fix behavior. Better than blocking on a
            // transient GET.
            catchError(() => of(null)),
          ),
        ),
        finalize(() => {
          this.isSubmitting.set(false);
          this.redeemForm.enable({ emitEvent: false });
        }),
      )
      .subscribe({
        next: (freshUser) => {
          if (freshUser) {
            this.userState.setUser(freshUser);
          }
          this.snackbar.showSuccess('Beta access activated! Welcome aboard.');
          this.router.navigateByUrl(AppRoutes.DASHBOARD);
        },
        error: (err) => {
          const code: string =
            (err?.error?.message as string) ||
            (err?.error?.error as string) ||
            '';
          const message = ERROR_CODE_MAP[code] ?? DEFAULT_ERROR;
          this.errorMessage.set(message);
        },
      });
  }

  private applyBetaStatus(result: {
    betaAccessUntil: Date;
    foundingRateLocked: boolean;
  }): void {
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysRemaining = result.betaAccessUntil
      ? Math.ceil(
          (new Date(result.betaAccessUntil).getTime() - Date.now()) / msPerDay,
        )
      : null;
    const updatedStatus = new BetaStatus({
      isBetaUser: true,
      status: 'active',
      betaAccessUntil: result.betaAccessUntil,
      foundingRateLocked: result.foundingRateLocked,
      daysRemaining,
      postExpiryOffer: null,
    });
    this.betaState.setStatus(updatedStatus);
  }
}
