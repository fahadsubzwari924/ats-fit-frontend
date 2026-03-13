export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  isCurrentPlan: boolean;
  isPopular?: boolean;
  buttonText: string;
  buttonAction?: string;
  buttonClasses: string;
  cardClasses: string;
  badgeText?: string;
  badgeClasses?: string;
}

export interface BillingInfo {
  currentPlan: string;
  nextBilling: string;
  amount: string;
}