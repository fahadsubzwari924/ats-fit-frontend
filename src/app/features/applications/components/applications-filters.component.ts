import { TitleCasePipe } from '@angular/common';
import { BreakpointObserver } from '@angular/cdk/layout';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { map } from 'rxjs';
import {
  APPLICATION_OUTCOME_STATUSES,
  APPLICATION_PIPELINE_STATUSES,
} from '../lib/application-status-filter-groups';

@Component({
  selector: 'app-applications-filters',
  standalone: true,
  imports: [FormsModule, TitleCasePipe],
  templateUrl: './applications-filters.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
    id: 'applications-filters',
  },
})
export class ApplicationsFiltersComponent {
  private readonly breakpointObserver = inject(BreakpointObserver);

  private readonly statusDropdownRoot = viewChild('statusDropdown', { read: ElementRef<HTMLElement> });

  /** Tailwind `md` — panel always visible at this width and up. */
  readonly isMdUp = toSignal(
    this.breakpointObserver.observe('(min-width: 768px)').pipe(map((r) => r.matches)),
    {
      initialValue:
        typeof matchMedia !== 'undefined' && matchMedia('(min-width: 768px)').matches,
    },
  );

  readonly searchQuery = model('');
  readonly selectedStatuses = model<string[]>([]);
  readonly appliedFrom = model('');
  readonly appliedTo = model('');

  readonly pipelineStatuses = APPLICATION_PIPELINE_STATUSES;
  readonly outcomeStatuses = APPLICATION_OUTCOME_STATUSES;

  readonly statusPanelOpen = signal(false);

  /** Below `md`, user can collapse the main filter body to prioritize the table. */
  readonly mobileFiltersExpanded = signal(false);

  readonly showFiltersPanel = computed(() => this.isMdUp() || this.mobileFiltersExpanded());

  readonly statusTriggerSummary = computed(() => {
    const sel = this.selectedStatuses();
    if (sel.length === 0) {
      return 'All statuses';
    }
    if (sel.length === 1) {
      return this.titleCaseWords(this.statusLabel(sel[0]));
    }
    return `${sel.length} selected`;
  });

  readonly hasActiveFilters = computed(() => {
    const q = this.searchQuery().trim();
    if (q.length > 0) {
      return true;
    }
    if (this.selectedStatuses().length > 0) {
      return true;
    }
    if (this.appliedFrom().trim() !== '' || this.appliedTo().trim() !== '') {
      return true;
    }
    return false;
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(ev: MouseEvent): void {
    if (!this.statusPanelOpen()) {
      return;
    }
    const t = ev.target as Node | null;
    const root = this.statusDropdownRoot()?.nativeElement;
    if (t && root?.contains(t)) {
      return;
    }
    this.statusPanelOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.statusPanelOpen()) {
      this.statusPanelOpen.set(false);
    }
  }

  statusLabel(status: string): string {
    return status.replace(/_/g, ' ');
  }

  private titleCaseWords(s: string): string {
    return s.replace(/\b\w/g, (c) => c.toUpperCase());
  }

  toggleStatusPanel(): void {
    this.statusPanelOpen.update((o) => !o);
  }

  toggleStatus(status: string): void {
    const cur = this.selectedStatuses();
    if (cur.includes(status)) {
      this.selectedStatuses.set(cur.filter((x) => x !== status));
    } else {
      this.selectedStatuses.set([...cur, status]);
    }
  }

  isChecked(status: string): boolean {
    return this.selectedStatuses().includes(status);
  }

  onClear(): void {
    this.searchQuery.set('');
    this.selectedStatuses.set([]);
    this.appliedFrom.set('');
    this.appliedTo.set('');
    this.statusPanelOpen.set(false);
  }

  toggleMobileFilters(): void {
    this.mobileFiltersExpanded.update((v) => !v);
  }

  expandMobileFilters(): void {
    this.mobileFiltersExpanded.set(true);
  }
}
