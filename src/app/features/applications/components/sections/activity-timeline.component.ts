import {
  ChangeDetectionStrategy,
  Component,
  computed,
  Input,
  OnChanges,
  signal,
  SimpleChanges,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { IJobApplicationStatusHistoryEntry } from '@features/applications/models/interfaces/job-application-status-history.interface';
import { applicationStatusBadgeClasses } from '@features/applications/lib/application-status-badge-classes';
import { AccordionSectionComponent } from '@shared/components/ui/accordion-section/accordion-section.component';

@Component({
  selector: 'app-activity-timeline',
  standalone: true,
  imports: [NgClass, AccordionSectionComponent],
  template: `
    <app-accordion-section title="Activity" [expanded]="false">
      @if (history.length === 0) {
        <p class="activity-timeline__empty">No activity recorded yet.</p>
      } @else {
        <ol class="activity-timeline__list" aria-label="Status history">
          @for (entry of sortedHistory(); track entry.changed_at) {
            <li class="activity-timeline__item">
              <span class="activity-timeline__dot"></span>
              <div class="activity-timeline__content">
                <span class="activity-timeline__status-badge" [ngClass]="statusBadgeClass(entry.to)">
                  {{ formatStatus(entry.to) }}
                </span>
                <time class="activity-timeline__time" [attr.datetime]="entry.changed_at">
                  {{ formatDate(entry.changed_at) }}
                </time>
              </div>
            </li>
          }
        </ol>
      }
    </app-accordion-section>
  `,
  styles: [`
    @use 'design-tokens' as *;

    :host {
      display: block;
    }

    .activity-timeline__list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .activity-timeline__item {
      display: flex;
      gap: $spacing-sm;
      align-items: flex-start;
      padding: $spacing-sm 0;
      position: relative;

      &:not(:last-child)::before {
        content: '';
        position: absolute;
        left: 5px;
        top: 1.5rem;
        bottom: -0.5rem;
        width: 1px;
        background: $color-border;
      }
    }

    .activity-timeline__dot {
      width: 11px;
      height: 11px;
      border-radius: 50%;
      background: $color-muted-foreground;
      flex-shrink: 0;
      margin-top: 3px;
    }

    .activity-timeline__content {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
      min-width: 0;
    }

    .activity-timeline__status-badge {
      display: inline-block;
      font-size: $font-size-xs;
      font-weight: $font-weight-medium;
      padding: 1px $spacing-xs;
      border-radius: $radius-full;
      line-height: 1.5;
    }

    .activity-timeline__time {
      font-size: $font-size-xs;
      color: $color-muted-foreground;
    }

    .activity-timeline__empty {
      font-size: $font-size-sm;
      color: $color-muted-foreground;
      padding: $spacing-sm 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityTimelineComponent implements OnChanges {
  @Input({ required: true }) history!: IJobApplicationStatusHistoryEntry[];

  private readonly _history = signal<IJobApplicationStatusHistoryEntry[]>([]);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['history']) {
      this._history.set(this.history ?? []);
    }
  }

  readonly sortedHistory = computed(() =>
    [...this._history()].sort(
      (a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
    )
  );

  statusBadgeClass(status: string): string {
    return applicationStatusBadgeClasses(status);
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  formatDate(iso: string): string {
    const d = new Date(iso);
    const date = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d);
    const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(d);
    return `${date} · ${time}`;
  }
}
