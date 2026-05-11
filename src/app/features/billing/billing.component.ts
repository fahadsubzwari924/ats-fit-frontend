import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, takeWhile, tap, timer } from 'rxjs';
import { BillingTab } from './enums/tab.enum';
import { OverviewTabComponent } from './components/overview-tab/overview-tab.component';
import { HistoryTabComponent } from './components/history-tab/history-tab.component';
import { BillingPageHeaderComponent } from './components/billing-page-header/billing-page-header.component';
import { BillingActivationCardComponent } from './components/billing-activation-card/billing-activation-card.component';
import {
  ACTIVATION_STATE,
  ACTIVATION_SUPPORT_MAILTO,
  POST_CHECKOUT_POLL_CONFIG,
  POST_CHECKOUT_QUERY_PARAM,
  ActivationState,
} from '@features/billing/constants/billing-activation.constants';
import { UserState } from '@core/states/user.state';
import { PLAN_LABELS } from '@features/billing/constants/billing-overview.constants';
import { UserApiService } from '@shared/services/user-api.service';

/**
 * Post-checkout polling window.
 *
 * LemonSqueezy fires two unordered dispatches after payment: a browser redirect
 * (instant) and a webhook. In production on Railway the webhook lands in 1-3s,
 * but locally through an ngrok tunnel it can take 20-60s. The redirect always
 * wins the race, so we poll `/users/me` until the backend reflects premium or
 * we hit the cap. Polling exits the moment `isPremium` flips, so the long
 * window only costs requests in the rare worst case.
 *
 * Timing knobs + copy live in `billing-activation.constants.ts` — never inline
 * a value or string here.
 */

@Component({
  selector: 'app-billing',
  imports: [
    BillingPageHeaderComponent,
    OverviewTabComponent,
    HistoryTabComponent,
    BillingActivationCardComponent,
  ],
  templateUrl: './billing.component.html',
  styleUrl: './billing.component.scss',
})
export class BillingComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  readonly userState = inject(UserState);
  private userApiService = inject(UserApiService);
  private destroyRef = inject(DestroyRef);

  readonly BillingTab = BillingTab;

  readonly activeTab = signal<BillingTab>(BillingTab.OVERVIEW);

  /**
   * Drives the post-checkout activation surface. While not idle, the activation
   * card replaces the billing tabs and narrates progress to the user instead
   * of showing stale "Freemium" UI during the webhook delay.
   */
  private readonly _activationState = signal<ActivationState>(ACTIVATION_STATE.IDLE);
  readonly activationState = this._activationState.asReadonly();
  readonly isActivating = computed(() => this._activationState() !== ACTIVATION_STATE.IDLE);

  readonly planHeadline = computed(() => {
    const u = this.userState.currentUser();
    if (!u) return '—';
    if (u.isPremium) return PLAN_LABELS.PREMIUM;
    return PLAN_LABELS.FREE;
  });

  readonly renewalHeadline = computed(() => {
    const reset = this.userState.currentUser()?.featureUsage?.[0]?.resetDate;
    if (!reset) return '—';
    return new Date(reset).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  });

  ngOnInit(): void {
    const raw = this.route.snapshot.queryParamMap.get('tab');
    if (raw === BillingTab.HISTORY || raw === BillingTab.OVERVIEW) {
      this.activeTab.set(raw as BillingTab);
    }
    const paymentStatus = this.route.snapshot.queryParamMap.get(POST_CHECKOUT_QUERY_PARAM.KEY);
    if (paymentStatus === POST_CHECKOUT_QUERY_PARAM.VALUE_SUCCESS) {
      this.refreshUserAfterCheckout();
    }
  }

  /**
   * Polls `/users/me` after the LS success-redirect until the backend reports
   * `isPremium === true` or we hit the attempt cap. Required because LS fires
   * the redirect (instant) and the webhook (delayed) independently — a
   * single-shot fetch on landing reads a still-freemium row.
   *
   * - Each tick updates `userState`, so every signal-bound piece of UI
   *   (header chip, plan headline, quota state) re-renders the moment the
   *   webhook lands; no manual refresh.
   * - `takeWhile(..., true)` keeps the first premium emission and then
   *   completes, so we never poll once activation is confirmed.
   * - Side effects (success toast, query param strip) run only on the
   *   *natural* completion path; `takeUntilDestroyed` short-circuits them
   *   when the component is torn down mid-flight.
   */
  private refreshUserAfterCheckout(): void {
    this._activationState.set(ACTIVATION_STATE.CONFIRMING);
    let attempts = 0;
    let activated = false;
    const startedAt = performance.now();

    timer(0, POST_CHECKOUT_POLL_CONFIG.INTERVAL_MS)
      .pipe(
        switchMap(() => this.userApiService.getCurrentUser()),
        tap((user) => {
          attempts++;
          this.userState.setUser(user);
          // Progress the narration once we cross the "this is taking a bit"
          // threshold so the copy reflects what the system is actually doing.
          const elapsedMs = performance.now() - startedAt;
          if (
            !user.isPremium &&
            elapsedMs >= POST_CHECKOUT_POLL_CONFIG.PROVISIONING_THRESHOLD_MS &&
            this._activationState() === ACTIVATION_STATE.CONFIRMING
          ) {
            this._activationState.set(ACTIVATION_STATE.PROVISIONING);
          }
        }),
        takeWhile(
          (user) => !user.isPremium && attempts < POST_CHECKOUT_POLL_CONFIG.MAX_ATTEMPTS,
          true,
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (user) => {
          if (user.isPremium && !activated) {
            activated = true;
            this._activationState.set(ACTIVATION_STATE.SUCCESS);
            // Auto-dismiss the celebration after a beat so the user lands back
            // on the regular billing UI without having to click anything.
            timer(POST_CHECKOUT_POLL_CONFIG.SUCCESS_AUTO_DISMISS_MS)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe(() => {
                if (this._activationState() === ACTIVATION_STATE.SUCCESS) {
                  this.dismissActivation();
                }
              });
          }
        },
        error: () => {
          this._activationState.set(ACTIVATION_STATE.TIMEOUT);
          this.clearPaymentQueryParam();
        },
        complete: () => {
          if (!activated) {
            this._activationState.set(ACTIVATION_STATE.TIMEOUT);
          }
          this.clearPaymentQueryParam();
        },
      });
  }

  dismissActivation(): void {
    this._activationState.set(ACTIVATION_STATE.IDLE);
  }

  onActivationRefresh(): void {
    window.location.reload();
  }

  onActivationSupport(): void {
    window.location.href = ACTIVATION_SUPPORT_MAILTO;
  }

  private clearPaymentQueryParam(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [POST_CHECKOUT_QUERY_PARAM.KEY]: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  setActiveTab(tab: BillingTab): void {
    this.activeTab.set(tab);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tab === BillingTab.OVERVIEW ? null : tab },
      queryParamsHandling: 'merge',
    });
  }
}
