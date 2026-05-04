import { FeatureType } from '@core/enums/feature-type.enum';

export type FeatureQuotaStatus = 'healthy' | 'approaching' | 'exhausted';

export const QUOTA_APPROACHING_THRESHOLD_PERCENT = 80;

export interface FeatureQuotaState {
  feature: FeatureType;
  used: number;
  allowed: number;
  remaining: number;
  percentage: number;
  resetDate: Date;
  daysToReset: number;
  status: FeatureQuotaStatus;
}

export function classifyQuotaStatus(
  remaining: number,
  percentage: number,
): FeatureQuotaStatus {
  if (remaining <= 0) return 'exhausted';
  if (percentage >= QUOTA_APPROACHING_THRESHOLD_PERCENT) return 'approaching';
  return 'healthy';
}
