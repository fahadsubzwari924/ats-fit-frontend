import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { FeatureType } from '@core/enums/feature-type.enum';
import { QuotaState } from '@core/states/quota.state';

@Component({
  selector: 'app-feature-usage-chip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <span
        class="usage-chip"
        [class.usage-chip--approaching]="status() === 'approaching'"
        [class.usage-chip--exhausted]="status() === 'exhausted'"
        role="status"
      >
        <span class="usage-chip__count">{{ quota()!.used }} / {{ quota()!.allowed }} used</span>
        <span class="usage-chip__sep" aria-hidden="true">·</span>
        <span class="usage-chip__reset">resets in {{ quota()!.daysToReset }}d</span>
      </span>
    }
  `,
  styles: [`
    @use 'design-tokens' as *;

    :host { display: inline-flex; }

    .usage-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px $spacing-sm;
      border-radius: $radius-full;
      font-size: $font-size-xs;
      font-weight: $font-weight-medium;
      line-height: 1.4;
      white-space: nowrap;
      border: 1px solid transparent;

      &--approaching {
        background: hsl(36 100% 96%);
        color: hsl(28 80% 32%);
        border-color: hsl(36 90% 87%);
      }

      &--exhausted {
        background: hsl(0 86% 97%);
        color: hsl(0 65% 38%);
        border-color: hsl(0 80% 88%);
      }

      &__sep { opacity: 0.55; }
    }
  `],
})
export class FeatureUsageChipComponent {
  private readonly quotaState = inject(QuotaState);

  readonly feature = input.required<FeatureType>();

  readonly quota = computed(() => this.quotaState.quotaFor(this.feature())());
  readonly status = computed(() => this.quota()?.status ?? 'healthy');
  readonly visible = computed(() => {
    const s = this.status();
    return s === 'approaching' || s === 'exhausted';
  });
}
