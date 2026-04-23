/** Stable bar colors aligned with billing usage panel. */
const FEATURE_USAGE_BAR_PALETTE = ['#2563EB', '#7C3AED', '#0891B2'] as const;

const FEATURE_USAGE_LABEL_OVERRIDES: Record<string, string> = {
  resume_generation: 'Resume Generations',
  cover_letter: 'Cover Letters',
  resume_batch_generation: 'Batch Resume Generations',
};

const FEATURE_USAGE_COLOR_OVERRIDES: Record<string, string> = {
  resume_generation: '#7C3AED',
  cover_letter: '#2563EB',
  resume_batch_generation: '#0891B2',
};

function titleCaseFromSnake(key: string): string {
  const k = key.toLowerCase().replace(/_/g, ' ');
  return k.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getFeatureUsageLabel(feature: string): string {
  if (!feature?.trim()) return 'Usage';
  return FEATURE_USAGE_LABEL_OVERRIDES[feature] ?? titleCaseFromSnake(feature);
}

export function getFeatureUsageBarColor(feature: string, index: number): string {
  return (
    FEATURE_USAGE_COLOR_OVERRIDES[feature] ??
    FEATURE_USAGE_BAR_PALETTE[index % FEATURE_USAGE_BAR_PALETTE.length]
  );
}

/** Consumed fraction for progress bars (matches billing panel `pct`). */
export function featureUsageConsumedPercent(used: number, total: number): number {
  if (!total) return 0;
  return Math.min(100, Math.round((used / total) * 1000) / 10);
}
