export const PLAN_NAME_FRAGMENTS = {
  PRO: 'pro',
  FREE: 'free',
} as const;

export const PLAN_ACCENT_COLORS = {
  PRO: '#2563EB',
  DEFAULT: '#64748B',
} as const;

export const PRO_PLAN_DEFAULTS = {
  PRICE_MAIN: '$12',
  NEXT_CHARGE: '$12.00',
  NEXT_CHARGE_WITH_PERIOD: '$12.00/mo',
  LABEL: 'Pro',
} as const;

export const BILLING_PERIOD = {
  YEARLY: 'yearly',
  MONTHLY: 'monthly',
  WEEKLY: 'weekly',
} as const;

export const PLAN_LABELS = {
  FREE: 'Free',
  PREMIUM: 'Premium',
  PREMIUM_MONTHLY: 'Premium Monthly',
} as const;
