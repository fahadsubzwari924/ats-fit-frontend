import { Component, input } from '@angular/core';
// Interfaces
import { IFeature } from '@root/landing/interfaces/feature.interface';

@Component({
  selector: 'app-feature-card',
  standalone: true,
  imports: [],
  templateUrl: './feature-card.component.html',
  styleUrl: './feature-card.component.scss'
})
export class FeatureCardComponent {
  feature = input<IFeature>();
}
