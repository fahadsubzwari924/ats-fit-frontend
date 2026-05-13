/**
 * Canonical match-score block — the single source of truth on the frontend.
 *
 * Mirrors the backend's `MatchScoreBlock` interface exactly. Every API endpoint
 * that returns a resume generation emits this shape, and every UI surface
 * renders it directly with zero in-template logic (no thresholds, no
 * arithmetic, no data-source selection).
 *
 * Do NOT add helpers or computed fields here — this file is intentionally
 * data-only. Classification helpers live in
 * `@shared/utils/match-score-classifier.util.ts` for the transitional header
 * fallback path only.
 */

/** Backend-derived semantic kind of the improvement. */
export type ImprovementKind =
  | 'already-strong'
  | 'improved'
  | 'low-fit'
  | 'flat';

/**
 * Semantic status color — the FE maps this to its palette tokens. The backend
 * never emits hex codes; this keeps theming a frontend concern.
 */
export type StatusColor = 'success' | 'warning' | 'muted';

export interface MatchScoreBlock {
  /** Source-side literal coverage. Range: 0–95. */
  before: number;
  /** Tailored-side alias-aware coverage. Range: 0–95. */
  after: number;
  /** `after - before` precomputed on the backend. */
  delta: number;
  /** Semantic kind — used by the FE to drive copy/iconography if needed. */
  improvementKind: ImprovementKind;
  /** Ready-to-display headline string (already localized/formatted on the BE). */
  improvementMessage: string;
  /** Maps to a palette token on the frontend (success / warning / muted). */
  statusColor: StatusColor;
}
