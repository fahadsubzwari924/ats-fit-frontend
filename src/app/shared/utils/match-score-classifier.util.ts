import type {
  ImprovementKind,
  MatchScoreBlock,
  StatusColor,
} from '@shared/types/match-score-block.model';

/**
 * Mirrors the backend's `MatchScoreClassifierService.classify` rules.
 *
 * This is a TRANSITIONAL fallback used by `ResumeService` only when the BE
 * returns the legacy per-field headers (`x-match-score-before/after/delta`)
 * without the unified `X-Match-Score` JSON header. Once every deployed BE
 * instance ships the unified header, this util can be deleted.
 *
 * TODO: remove after BE v2.3 stable.
 */
export function classifyMatchScoreBlock(
  before: number,
  after: number,
  delta?: number,
): MatchScoreBlock {
  const resolvedDelta = delta ?? after - before;

  let improvementKind: ImprovementKind;
  let statusColor: StatusColor;
  let improvementMessage: string;

  if (after < 40) {
    improvementKind = 'low-fit';
    statusColor = 'muted';
    improvementMessage =
      'Limited keyword overlap — strengthen relevant experience';
  } else if (before >= 80 && resolvedDelta < 10) {
    improvementKind = 'already-strong';
    statusColor = 'success';
    improvementMessage = 'Already a strong match — minor refinements applied';
  } else if (resolvedDelta >= 10) {
    improvementKind = 'improved';
    statusColor = 'success';
    improvementMessage = `+${resolvedDelta}% improvement`;
  } else {
    improvementKind = 'flat';
    statusColor = 'warning';
    improvementMessage = `Match score: ${after}%`;
  }

  return {
    before,
    after,
    delta: resolvedDelta,
    improvementKind,
    improvementMessage,
    statusColor,
  };
}
