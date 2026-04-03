import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type DiffMetricVariant = 'blue' | 'emerald' | 'indigo';

@Component({
  selector: 'app-diff-metric-tile',
  standalone: true,
  templateUrl: './diff-metric-tile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiffMetricTileComponent {
  readonly value = input.required<string | number>();
  readonly label = input.required<string>();
  readonly variant = input<DiffMetricVariant>('blue');
}
