import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-diff-step-shell',
  standalone: true,
  templateUrl: './diff-step-shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'rd-step' },
})
export class DiffStepShellComponent {
  /** 1-based step index shown in the timeline. */
  readonly stepIndex = input.required<number>();
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  /** Scroll target id for the nav rail. */
  readonly anchorId = input.required<string>();
}
