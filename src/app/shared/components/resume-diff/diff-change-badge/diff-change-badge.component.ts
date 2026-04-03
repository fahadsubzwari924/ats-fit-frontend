import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ChangeType } from '@features/resume-tailoring/models/resume-diff.model';

@Component({
  selector: 'app-diff-change-badge',
  standalone: true,
  imports: [NgClass],
  templateUrl: './diff-change-badge.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiffChangeBadgeComponent {
  readonly changeType = input.required<ChangeType>();

  label(): string {
    const map: Record<ChangeType, string> = {
      modified: 'Updated',
      added: 'Added',
      removed: 'Removed',
      unchanged: 'Unchanged',
    };
    return map[this.changeType()] ?? this.changeType();
  }

  modifierClass(): string {
    const map: Record<ChangeType, string> = {
      modified: 'rd-badge--modified',
      added: 'rd-badge--added',
      removed: 'rd-badge--removed',
      unchanged: 'rd-badge--unchanged',
    };
    return map[this.changeType()] ?? 'rd-badge--unchanged';
  }
}
