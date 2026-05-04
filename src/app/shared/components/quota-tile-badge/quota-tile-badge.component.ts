// src/app/shared/components/quota-tile-badge/quota-tile-badge.component.ts
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { FeatureType } from '@core/enums/feature-type.enum';
import { QuotaState } from '@core/states/quota.state';

/**
 * Layer 1 — small status badge for dashboard tiles.
 * Hidden when feature quota is healthy.
 *
 * Variants:
 *   - approaching: amber pill "{remaining} left"
 *   - exhausted (freemium/beta_active): red lock pill "Limit reached"
 *   - exhausted (beta_expiring_soon): orange "Beta ends in N days"
 *   - exhausted (premium_paid): slate "Limit reached"
 */
@Component({
  selector: 'app-quota-tile-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <span
        class="tb"
        [class.tb--approaching]="status() === 'approaching'"
        [class.tb--exhausted]="status() === 'exhausted'"
        [class.tb--urgent]="tier() === 'beta_expiring_soon' && status() === 'exhausted'"
        [class.tb--premium]="tier() === 'premium_paid' && status() === 'exhausted'"
        role="status"
      >
        @if (status() === 'exhausted') {
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25z"/>
          </svg>
        }
        <span class="tb__label">{{ label() }}</span>
      </span>
    }
  `,
  styles: [`
    @use 'design-tokens' as *;

    :host { display: inline-flex; }

    .tb {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.625rem;       // 10px
      font-weight: $font-weight-semibold;
      padding: 2px 7px;
      border-radius: $radius-full;
      letter-spacing: 0.01em;
      white-space: nowrap;
      line-height: 1.4;
      backdrop-filter: blur(4px);

      svg { width: 9px; height: 9px; }

      &--approaching {
        background: rgba(255, 255, 255, 0.92);
        color: $quota-approaching-text;
        border: 1px solid rgba(255, 255, 255, 0.6);
      }

      &--exhausted {
        background: linear-gradient(120deg, $quota-exhausted-from, $quota-exhausted-to);
        color: #fff;
        box-shadow: 0 1px 4px hsl(221 83% 53% / 0.35);
      }

      &--urgent {
        background: linear-gradient(120deg, $quota-urgent-from, $quota-urgent-to) !important;
        box-shadow: 0 1px 4px hsl(28 90% 46% / 0.35) !important;
      }

      &--premium {
        background: rgba(255, 255, 255, 0.95) !important;
        color: hsl(215 25% 30%) !important;
        box-shadow: none !important;
        border: 1px solid hsl(215 16% 88%);
      }
    }
  `],
})
export class QuotaTileBadgeComponent {
  private readonly quotaState = inject(QuotaState);

  readonly feature = input.required<FeatureType>();

  readonly quota = computed(() => this.quotaState.quotaFor(this.feature())());
  readonly status = computed(() => this.quota()?.status ?? 'healthy');
  readonly tier = computed(() => this.quotaState.userTier());

  readonly visible = computed(() => {
    const s = this.status();
    return s === 'approaching' || s === 'exhausted';
  });

  readonly label = computed(() => {
    const q = this.quota();
    if (!q) return '';
    if (this.status() === 'exhausted') {
      if (this.tier() === 'beta_expiring_soon') {
        const days = this.quotaState.betaDaysRemaining();
        return days !== null ? `Beta ends in ${days}d` : 'Limit reached';
      }
      return 'Limit reached';
    }
    return `${q.remaining} left`;
  });
}
