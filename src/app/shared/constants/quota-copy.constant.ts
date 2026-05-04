import { FeatureType } from '@core/enums/feature-type.enum';
import { UserTier } from '@core/models/quota/user-tier.type';

export interface QuotaCopyVars {
  used: number;
  allowed: number;
  resetDate: string;
  daysToReset: number;
  feature: string;
  betaExpiryDate?: string;
  betaDaysRemaining?: number;
}

export type QuotaCtaKind = 'upgrade' | 'view-plans' | 'contact' | 'dismiss' | 'none';

export interface QuotaCta {
  label: string;
  kind: QuotaCtaKind;
}

export interface QuotaCopyEntry {
  headline: string;
  body: string;
  primary: QuotaCta;
  secondary?: QuotaCta;
}

export const FEATURE_NOUNS: Record<FeatureType, string> = {
  [FeatureType.RESUME_GENERATION]: 'Tailor',
  [FeatureType.COVER_LETTER]: 'cover letter',
  [FeatureType.RESUME_BATCH_GENERATION]: 'batch tailor',
  [FeatureType.JOB_APPLICATION_TRACKING]: 'application',
};

export const QUOTA_COPY: Record<UserTier, QuotaCopyEntry> = {
  freemium: {
    headline: "You're out of free {feature} credits",
    body: "You've used **{used}/{allowed}** this month. Resets **{resetDate}** ({daysToReset}d).",
    primary: { label: 'Upgrade to Premium', kind: 'upgrade' },
  },
  beta_active: {
    headline: 'Premium quota reached',
    body: "You've used **{used}/{allowed}** this month. Quota resets **{resetDate}**. Your beta ends **{betaExpiryDate}** — upgrade now to keep premium quotas.",
    primary: { label: 'Upgrade plan', kind: 'upgrade' },
    secondary: { label: 'Maybe later', kind: 'dismiss' },
  },
  beta_expiring_soon: {
    headline: 'Your beta ends in **{betaDaysRemaining}** days',
    body: "You've used your full premium quota. After your trial ends you'll revert to freemium with a smaller monthly allowance. Upgrade now to keep premium.",
    primary: { label: 'Upgrade now', kind: 'upgrade' },
  },
  premium_paid: {
    headline: "You've reached this month's limit",
    body: "You've used **{used}/{allowed}** of your monthly quota. Resets **{resetDate}** ({daysToReset}d).",
    primary: { label: '', kind: 'none' },
    secondary: { label: 'Need more? Contact us', kind: 'contact' },
  },
};

export function substituteCopy(template: string, vars: QuotaCopyVars): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const v = (vars as unknown as Record<string, unknown>)[key];
    return v === undefined || v === null ? match : String(v);
  });
}
