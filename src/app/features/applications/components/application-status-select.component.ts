import { NgClass, TitleCasePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ConnectionPositionPair, Overlay, OverlayModule } from '@angular/cdk/overlay';
import { ApplicationStatus } from '@features/dashboard/enums/application-status.enum';
import {
  applicationStatusBadgeClasses,
  formatApplicationStatusLabel as formatStatusLabelFn,
} from '@features/applications/lib/application-status-badge-classes';

let applicationStatusSelectUid = 0;

/** Single “below trigger” position — avoids MatMenu’s vertical flip that opens the panel upward. */
const STATUS_DROPDOWN_BELOW: ConnectionPositionPair[] = [
  {
    originX: 'start',
    originY: 'bottom',
    overlayX: 'start',
    overlayY: 'top',
    offsetY: 6,
  },
];

@Component({
  selector: 'app-application-status-select',
  standalone: true,
  imports: [OverlayModule, NgClass, TitleCasePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex" cdkOverlayOrigin #origin="cdkOverlayOrigin">
      <button
        type="button"
        class="inline-flex min-w-[7.25rem] cursor-pointer items-center justify-center gap-1 rounded-full border px-3 py-1 text-left text-sm font-medium leading-tight transition hover:brightness-[0.97] focus:outline-none focus:ring-2 focus:ring-[var(--ats-primary)] focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60"
        [ngClass]="badgeClasses(status())"
        [disabled]="disabled()"
        [attr.aria-label]="ariaLabel()"
        [attr.aria-haspopup]="'listbox'"
        [attr.aria-expanded]="menuOpen()"
        [attr.aria-controls]="listboxId"
        (click)="onTriggerClick($event)"
      >
        <span class="truncate">{{ formatStatusLabel(status()) | titlecase }}</span>
        <svg
          class="h-3.5 w-3.5 shrink-0 opacity-70 transition-transform duration-200"
          [class.rotate-180]="menuOpen()"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </span>

    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="menuOpen()"
      [cdkConnectedOverlayPositions]="belowPositions"
      [cdkConnectedOverlayScrollStrategy]="scrollStrat"
      [cdkConnectedOverlayHasBackdrop]="true"
      cdkConnectedOverlayBackdropClass="cdk-overlay-transparent-backdrop"
      [cdkConnectedOverlayPanelClass]="'app-status-dropdown-pane'"
      [cdkConnectedOverlayPush]="false"
      (backdropClick)="closeMenu()"
      (detach)="closeMenu()"
    >
      <div
        [id]="listboxId"
        class="app-status-dropdown min-w-[11.5rem] overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white py-1.5"
        style="box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04), 0 12px 32px rgba(15, 23, 42, 0.06)"
        role="listbox"
        [attr.aria-label]="'Application status'"
      >
        @for (opt of statusOptions; track opt) {
          <button
            type="button"
            role="option"
            class="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium text-slate-800 transition hover:bg-[#F8FAFC] focus:bg-[#F8FAFC] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ats-primary)] disabled:cursor-default disabled:bg-transparent disabled:opacity-45"
            [disabled]="opt === status()"
            [attr.aria-selected]="opt === status()"
            (click)="onPick(opt)"
          >
            <span
              class="inline-block h-2 w-2 shrink-0 rounded-full ring-1 ring-black/5"
              [ngClass]="dotClasses(opt)"
              aria-hidden="true"
            ></span>
            <span class="leading-snug">{{ formatStatusLabel(opt) | titlecase }}</span>
          </button>
        }
      </div>
    </ng-template>
  `,
})
export class ApplicationStatusSelectComponent {
  private readonly overlay = inject(Overlay);

  readonly status = input.required<string>();
  readonly disabled = input(false);
  readonly companyName = input('');

  readonly statusChange = output<string>();

  readonly statusOptions = Object.values(ApplicationStatus) as string[];
  readonly formatStatusLabel = formatStatusLabelFn;
  readonly belowPositions = STATUS_DROPDOWN_BELOW;
  readonly scrollStrat = this.overlay.scrollStrategies.reposition();

  readonly menuOpen = signal(false);
  readonly listboxId = `application-status-listbox-${++applicationStatusSelectUid}`;

  readonly ariaLabel = computed(() => {
    const name = this.companyName().trim();
    return name ? `Change application status for ${name}` : 'Change application status';
  });

  onTriggerClick(event: MouseEvent): void {
    event.stopPropagation();
    if (this.disabled()) {
      return;
    }
    this.menuOpen.update((o) => !o);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  badgeClasses(s: string): string {
    return applicationStatusBadgeClasses(s);
  }

  dotClasses(s: string): string {
    switch (s) {
      case 'applied':
        return 'bg-blue-500';
      case 'screening':
        return 'bg-yellow-500';
      case 'technical_round':
        return 'bg-orange-500';
      case 'interviewed':
        return 'bg-purple-500';
      case 'offer_received':
        return 'bg-emerald-500';
      case 'rejected':
        return 'bg-red-500';
      case 'accepted':
        return 'bg-green-600';
      case 'withdrawn':
        return 'bg-slate-400';
      default:
        return 'bg-slate-400';
    }
  }

  onPick(next: string): void {
    if (next === this.status()) {
      this.closeMenu();
      return;
    }
    this.statusChange.emit(next);
    this.closeMenu();
  }
}
