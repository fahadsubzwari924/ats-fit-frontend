/**
 * ATS Score Rating Configuration
 * Centralized configuration for score ratings - highly scalable and maintainable
 */

export interface IScoreRatingConfig {
  readonly minScore: number;
  readonly rating: string;
  readonly emoji: string;
  readonly className: string;
  readonly description: string;
}

/**
 * ATS Score Rating Thresholds
 * Ordered from highest to lowest score for efficient lookup
 */
export const ATS_SCORE_RATING_CONFIG: readonly IScoreRatingConfig[] = [
  {
    minScore: 90,
    rating: 'Outstanding',
    emoji: '🏆',
    className: 'text-purple-600',
    description: 'Perfect match for the role!',
  },
  {
    minScore: 80,
    rating: 'Excellent',
    emoji: '🎉',
    className: 'text-emerald-600',
    description: 'Very strong candidate',
  },
  {
    minScore: 70,
    rating: 'Good',
    emoji: '👍',
    className: 'text-blue-600',
    description: 'Solid alignment with requirements',
  },
  {
    minScore: 60,
    rating: 'Fair',
    emoji: '📊',
    className: 'text-yellow-600',
    description: 'Some alignment, room for improvement',
  },
  {
    minScore: 40,
    rating: 'Poor',
    emoji: '⚠️',
    className: 'text-orange-600',
    description: 'Significant gaps to address',
  },
  {
    minScore: 0,
    rating: 'Very Poor',
    emoji: '❌',
    className: 'text-red-600',
    description: 'Not suitable for the role',
  }
] as const;

/**
 * Utility class for ATS Score Rating operations
 * Encapsulates business logic for score evaluation
 */
export class ATSScoreRatingService {

  /**
   * Get rating configuration for a given score
   */
  static getRatingConfig(score: number): IScoreRatingConfig {
    const safeScore = Math.max(0, Math.min(100, score)); // Clamp between 0-100

    const ratingConfig = ATS_SCORE_RATING_CONFIG.find(config =>
      safeScore >= config.minScore
    );

    // Fallback to the lowest rating if no match found
    return ratingConfig || ATS_SCORE_RATING_CONFIG[ATS_SCORE_RATING_CONFIG.length - 1];
  }

}
