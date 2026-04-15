export const BILLING_CYCLE = {
  MONTHLY: 'monthly',
  ANNUAL: 'annual',
} as const;

export type BillingCycle = (typeof BILLING_CYCLE)[keyof typeof BILLING_CYCLE];
