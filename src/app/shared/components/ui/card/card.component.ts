import { Component, Input } from '@angular/core';

type CardVariant = 'default' | 'elevated' | 'outlined';

@Component({
  selector: 'app-card',
  standalone: true,
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss'
})
export class CardComponent {
  @Input() variant: CardVariant = 'default';
  @Input() padding = 'lg';

  get cardClasses(): string {
    const classes = ['card'];
    if (this.variant !== 'default') {
      classes.push(`card--${this.variant}`);
    }
    return classes.join(' ');
  }
}
