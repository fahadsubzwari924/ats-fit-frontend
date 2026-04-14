import { PlanFeature } from '@shared/types/plan-feature.type';

export type BillingCycle = 'weekly' | 'monthly' | 'yearly';

export class SubscriptionPlan {
  id: string;
  planName: string;
  description: string;
  price: string;
  currency: string;
  paymentGatewayVariantId: string;
  isActive: boolean;
  features: PlanFeature[];
  billingCycle: BillingCycle;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: any) {
    this.id = data?.id;
    this.planName = data?.plan_name;
    this.description = data?.description;
    this.price = data?.price;
    this.currency = data?.currency;
    this.paymentGatewayVariantId = data?.payment_gateway_variant_id;
    this.isActive = data?.is_active;
    this.features = data?.features || [];
    this.billingCycle = data?.billing_cycle;
    this.createdAt = data?.created_at ? new Date(data.created_at) : new Date();
    this.updatedAt = data?.updated_at ? new Date(data.updated_at) : new Date();
  }

}
