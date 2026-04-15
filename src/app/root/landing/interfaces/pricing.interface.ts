import { PriceCardType } from '@root/landing/enums/price-card-type.enum';
import { PlanFeature } from '@shared/types/plan-feature.type';

export interface IPricing {
  title: string;
  price: string;
  annualPrice?: string;
  annualSavingsBadge?: string;
  description: string;
  icon: string;
  isPopular?: boolean;
  buttonText: string;
  buttonLink: string;
  features: PlanFeature[];
  type: PriceCardType;
}
