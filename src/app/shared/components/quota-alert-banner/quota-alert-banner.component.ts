// src/app/shared/components/quota-alert-banner/quota-alert-banner.component.ts
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { FeatureType } from '@core/enums/feature-type.enum';
import { QuotaState } from '@core/states/quota.state';
import {
  FEATURE_NOUNS,
  QUOTA_COPY,
  QuotaCopyVars,
  QuotaCta,
  substituteCopy,
} from '@shared/constants/quota-copy.constant';
import { BillingNavigationService } from '@shared/services/billing-navigation.service';

const SUPPORT_EMAIL = 'support@atsfit.app';

/**
 * Layer 2 — modal-entry banner.
 *
 * Renders nothing when all features are healthy. When at least one feature is
 * approaching or exhausted, renders a tier-aware banner. Hosts pass the array
 * of features the modal owns; the banner picks the most-severe one to surface.
 *
 * Companion API (used by hosts to decide whether to hide the form):
 *   - `isExhausted` — true when at least one feature is exhausted
 *   - `isApproaching` — true when none exhausted but at least one approaching
 */
@Component({
  selector: 'app-quota-alert-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (mode() !== 'hidden' && vm(); as v) {
      <section
        class="qb"
        [class.qb--approaching]="mode() === 'approaching'"
        [class.qb--exhausted]="mode() === 'exhausted'"
        [class.qb--urgent]="tier() === 'beta_expiring_soon'"
        [class.qb--premium]="tier() === 'premium_paid'"
        role="region"
        [attr.aria-label]="ariaLabel()"
      >
        <div class="qb__row">
          <div class="qb__icon" aria-hidden="true">
            @switch (tier()) {
              @case ('beta_expiring_soon') {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"/>
                </svg>
              }
              @case ('premium_paid') {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                </svg>
              }
              @default {
                @if (mode() === 'exhausted') {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25z"/>
                  </svg>
                } @else {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126Zm9.303 3.379h.008v.008H12v-.008Z"/>
                  </svg>
                }
              }
            }
          </div>

          <div class="qb__text">
            <h3 class="qb__headline" [innerHTML]="renderBold(v.headline)"></h3>
            <p class="qb__copy" [innerHTML]="renderBold(v.body)"></p>
          </div>
        </div>

        @if (mode() === 'exhausted' && (v.primary.kind !== 'none' || v.secondary)) {
          <div class="qb__actions">
            @if (v.primary.kind !== 'none') {
              <button type="button" class="qb__cta-primary"
                [class.qb__cta-primary--urgent]="tier() === 'beta_expiring_soon'"
                (click)="onCta(v.primary)">
                {{ v.primary.label }}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/>
                </svg>
              </button>
            }
            @if (v.secondary; as sec) {
              <button type="button" class="qb__cta-secondary" (click)="onCta(sec)">
                {{ sec.label }}
              </button>
            }
          </div>
        }
      </section>
    }
  `,
  styles: [`
    @use 'design-tokens' as *;

    :host { display: block; }

    .qb {
      position: relative;
      border-radius: $radius-xl;
      padding: 14px 16px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: 12px;

      // ── Approaching (informational) ─────────────────────────────
      &--approaching {
        background: $quota-approaching-soft;
        border: 1px solid $quota-approaching-border;
        border-left: 3px solid $quota-approaching;
        padding: 10px 14px;
        gap: 0;

        .qb__headline { font-size: $font-size-xs; }
        .qb__copy { font-size: 0.6875rem; }
      }

      // ── Exhausted (gate) ────────────────────────────────────────
      &--exhausted {
        background: $quota-exhausted-tint;
        border: 1px solid $quota-exhausted-border;
        border-left: 3px solid $quota-exhausted-from;

        &::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 60% 80% at 100% 0%, hsl(262 78% 60% / 0.08), transparent);
          pointer-events: none;
        }
      }

      &--urgent.qb--exhausted {
        background: $quota-urgent-tint;
        border-color: $quota-urgent-border;
        border-left-color: $quota-urgent-from;
        &::before { background: radial-gradient(ellipse 60% 80% at 100% 0%, hsl(28 90% 55% / 0.10), transparent); }
      }

      &--premium.qb--exhausted {
        background: $quota-premium-tint;
        border-color: $quota-premium-border;
        border-left-color: $quota-premium-cap;
        &::before { background: none; }
      }
    }

    .qb__row {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      position: relative;
    }

    .qb__icon {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      border-radius: $radius-md;
      background: hsl(221 83% 53% / 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 2px;

      svg { width: 16px; height: 16px; color: $quota-exhausted-from; }
    }

    .qb--approaching .qb__icon {
      background: hsl(36 90% 55% / 0.18);
      width: 26px;
      height: 26px;
      svg { color: $quota-approaching-text; width: 13px; height: 13px; }
    }

    .qb--urgent.qb--exhausted .qb__icon {
      background: hsl(28 90% 50% / 0.15);
      svg { color: $quota-urgent-from; }
    }

    .qb--premium.qb--exhausted .qb__icon {
      background: hsl(215 16% 90%);
      svg { color: $quota-premium-cap; }
    }

    .qb__text { flex: 1; min-width: 0; }

    .qb__headline {
      margin: 0;
      font-size: $font-size-sm;
      font-weight: $font-weight-semibold;
      color: hsl(215 30% 14%);
      line-height: 1.35;
    }

    .qb__copy {
      margin: 4px 0 0;
      font-size: $font-size-xs;
      color: hsl(215 14% 42%);
      line-height: 1.5;
    }

    .qb__actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      padding-left: 44px; // 32px icon + 12px gap → align under text
    }

    .qb__cta-primary {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: $font-size-xs;
      font-weight: $font-weight-semibold;
      padding: 7px 14px 7px 16px;
      border-radius: $radius-full;
      border: none;
      background: linear-gradient(120deg, $quota-exhausted-from, $quota-exhausted-to);
      color: #fff;
      cursor: pointer;
      transition: opacity 140ms ease, transform 120ms ease, box-shadow 140ms ease;
      line-height: 1.5;
      white-space: nowrap;
      box-shadow: 0 2px 8px hsl(221 83% 53% / 0.25);

      svg { width: 12px; height: 12px; }

      &:hover { opacity: 0.92; transform: translateY(-1px); box-shadow: 0 4px 12px hsl(221 83% 53% / 0.32); }
      &:active { transform: translateY(0); }

      &--urgent {
        background: linear-gradient(120deg, $quota-urgent-from, $quota-urgent-to) !important;
        box-shadow: 0 2px 8px hsl(28 90% 46% / 0.30) !important;
      }
    }

    .qb__cta-secondary {
      display: inline-flex;
      align-items: center;
      font-size: $font-size-xs;
      font-weight: $font-weight-medium;
      padding: 7px 13px;
      border-radius: $radius-full;
      border: 1px solid hsl(215 16% 84%);
      background: transparent;
      color: hsl(215 16% 40%);
      cursor: pointer;
      transition: all 140ms ease;
      line-height: 1.5;
      white-space: nowrap;

      &:hover { background: hsl(215 20% 95%); color: hsl(215 25% 25%); border-color: hsl(215 16% 72%); }
    }
  `],
})
export class QuotaAlertBannerComponent {
  private readonly quotaState = inject(QuotaState);
  private readonly billingNav = inject(BillingNavigationService);

  /** Features the host modal owns. The banner surfaces the most-severe one. */
  readonly features = input.required<FeatureType[]>();

  readonly tier = computed(() => this.quotaState.userTier());

  /** Resolves the feature whose state to render, or null when banner is hidden. */
  private readonly activeFeature = computed<FeatureType | null>(() => {
    return (
      this.quotaState.firstExhausted(this.features())() ??
      this.quotaState.firstApproaching(this.features())()
    );
  });

  readonly mode = computed<'hidden' | 'approaching' | 'exhausted'>(() => {
    const f = this.activeFeature();
    if (!f) return 'hidden';
    return this.quotaState.quotaFor(f)()?.status === 'exhausted'
      ? 'exhausted'
      : 'approaching';
  });

  /** Public flag the host uses to decide whether to hide form steps. */
  readonly isExhausted = computed(() => this.mode() === 'exhausted');
  readonly isApproaching = computed(() => this.mode() === 'approaching');

  readonly vm = computed(() => {
    const f = this.activeFeature();
    if (!f) return null;
    const q = this.quotaState.quotaFor(f)();
    if (!q) return null;
    const entry = QUOTA_COPY[this.tier()];
    const betaDays = this.quotaState.betaDaysRemaining();
    const betaUntil = betaDays !== null ? new Date(Date.now() + betaDays * 86_400_000) : null;

    const vars: QuotaCopyVars = {
      used: q.used,
      allowed: q.allowed,
      resetDate: this.formatShortDate(q.resetDate),
      daysToReset: q.daysToReset,
      feature: FEATURE_NOUNS[f],
      betaExpiryDate: betaUntil ? this.formatShortDate(betaUntil) : undefined,
      betaDaysRemaining: betaDays ?? undefined,
    };

    if (this.mode() === 'approaching') {
      // Lighter copy for approaching: just the meta, no big upgrade push.
      return {
        headline: substituteCopy(`Heads up — only ${q.remaining} ${FEATURE_NOUNS[f]} credit${q.remaining === 1 ? '' : 's'} left this month`, vars),
        body: substituteCopy("Resets **{resetDate}** ({daysToReset}d). Keep going.", vars),
        primary: { label: '', kind: 'none' as const },
        secondary: undefined,
      };
    }

    return {
      headline: substituteCopy(entry.headline, vars),
      body: substituteCopy(entry.body, vars),
      primary: entry.primary,
      secondary: entry.secondary,
    };
  });

  protected readonly ariaLabel = computed(() => {
    const m = this.mode();
    return m === 'exhausted' ? 'Quota reached' : m === 'approaching' ? 'Quota approaching limit' : '';
  });

  onCta(cta: QuotaCta): void {
    switch (cta.kind) {
      case 'upgrade':
      case 'view-plans':
        this.billingNav.goToPlansSection();
        return;
      case 'contact':
        window.location.href = `mailto:${SUPPORT_EMAIL}?subject=Quota%20increase%20request`;
        return;
      case 'dismiss':
      case 'none':
        return;
    }
  }

  protected renderBold(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }

  private formatShortDate(d: Date): string {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d);
  }
}
