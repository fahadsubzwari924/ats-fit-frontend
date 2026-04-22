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

  constructor(data: Record<string, unknown>) {
    this.id = data['id'] as string;
    this.planName = data['plan_name'] as string;
    this.description = data['description'] as string;
    this.price = data['price'] as string;
    this.currency = data['currency'] as string;
    this.paymentGatewayVariantId = data['payment_gateway_variant_id'] as string;
    this.isActive = data['is_active'] as boolean;
    this.features = (data['features'] as PlanFeature[]) || [];
    this.billingCycle = data['billing_cycle'] as BillingCycle;
    const created = data['created_at'] as string | undefined;
    const updated = data['updated_at'] as string | undefined;
    this.createdAt = created ? new Date(created) : new Date();
    this.updatedAt = updated ? new Date(updated) : new Date();
  }

}
