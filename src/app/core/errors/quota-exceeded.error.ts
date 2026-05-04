import { FeatureType } from '@core/enums/feature-type.enum';
import { UserTier } from '@core/models/quota/user-tier.type';

export class QuotaExceededError extends Error {
  readonly isQuotaExceeded = true as const;

  constructor(
    public readonly feature: FeatureType,
    public readonly tier: UserTier,
    public readonly used: number,
    public readonly allowed: number,
    public readonly resetDate: Date,
    public readonly originalResponse: unknown,
  ) {
    super(`Quota exceeded for ${feature}`);
    this.name = 'QuotaExceededError';
  }
}

export function isQuotaExceededError(err: unknown): err is QuotaExceededError {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { isQuotaExceeded?: unknown }).isQuotaExceeded === true
  );
}
