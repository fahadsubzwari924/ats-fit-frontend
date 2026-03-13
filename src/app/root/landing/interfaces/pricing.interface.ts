import { PriceCardType } from "@root/landing/enums/price-card-type.enum";

export interface IPricing {
  title: string;
  price: string;
  description: string;
  icon: string;
  isPopular?: boolean;
  buttonText: string;
  buttonLink: string;
  features: string[];
  type: PriceCardType;
}
