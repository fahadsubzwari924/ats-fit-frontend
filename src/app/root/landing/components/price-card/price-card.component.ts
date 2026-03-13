import { Component, input } from '@angular/core';
import { NgClass } from '@angular/common';
// Interfaces
import { IPricing } from '@root/landing/interfaces/pricing.interface';
// Enums
import { PriceCardType } from '@root/landing/enums/price-card-type.enum';

@Component({
  selector: 'app-price-card',
  standalone: true,
  imports: [NgClass],
  templateUrl: './price-card.component.html',
  styleUrl: './price-card.component.scss'
})
export class PriceCardComponent {

  PriceCardType = PriceCardType;

  priceCard = input<IPricing>();
}
