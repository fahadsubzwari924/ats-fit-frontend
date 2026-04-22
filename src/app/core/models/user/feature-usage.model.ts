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

  constructor(data: Record<string, unknown>) {
    this.feature = data['feature'] as string;
    this.allowed = data['allowed'] as number;
    this.remaining = data['remaining'] as number;
    this.used = data['used'] as number;
    this.usagePercentage = data['usagePercentage'] as string;
    this.resetDate = data['resetDate'] as string;
    this.cycleStart = data['cycleStart'] as string;
    this.daysRemaining = (data['daysRemaining'] as number | undefined) ?? 0;
  }
}
