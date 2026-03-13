export class FeatureUsage {
  feature: string;
  allowed: number;
  remaining: number;
  used: number;
  usagePercentage: string;
  resetDate: string;

  constructor(data: any) {
    this.feature = data?.feature;
    this.allowed = data?.allowed;
    this.remaining = data?.remaining;
    this.used = data?.used;
    this.usagePercentage = data?.usagePercentage;
    this.resetDate = data?.resetDate;
  }
}
