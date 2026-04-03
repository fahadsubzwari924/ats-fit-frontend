import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface DiffNavStep {
  id: string;
  label: string;
  stepIndex: number;
}

@Component({
  selector: 'app-diff-nav-rail',
  standalone: true,
  templateUrl: './diff-nav-rail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiffNavRailComponent {
  readonly steps = input.required<DiffNavStep[]>();
  readonly activeId = input<string>('');

  readonly navigate = output<string>();
}
