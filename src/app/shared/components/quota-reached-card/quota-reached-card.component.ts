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

@Component({
  selector: 'app-quota-reached-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (vm(); as v) {
      <div
        class="qg"
        [class.qg--urgent]="tier() === 'beta_expiring_soon'"
        [class.qg--premium]="tier() === 'premium_paid'"
        role="region"
        [attr.aria-label]="'Quota reached for ' + featureNoun()"
      >
        <div class="qg__row">
          <!-- Icon badge -->
          <div class="qg__badge" aria-hidden="true">
            @switch (tier()) {
              @case ('beta_expiring_soon') {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"/>
                </svg>
              }
              @case ('premium_paid') {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                </svg>
              }
              @default {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25z"/>
                </svg>
              }
            }
          </div>

          <!-- Text -->
          <div class="qg__text">
            <p class="qg__headline" [innerHTML]="renderBold(v.headline)"></p>
            <p class="qg__meta" [innerHTML]="renderBold(v.body)"></p>
          </div>
        </div>

        <!-- Actions -->
        @if (v.primary.kind !== 'none' || v.secondary) {
          <div class="qg__actions">
            @if (v.primary.kind !== 'none') {
              <button type="button" class="qg__cta-primary"
                [class.qg__cta-primary--urgent]="tier() === 'beta_expiring_soon'"
                (click)="onCta(v.primary)">
                {{ v.primary.label }}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/>
                </svg>
              </button>
            }
            @if (v.secondary; as sec) {
              <button type="button" class="qg__cta-secondary" (click)="onCta(sec)">
                {{ sec.label }}
              </button>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    @use 'design-tokens' as *;

    :host { display: block; }

    // ── Container ─────────────────────────────────────────────────────────────
    .qg {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 9px;
      padding: 11px 13px 12px 14px;
      border-radius: $radius-xl;
      background: hsl(221 83% 53% / 0.05);
      border: 1px solid hsl(221 83% 53% / 0.20);
      // Left accent bar — primary gradient
      border-left: 3px solid hsl(221 83% 54%);
      overflow: hidden;

      // Subtle top-right shimmer for depth
      &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(ellipse 80% 60% at 100% 0%, hsl(262 78% 58% / 0.07), transparent);
        pointer-events: none;
      }

      &--urgent {
        background: hsl(36 100% 97%);
        border-color: hsl(36 90% 55% / 0.30);
        border-left-color: hsl(36 90% 55%);

        &::before { background: radial-gradient(ellipse 80% 60% at 100% 0%, hsl(28 90% 55% / 0.08), transparent); }
      }

      &--premium {
        background: hsl(215 20% 98%);
        border-color: hsl(215 16% 88%);
        border-left-color: hsl(215 16% 68%);

        &::before { background: none; }
      }
    }

    // ── Icon + text row ────────────────────────────────────────────────────────
    .qg__row {
      display: flex;
      align-items: flex-start;
      gap: 9px;
    }

    .qg__badge {
      flex-shrink: 0;
      width: 22px;
      height: 22px;
      border-radius: 6px;
      background: hsl(221 83% 53% / 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 1px;

      svg {
        width: 12px;
        height: 12px;
        color: hsl(221 83% 50%);
      }

      .qg--urgent & {
        background: hsl(36 90% 55% / 0.15);
        svg { color: hsl(28 90% 42%); }
      }

      .qg--premium & {
        background: hsl(215 16% 90%);
        svg { color: hsl(215 20% 48%); }
      }
    }

    .qg__text { flex: 1; min-width: 0; }

    .qg__headline {
      margin: 0;
      font-size: $font-size-xs;
      font-weight: $font-weight-semibold;
      color: hsl(215 30% 16%);
      line-height: 1.35;
    }

    .qg__meta {
      margin: 2px 0 0;
      font-size: 0.6875rem;
      color: hsl(215 14% 50%);
      line-height: 1.4;
    }

    // ── Action pills ───────────────────────────────────────────────────────────
    .qg__actions {
      display: flex;
      align-items: center;
      gap: 5px;
      flex-wrap: wrap;
      padding-left: 31px; // 22px badge + 9px gap → aligns under text
    }

    .qg__cta-primary {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.6875rem;
      font-weight: $font-weight-semibold;
      padding: 3px 10px 3px 11px;
      border-radius: $radius-full;
      border: none;
      background: linear-gradient(120deg, hsl(221 83% 53%), hsl(262 78% 60%));
      color: #fff;
      cursor: pointer;
      transition: opacity 140ms ease, transform 120ms ease;
      line-height: 1.5;
      white-space: nowrap;

      svg { width: 10px; height: 10px; }

      &:hover { opacity: 0.88; transform: translateY(-1px); }
      &:active { transform: translateY(0); }

      &--urgent {
        background: linear-gradient(120deg, hsl(28 90% 46%), hsl(20 88% 52%)) !important;
      }
    }

    .qg__cta-secondary {
      display: inline-flex;
      align-items: center;
      font-size: 0.6875rem;
      font-weight: $font-weight-medium;
      padding: 3px 9px;
      border-radius: $radius-full;
      border: 1px solid hsl(215 16% 84%);
      background: transparent;
      color: hsl(215 16% 46%);
      cursor: pointer;
      transition: all 140ms ease;
      line-height: 1.5;
      white-space: nowrap;

      &:hover {
        background: hsl(215 20% 95%);
        color: hsl(215 25% 28%);
        border-color: hsl(215 16% 74%);
      }
    }
  `],
})
export class QuotaReachedCardComponent {
  private readonly quotaState = inject(QuotaState);
  private readonly billingNav = inject(BillingNavigationService);

  readonly feature = input.required<FeatureType>();

  readonly quota = computed(() => this.quotaState.quotaFor(this.feature())());
  readonly tier = computed(() => this.quotaState.userTier());
  readonly featureNoun = computed(() => FEATURE_NOUNS[this.feature()]);

  readonly vm = computed(() => {
    const q = this.quota();
    if (!q) return null;
    const entry = QUOTA_COPY[this.tier()];
    const betaDays = this.quotaState.betaDaysRemaining();
    const betaUntil = betaDays !== null ? new Date(Date.now() + betaDays * 86_400_000) : null;

    const vars: QuotaCopyVars = {
      used: q.used,
      allowed: q.allowed,
      resetDate: this.formatShortDate(q.resetDate),
      daysToReset: q.daysToReset,
      feature: this.featureNoun(),
      betaExpiryDate: betaUntil ? this.formatShortDate(betaUntil) : undefined,
      betaDaysRemaining: betaDays ?? undefined,
    };

    return {
      headline: substituteCopy(entry.headline, vars),
      body: substituteCopy(entry.body, vars),
      primary: entry.primary,
      secondary: entry.secondary,
    };
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
