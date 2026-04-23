import {
  featureUsageConsumedPercent,
  getFeatureUsageBarColor,
  getFeatureUsageLabel,
} from './feature-usage-display';

describe('feature-usage-display', () => {
  describe('getFeatureUsageLabel', () => {
    it('maps known backend feature keys', () => {
      expect(getFeatureUsageLabel('resume_generation')).toBe('Resume Generations');
      expect(getFeatureUsageLabel('cover_letter')).toBe('Cover Letters');
      expect(getFeatureUsageLabel('resume_batch_generation')).toBe('Batch Resume Generations');
    });

    it('title-cases unknown snake_case keys', () => {
      expect(getFeatureUsageLabel('future_feature_key')).toBe('Future Feature Key');
    });

    it('handles empty feature as Usage', () => {
      expect(getFeatureUsageLabel('')).toBe('Usage');
      expect(getFeatureUsageLabel('   ')).toBe('Usage');
    });
  });

  describe('getFeatureUsageBarColor', () => {
    it('returns stable per-feature colors when defined', () => {
      expect(getFeatureUsageBarColor('resume_generation', 0)).toBe('#7C3AED');
      expect(getFeatureUsageBarColor('cover_letter', 99)).toBe('#2563EB');
    });

    it('falls back to palette by index for unknown features', () => {
      expect(getFeatureUsageBarColor('unknown', 0)).toBe('#2563EB');
      expect(getFeatureUsageBarColor('unknown', 1)).toBe('#7C3AED');
    });
  });

  describe('featureUsageConsumedPercent', () => {
    it('returns 0 when total is 0', () => {
      expect(featureUsageConsumedPercent(5, 0)).toBe(0);
    });

    it('matches billing pct rounding', () => {
      expect(featureUsageConsumedPercent(1, 3)).toBe(33.3);
      expect(featureUsageConsumedPercent(3, 3)).toBe(100);
    });
  });
});
