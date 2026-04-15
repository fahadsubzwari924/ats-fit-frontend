import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IPricing } from '@root/landing/interfaces/pricing.interface';
import {
  BILLING_CYCLE,
  BillingCycle,
} from '@root/landing/constants/pricing.constants';
import { isPlanFeatureGroup } from '@shared/types/plan-feature.type';

export interface PriceDisplay {
  price: string;
  badge: string | null;
}

@Component({
  selector: 'app-price-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './price-card.component.html',
  styleUrl: './price-card.component.scss',
})
export class PriceCardComponent {
  readonly isPlanFeatureGroup = isPlanFeatureGroup;

  priceCard = input.required<IPricing>();
  selectedCycle = input<BillingCycle>(BILLING_CYCLE.MONTHLY);

  priceDisplay = computed<PriceDisplay>(() => {
    const card = this.priceCard();
    const isAnnual = this.selectedCycle() === BILLING_CYCLE.ANNUAL;
    return {
      price: (isAnnual && card.annualPrice) ? card.annualPrice : card.price,
      badge: (isAnnual && card.annualSavingsBadge) ? card.annualSavingsBadge : null,
    };
  });
}
