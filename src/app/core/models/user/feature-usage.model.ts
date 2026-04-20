export class FeatureUsage {
  feature: string;
  allowed: number;
  remaining: number;
  used: number;
  usagePercentage: string;
  /** ISO date-string for the end of the current billing period. */
  resetDate: string;
  /** ISO date-string for the start of the current billing period. */
  cycleStart: string;
  /** Whole days remaining until the period ends (≥ 0), pre-computed by the backend. */
  daysRemaining: number;

  constructor(data: any) {
    this.feature = data?.feature;
    this.allowed = data?.allowed;
    this.remaining = data?.remaining;
    this.used = data?.used;
    this.usagePercentage = data?.usagePercentage;
    this.resetDate = data?.resetDate;
    this.cycleStart = data?.cycleStart;
    this.daysRemaining = data?.daysRemaining ?? 0;
  }
}
