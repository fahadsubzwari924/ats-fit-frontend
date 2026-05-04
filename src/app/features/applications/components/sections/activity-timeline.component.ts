import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  Input,
  OnChanges,
  Output,
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
    <app-accordion-section title="Activity" [expanded]="expanded" (expandedChange)="expandedChange.emit($event)">
      @if (history.length === 0) {
        <div class="at-empty">
          <svg class="at-empty__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <p class="at-empty__title">No activity yet</p>
          <p class="at-empty__sub">Status changes will appear here as you move through the pipeline.</p>
        </div>
      } @else {
        <ol class="at-list" aria-label="Status history">
          @for (entry of sortedHistory(); track entry.changed_at; let isFirst = $first; let isLast = $last) {
            <li class="at-item">

              <!-- Timeline track: dot + connector line -->
              <div class="at-track" aria-hidden="true">
                <span
                  class="at-dot"
                  [class.at-dot--current]="isFirst"
                  [style.background]="statusColor(entry.to)"
                  [style.box-shadow]="isFirst ? ('0 0 0 3px ' + statusColorAlpha(entry.to)) : 'none'"
                ></span>
                @if (!isLast) {
                  <span class="at-connector"></span>
                }
              </div>

              <!-- Content -->
              <div class="at-content">
                <div class="at-row">
                  <div class="at-lhs">
                    <span
                      class="at-badge"
                      [ngClass]="statusBadgeClass(entry.to)"
                    >{{ formatStatus(entry.to) }}</span>
                    @if (isFirst) {
                      <span class="at-current-pill">current</span>
                    }
                  </div>
                  <time
                    class="at-date"
                    [attr.datetime]="entry.changed_at"
                    [title]="formatDateFull(entry.changed_at)"
                  >{{ formatDateShort(entry.changed_at) }}</time>
                </div>

                @if (entry.from) {
                  <p class="at-transition">
                    <span class="at-transition__arrow">↑</span>
                    from
                    <span class="at-transition__from">{{ formatStatus(entry.from) }}</span>
                  </p>
                } @else {
                  <p class="at-initial">Initial status</p>
                }
              </div>

            </li>
          }
        </ol>
      }
    </app-accordion-section>
  `,
  styles: [`
    @use 'design-tokens' as *;

    :host { display: block; }

    /* ── Empty state ──────────────────────────────────────────────────────────── */
    .at-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: $spacing-xs;
      padding: $spacing-lg 0 $spacing-sm;
      text-align: center;

      &__icon {
        width: 2rem;
        height: 2rem;
        color: $color-muted-foreground;
        opacity: 0.6;
        margin-bottom: $spacing-xs;
      }

      &__title {
        margin: 0;
        font-size: $font-size-sm;
        font-weight: $font-weight-medium;
        color: $color-foreground;
      }

      &__sub {
        margin: 0;
        font-size: $font-size-xs;
        color: $color-muted-foreground;
        line-height: $line-height-normal;
        max-width: 22rem;
      }
    }

    /* ── List ─────────────────────────────────────────────────────────────────── */
    .at-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    /* ── Item ─────────────────────────────────────────────────────────────────── */
    .at-item {
      display: flex;
      gap: $spacing-sm;
      align-items: stretch;
    }

    /* ── Track (dot + line) ───────────────────────────────────────────────────── */
    .at-track {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex-shrink: 0;
      width: 1.125rem;
      padding-top: 2px;
    }

    .at-dot {
      width: 0.625rem;
      height: 0.625rem;
      border-radius: 50%;
      flex-shrink: 0;
      border: 2px solid $color-card;
      position: relative;
      z-index: 1;
      transition: box-shadow 0.2s ease;

      &--current {
        width: 0.75rem;
        height: 0.75rem;
      }
    }

    .at-connector {
      flex: 1;
      width: 1.5px;
      background: $color-border;
      margin: 3px 0;
      min-height: 1rem;
    }

    /* ── Content area ─────────────────────────────────────────────────────────── */
    .at-content {
      flex: 1;
      min-width: 0;
      padding-bottom: $spacing-md;
    }

    .at-item:last-child .at-content {
      padding-bottom: 0;
    }

    /* ── Row: badge + date ────────────────────────────────────────────────────── */
    .at-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: $spacing-sm;
      min-width: 0;
    }

    .at-lhs {
      display: flex;
      align-items: center;
      gap: $spacing-xs;
      min-width: 0;
    }

    .at-badge {
      display: inline-flex;
      align-items: center;
      font-size: $font-size-xs;
      font-weight: $font-weight-semibold;
      padding: 2px $spacing-sm;
      border-radius: $radius-full;
      border: 1px solid transparent;
      line-height: 1.4;
      letter-spacing: 0.01em;
      white-space: nowrap;
    }

    .at-current-pill {
      font-size: 0.625rem;
      font-weight: $font-weight-semibold;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: $color-primary;
      background: hsl(221 83% 53% / 0.1);
      border-radius: $radius-full;
      padding: 1px $spacing-xs;
      white-space: nowrap;
    }

    .at-date {
      font-size: $font-size-xs;
      color: $color-muted-foreground;
      white-space: nowrap;
      flex-shrink: 0;
    }

    /* ── Transition line ──────────────────────────────────────────────────────── */
    .at-transition {
      margin: 3px 0 0;
      font-size: $font-size-xs;
      color: $color-muted-foreground;
      display: flex;
      align-items: center;
      gap: 3px;
      line-height: 1.4;

      &__arrow {
        font-size: 0.65rem;
        opacity: 0.6;
      }

      &__from {
        font-weight: $font-weight-medium;
        color: hsl(215 16% 47%);
      }
    }

    .at-initial {
      margin: 3px 0 0;
      font-size: $font-size-xs;
      color: $color-muted-foreground;
      font-style: italic;
      line-height: 1.4;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityTimelineComponent implements OnChanges {
  @Input({ required: true }) history!: IJobApplicationStatusHistoryEntry[];
  @Input() expanded = false;
  @Output() expandedChange = new EventEmitter<boolean>();

  private readonly _history = signal<IJobApplicationStatusHistoryEntry[]>([]);

  private readonly STATUS_COLORS: Record<string, string> = {
    wishlist:        '#78716c',
    interested:      '#4f46e5',
    applied:         '#2563eb',
    screening:       '#d97706',
    technical_round: '#ea580c',
    interviewed:     '#7c3aed',
    offer_received:  '#059669',
    offer_declined:  '#dc2626',
    rejected:        '#ef4444',
    accepted:        '#16a34a',
    withdrawn:       '#6b7280',
  };

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

  statusColor(status: string): string {
    return this.STATUS_COLORS[status] ?? '#94a3b8';
  }

  statusColorAlpha(status: string): string {
    const hex = this.STATUS_COLORS[status] ?? '#94a3b8';
    return hex + '26'; // ~15% opacity hex suffix
  }

  statusBadgeClass(status: string): string {
    return applicationStatusBadgeClasses(status);
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  formatDateShort(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60_000);
    const diffHrs = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffMins < 1)  return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs  < 24) return `${diffHrs}h ago`;
    if (diffDays < 7)  return `${diffDays}d ago`;

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    }).format(d);
  }

  formatDateFull(iso: string): string {
    const d = new Date(iso);
    const date = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d);
    const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(d);
    return `${date} · ${time}`;
  }
}
