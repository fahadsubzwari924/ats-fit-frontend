// src/app/shared/components/quota-locked-button/quota-locked-button.component.ts
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { FeatureType } from '@core/enums/feature-type.enum';
import { QuotaState } from '@core/states/quota.state';
import { FEATURE_NOUNS } from '@shared/constants/quota-copy.constant';
import { BillingNavigationService } from '@shared/services/billing-navigation.service';

const SUPPORT_EMAIL = 'support@atsfit.app';

/**
 * Layer 3 — compact locked-button replacement.
 * Renders inline where the original action button lived, matching the
 * surrounding button height/shape so the grid row stays natural.
 */
@Component({
  selector: 'app-quota-locked-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (quota(); as q) {
      <button type="button"
        class="lb"
        [class.lb--urgent]="tier() === 'beta_expiring_soon'"
        [class.lb--premium]="tier() === 'premium_paid'"
        [attr.aria-label]="'Upgrade to unlock ' + featureNoun() + '. ' + tooltip()"
        [title]="tooltip()"
        (click)="onClick()">
        <span class="lb__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25z"/>
          </svg>
        </span>

        <span class="lb__body">
          <span class="lb__title">{{ titleLabel() }}</span>
          <span class="lb__sub">{{ subLabel() }}</span>
        </span>

        <span class="lb__cta" aria-hidden="true">
          {{ tier() === 'premium_paid' ? 'Contact' : 'Upgrade' }}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/>
          </svg>
        </span>
      </button>
    }
  `,
  styles: [`
    @use 'design-tokens' as *;

    :host { display: block; }

    .lb {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border-radius: $radius-xl;
      background: $quota-exhausted-tint;
      border: 1px solid $quota-exhausted-border;
      border-left: 3px solid $quota-exhausted-from;
      cursor: pointer;
      text-align: left;
      transition: background 140ms ease, transform 100ms ease;
      font-family: inherit;

      &:hover {
        background: hsl(221 83% 53% / 0.08);
        transform: translateY(-1px);
      }

      &:active { transform: translateY(0); }

      &--urgent {
        background: $quota-urgent-tint;
        border-color: $quota-urgent-border;
        border-left-color: $quota-urgent-from;
        &:hover { background: hsl(28 90% 55% / 0.10); }
      }

      &--premium {
        background: $quota-premium-tint;
        border-color: $quota-premium-border;
        border-left-color: $quota-premium-cap;
      }

      &__icon {
        flex-shrink: 0;
        width: 1.75rem;
        height: 1.75rem;
        border-radius: $radius-md;
        background: hsl(221 83% 53% / 0.14);
        display: flex;
        align-items: center;
        justify-content: center;

        svg { width: 13px; height: 13px; color: $quota-exhausted-from; }
      }

      &--urgent &__icon {
        background: hsl(28 90% 50% / 0.18);
        svg { color: $quota-urgent-from; }
      }

      &--premium &__icon {
        background: hsl(215 16% 90%);
        svg { color: $quota-premium-cap; }
      }

      &__body {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 1px;
      }

      &__title {
        font-size: $font-size-xs;
        font-weight: $font-weight-semibold;
        color: hsl(215 25% 18%);
        line-height: 1.3;
      }

      &__sub {
        font-size: 0.625rem;
        color: hsl(215 14% 50%);
        line-height: 1.3;
      }

      &__cta {
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 0.6875rem;
        font-weight: $font-weight-semibold;
        padding: 4px 10px 4px 11px;
        border-radius: $radius-full;
        background: linear-gradient(120deg, $quota-exhausted-from, $quota-exhausted-to);
        color: #fff;
        line-height: 1.4;

        svg { width: 10px; height: 10px; }
      }

      &--urgent &__cta {
        background: linear-gradient(120deg, $quota-urgent-from, $quota-urgent-to);
      }

      &--premium &__cta {
        background: $quota-premium-cap;
      }
    }
  `],
})
export class QuotaLockedButtonComponent {
  private readonly quotaState = inject(QuotaState);
  private readonly billingNav = inject(BillingNavigationService);

  readonly feature = input.required<FeatureType>();

  readonly quota = computed(() => this.quotaState.quotaFor(this.feature())());
  readonly tier = computed(() => this.quotaState.userTier());
  readonly featureNoun = computed(() => FEATURE_NOUNS[this.feature()]);

  readonly titleLabel = computed(() => {
    const noun = this.featureNoun();
    return `${noun.charAt(0).toUpperCase()}${noun.slice(1)} — Limit reached`;
  });

  readonly subLabel = computed(() => {
    const q = this.quota();
    if (!q) return '';
    return `${q.used}/${q.allowed} used · Resets ${this.formatShortDate(q.resetDate)}`;
  });

  readonly tooltip = computed(() => {
    const q = this.quota();
    if (!q) return '';
    return `${q.used}/${q.allowed} used this month. Resets ${this.formatShortDate(q.resetDate)}.`;
  });

  onClick(): void {
    if (this.tier() === 'premium_paid') {
      window.location.href = `mailto:${SUPPORT_EMAIL}?subject=Quota%20increase%20request`;
      return;
    }
    this.billingNav.goToPlansSection();
  }

  private formatShortDate(d: Date): string {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d);
  }
}
