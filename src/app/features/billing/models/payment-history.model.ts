/* eslint-disable @typescript-eslint/no-explicit-any -- Lemon Squeezy webhook payloads are deeply nested and untyped at the boundary */
import { SubscriptionPlan } from './subscription-plan.model';

export type PaymentStatus = 'success' | 'failed' | 'pending' | 'refunded';
export type PaymentType = 'subscription' | 'one-time' | 'upgrade';

export class PaymentGatewayResponse {
  data: {
    id: string;
    type: string;
    links: {
      self: string;
    };
    attributes: {
      tax: number;
      urls: {
        invoiceUrl: string;
      };
      total: number;
      status: string;
      taxUsd: number;
      currency: string;
      refunded: boolean;
      storeId: number;
      subtotal: number;
      testMode: boolean;
      totalUsd: number;
      userName: string;
      cardBrand: string;
      createdAt: string;
      updatedAt: string;
      userEmail: string;
      customerId: number;
      refundedAt: string | null;
      subtotalUsd: number;
      currencyRate: string;
      taxFormatted: string;
      taxInclusive: boolean;
      billingReason: string;
      cardLastFour: string;
      discountTotal: number;
      refundedAmount: number;
      subscriptionId: number;
      totalFormatted: string;
      statusFormatted: string;
      discountTotalUsd: number;
      subtotalFormatted: string;
      refundedAmountUsd: number;
      discountTotalFormatted: string;
      refundedAmountFormatted: string;
    };
    relationships: {
      store: {
        links: {
          self: string;
          related: string;
        };
      };
      customer: {
        links: {
          self: string;
          related: string;
        };
      };
      subscription: {
        links: {
          self: string;
          related: string;
        };
      };
    };
  };
  meta: {
    testMode: boolean;
    eventName: string;
    webhookId: string;
    customData: {
      email: string;
      planId: string;
      userId: string;
    };
  };

  constructor(data: any) {
    this.data = {
      id: data?.data?.id || '',
      type: data?.data?.type || '',
      links: {
        self: data?.data?.links?.self || ''
      },
      attributes: {
        tax: data?.data?.attributes?.tax || 0,
        urls: {
          invoiceUrl: data?.data?.attributes?.urls?.invoice_url || ''
        },
        total: data?.data?.attributes?.total || 0,
        status: data?.data?.attributes?.status || '',
        taxUsd: data?.data?.attributes?.tax_usd || 0,
        currency: data?.data?.attributes?.currency || 'USD',
        refunded: data?.data?.attributes?.refunded || false,
        storeId: data?.data?.attributes?.store_id || 0,
        subtotal: data?.data?.attributes?.subtotal || 0,
        testMode: data?.data?.attributes?.test_mode || false,
        totalUsd: data?.data?.attributes?.total_usd || 0,
        userName: data?.data?.attributes?.user_name || '',
        cardBrand: data?.data?.attributes?.card_brand || '',
        createdAt: data?.data?.attributes?.created_at || '',
        updatedAt: data?.data?.attributes?.updated_at || '',
        userEmail: data?.data?.attributes?.user_email || '',
        customerId: data?.data?.attributes?.customer_id || 0,
        refundedAt: data?.data?.attributes?.refunded_at || null,
        subtotalUsd: data?.data?.attributes?.subtotal_usd || 0,
        currencyRate: data?.data?.attributes?.currency_rate,
        taxFormatted: data?.data?.attributes?.tax_formatted || '$0.00',
        taxInclusive: data?.data?.attributes?.tax_inclusive || false,
        billingReason: data?.data?.attributes?.billing_reason || '',
        cardLastFour: data?.data?.attributes?.card_last_four || '',
        discountTotal: data?.data?.attributes?.discount_total || 0,
        refundedAmount: data?.data?.attributes?.refunded_amount || 0,
        subscriptionId: data?.data?.attributes?.subscription_id || 0,
        totalFormatted: data?.data?.attributes?.total_formatted || '$0.00',
        statusFormatted: data?.data?.attributes?.status_formatted || '',
        discountTotalUsd: data?.data?.attributes?.discount_total_usd || 0,
        subtotalFormatted: data?.data?.attributes?.subtotal_formatted || '$0.00',
        refundedAmountUsd: data?.data?.attributes?.refunded_amount_usd || 0,
        discountTotalFormatted: data?.data?.attributes?.discount_total_formatted || '$0.00',
        refundedAmountFormatted: data?.data?.attributes?.refunded_amount_formatted || '$0.00'
      },
      relationships: {
        store: {
          links: {
            self: data?.data?.relationships?.store?.links?.self || '',
            related: data?.data?.relationships?.store?.links?.related || ''
          }
        },
        customer: {
          links: {
            self: data?.data?.relationships?.customer?.links?.self || '',
            related: data?.data?.relationships?.customer?.links?.related || ''
          }
        },
        subscription: {
          links: {
            self: data?.data?.relationships?.subscription?.links?.self || '',
            related: data?.data?.relationships?.subscription?.links?.related || ''
          }
        }
      }
    };
    this.meta = {
      testMode: data?.meta?.test_mode || false,
      eventName: data?.meta?.event_name || '',
      webhookId: data?.meta?.webhook_id || '',
      customData: {
        email: data?.meta?.custom_data?.email || '',
        planId: data?.meta?.custom_data?.plan_id || '',
        userId: data?.meta?.custom_data?.user_id || ''
      }
    };
  }
}

export class PaymentHistory {
  id: string;
  paymentGatewayTransactionId: string;
  amount: string;
  currency: string;
  status: PaymentStatus;
  paymentType: PaymentType;
  userId: string;
  subscriptionPlanId: string;
  paymentGatewayResponse: PaymentGatewayResponse;
  customerEmail: string;
  isTestMode: boolean;
  processedAt: Date;
  retryCount: number;
  lastRetryAt: Date | null;
  processingError: string | null;
  metadata: {
    customData: {
      email: string;
      planId: string;
      userId: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
  subscriptionPlan: SubscriptionPlan | null;
  statusClasses?: string;
  iconClasses?: string;
  iconColor?: string;

  constructor(data: any) {
    this.id = data?.id;
    this.paymentGatewayTransactionId = data?.payment_gateway_transaction_id;
    this.amount = data?.amount;
    this.currency = data?.currency || 'USD';
    this.status = data?.status;
    this.paymentType = data?.payment_type;
    this.userId = data?.user_id;
    this.subscriptionPlanId = data?.subscription_plan_id;
    this.paymentGatewayResponse = new PaymentGatewayResponse(data?.payment_gateway_response);
    this.customerEmail = data?.customer_email;
    this.isTestMode = data?.is_test_mode ?? false;
    this.processedAt = data?.processed_at ? new Date(data.processed_at) : new Date();
    this.retryCount = data?.retry_count || 0;
    this.lastRetryAt = data?.last_retry_at ? new Date(data.last_retry_at) : null;
    this.processingError = data?.processing_error || null;
    this.metadata = {
      customData: {
        email: data?.metadata?.customData?.email,
        planId: data?.metadata?.customData?.plan_id,
        userId: data?.metadata?.customData?.user_id
      }
    };
    this.createdAt = data?.created_at ? new Date(data.created_at) : new Date();
    this.updatedAt = data?.updated_at ? new Date(data.updated_at) : new Date();
    this.subscriptionPlan = data?.subscription_plan ? new SubscriptionPlan(data?.subscription_plan) : null;
  }

}
