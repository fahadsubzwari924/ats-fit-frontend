import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostBinding,
} from '@angular/core';
@Component({
  selector: 'app-accordion-section',
  standalone: true,
  imports: [],
  template: `
    <div class="accordion" [class.accordion--expanded]="expanded">
      <!-- Header -->
      <button
        type="button"
        class="accordion__header"
        [id]="headerId"
        [attr.aria-expanded]="expanded"
        [attr.aria-controls]="panelId"
        (click)="toggle()"
      >
        <span class="accordion__title">{{ title }}</span>
        <svg
          class="accordion__chevron"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      <!-- Body panel -->
      <div
        [id]="panelId"
        role="region"
        [attr.aria-labelledby]="headerId"
        class="accordion__panel"
        [class.accordion__panel--open]="expanded"
      >
        <div class="accordion__body">
          <ng-content />
        </div>
      </div>
    </div>
  `,
  styles: [`
    @use 'design-tokens' as *;
    @use 'mixins' as *;

    :host {
      display: block;
      width: 100%;
    }

    .accordion {
      border: 1px solid $color-border;
      border-radius: $radius-lg;
      background-color: $color-card;

      &__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: $spacing-md $spacing-lg;
        border: none;
        background: transparent;
        text-align: left;
        cursor: pointer;
        @include transition(background-color, fast);
        gap: $spacing-sm;
        border-radius: $radius-lg;

        .accordion--expanded & {
          border-radius: $radius-lg $radius-lg 0 0;
        }

        &:hover {
          background-color: $color-accent;
        }

        &:focus-visible {
          outline: none;
          box-shadow: inset 0 0 0 2px $color-ring;
        }
      }

      &__title {
        font-size: $font-size-sm;
        font-weight: $font-weight-semibold;
        color: $color-foreground;
        line-height: $line-height-snug;
        flex: 1 1 auto;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      &__chevron {
        flex-shrink: 0;
        color: $color-muted-foreground;
        transform: rotate(0deg);
        transition: transform $transition-normal $easing-ease-in-out;
        will-change: transform;
      }

      &--expanded .accordion__chevron {
        transform: rotate(180deg);
      }

      /* Animate height with grid trick — no JS height measurement required */
      &__panel {
        display: grid;
        grid-template-rows: 0fr;
        transition: grid-template-rows $transition-normal $easing-ease-in-out;

        &--open {
          grid-template-rows: 1fr;
        }

        /* Inner wrapper is required for the grid animation trick */
        > .accordion__body {
          overflow: hidden;
        }
      }

      &__body {
        padding: 0 $spacing-lg $spacing-lg;
      }
    }
  `],
})
export class AccordionSectionComponent {
  private static nextId = 0;
  readonly panelId = `accordion-panel-${AccordionSectionComponent.nextId++}`;
  readonly headerId = `accordion-header-${AccordionSectionComponent.nextId}`;

  @Input() title = '';
  @Input() expanded = false;
  @Output() expandedChange = new EventEmitter<boolean>();

  @HostBinding('class') readonly hostClass = 'accordion-section-host';

  toggle(): void {
    this.expanded = !this.expanded;
    this.expandedChange.emit(this.expanded);
  }
}
