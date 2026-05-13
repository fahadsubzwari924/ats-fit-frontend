import {
  Component,
  computed,
  inject,
  input,
  output,
  OnInit,
  signal,
} from '@angular/core';
import {
  EnhancedResumeDiff,
  ExperienceDiff,
  ResumeDiff,
  SectionDiff,
  isEnhancedDiff,
} from '@features/resume-tailoring/models/resume-diff.model';
import type { MatchScoreBlock } from '@shared/types/match-score-block.model';
import { ResumeDiffService } from '@shared/services/resume-diff.service';
import { ResumeDiffHighlightService } from '@shared/services/resume-diff-highlight.service';
import { DiffStepShellComponent } from '@shared/components/resume-diff/diff-step-shell/diff-step-shell.component';
import { DiffMetricTileComponent } from '@shared/components/resume-diff/diff-metric-tile/diff-metric-tile.component';
import { DiffChangeBadgeComponent } from '@shared/components/resume-diff/diff-change-badge/diff-change-badge.component';
import {
  DiffNavRailComponent,
  type DiffNavStep,
} from '@shared/components/resume-diff/diff-nav-rail/diff-nav-rail.component';

@Component({
  selector: 'app-resume-comparison',
  standalone: true,
  imports: [
    DiffStepShellComponent,
    DiffMetricTileComponent,
    DiffChangeBadgeComponent,
    DiffNavRailComponent,
  ],
  templateUrl: './resume-comparison.component.html',
  styleUrl: './resume-comparison.component.scss',
})
export class ResumeComparisonComponent implements OnInit {
  private readonly diffService = inject(ResumeDiffService);
  private readonly highlightService = inject(ResumeDiffHighlightService);

  resumeGenerationId = input.required<string>();
  /**
   * Canonical match-score block sourced from the parent surface (history
   * detail, single-tailoring result, or batch result). When provided, the
   * "Job match & keywords" step renders these numbers and headline directly
   * with no in-template arithmetic. Optional during the BE → FE transition;
   * once every parent always plumbs it through, this can become required.
   */
  matchScore = input<MatchScoreBlock | null>(null);
  dismissed = output<void>();

  diff = signal<ResumeDiff | EnhancedResumeDiff | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  /** Matches a digest step id for the sticky nav highlight. */
  activeNavId = signal<string>('rd-overview');

  readonly isEnhanced = computed(() => isEnhancedDiff(this.diff()));

  readonly enhancedDiff = computed<EnhancedResumeDiff | null>(() => {
    const d = this.diff();
    return isEnhancedDiff(d) ? d : null;
  });

  readonly changedSections = computed(() =>
    (this.diff()?.changes ?? []).filter((c) => c.changeType !== 'unchanged'),
  );

  readonly unchangedSections = computed(() =>
    (this.diff()?.changes ?? []).filter((c) => c.changeType === 'unchanged'),
  );

  readonly unchangedSectionNames = computed(() =>
    this.unchangedSections()
      .map((c) => c.section)
      .join(', '),
  );

  readonly totalKeywordsAdded = computed<number>(() => {
    const d = this.enhancedDiff();
    if (!d) {
      return (this.diff()?.changes ?? []).reduce(
        (sum, c) => sum + (c.addedKeywords?.length ?? 0),
        0,
      );
    }
    return d.keywordAnalysis.newlyAdded.length;
  });

  readonly totalBulletsRewritten = computed<number>(() => {
    const d = this.enhancedDiff();
    if (!d) return 0;
    return d.experience.reduce(
      (sum, exp) =>
        sum + exp.bulletChanges.filter((b) => b.changeType !== 'unchanged').length,
      0,
    );
  });

  /**
   * Improvement delta surfaced in the Step 1 overview prose. Reads the canonical
   * BE-supplied `matchScore.delta` directly — no FE arithmetic, no fallback to
   * the now-deprecated `keywordAnalysis.coverage*` fields.
   */
  readonly coverageImprovement = computed<number>(() => {
    return this.matchScore()?.delta ?? 0;
  });

  /**
   * Progress-bar width for the "Before" coverage stripe. Reads
   * `matchScore.before` straight from the parent-supplied block.
   */
  readonly coverageBarWidthOrig = computed(() => {
    const ms = this.matchScore();
    return ms ? `${ms.before}%` : '0%';
  });

  /**
   * Progress-bar width for the "After" coverage stripe. Reads `matchScore.after`
   * straight from the parent-supplied block.
   */
  readonly coverageBarWidthOpt = computed(() => {
    const ms = this.matchScore();
    return ms ? `${ms.after}%` : '0%';
  });

  /**
   * Ordered walkthrough: overview → job match (enhanced) → summary → skills → roles → legacy sections.
   */
  readonly digestSteps = computed<DiffNavStep[]>(() => {
    const base: { id: string; label: string }[] = [
      { id: 'rd-overview', label: 'Overview' },
    ];
    const d = this.diff();
    if (!d) {
      return base.map((s, i) => ({ ...s, stepIndex: i + 1 }));
    }
    if (isEnhancedDiff(d)) {
      base.push({ id: 'rd-match', label: 'Job match' });
      if (d.summary && d.summary.changeType !== 'unchanged') {
        base.push({ id: 'rd-summary', label: 'Summary' });
      }
      if (d.skills && d.skills.changeType !== 'unchanged') {
        base.push({ id: 'rd-skills', label: 'Skills' });
      }
      d.experience.forEach((exp, i) => {
        if (exp.changeType !== 'unchanged') {
          const label =
            exp.company.length > 16 ? `${exp.company.slice(0, 14)}…` : exp.company;
          base.push({ id: `rd-exp-${i}`, label });
        }
      });
    } else {
      this.changedSections().forEach((c, i) => {
        const label =
          c.section.length > 18 ? `${c.section.slice(0, 16)}…` : c.section;
        base.push({ id: `rd-legacy-${i}`, label });
      });
    }
    return base.map((s, i) => ({ ...s, stepIndex: i + 1 }));
  });

  readonly showOriginal = signal<Set<string>>(new Set());

  ngOnInit(): void {
    this.loadDiff();
  }

  private loadDiff(): void {
    this.loading.set(true);
    this.error.set(null);
    this.diffService.getDiff(this.resumeGenerationId()).subscribe({
      next: (diff) => {
        this.diff.set(diff);
        this.loading.set(false);
        this.activeNavId.set('rd-overview');
      },
      error: () => {
        this.error.set('Could not load comparison data. Please try again.');
        this.loading.set(false);
      },
    });
  }

  scrollToStep(id: string): void {
    this.activeNavId.set(id);
    queueMicrotask(() => {
      const el = document.getElementById(id);
      if (!el) return;
      const scrollParent = this.findScrollableParent(el);
      if (scrollParent) {
        const elRect = el.getBoundingClientRect();
        const parentRect = scrollParent.getBoundingClientRect();
        scrollParent.scrollBy({ top: elRect.top - parentRect.top - 16, behavior: 'smooth' });
      } else {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  private findScrollableParent(element: HTMLElement): HTMLElement | null {
    let el = element.parentElement;
    while (el) {
      const overflow = getComputedStyle(el).overflowY;
      if (overflow === 'auto' || overflow === 'scroll') return el;
      el = el.parentElement;
    }
    return null;
  }

  stepNumberFor(id: string): number {
    return this.digestSteps().find((s) => s.id === id)?.stepIndex ?? 1;
  }

  toggleShowOriginal(key: string): void {
    const current = new Set(this.showOriginal());
    if (current.has(key)) {
      current.delete(key);
    } else {
      current.add(key);
    }
    this.showOriginal.set(current);
  }

  isShowingOriginal(key: string): boolean {
    return this.showOriginal().has(key);
  }

  getChangeTypeLabel(type: SectionDiff['changeType'] | ExperienceDiff['changeType']): string {
    const map: Record<string, string> = {
      modified: 'Updated',
      added: 'Added',
      removed: 'Removed',
      unchanged: 'Unchanged',
    };
    return map[type] ?? type;
  }

  getSimilarityLabel(similarity: number): string {
    if (similarity >= 0.7) return 'Minor edit';
    if (similarity >= 0.4) return 'Rewritten';
    return 'Significantly rewritten';
  }

  changedBulletsCount(exp: ExperienceDiff): number {
    return exp.bulletChanges.filter((b) => b.changeType !== 'unchanged').length;
  }

  highlight(text: string, keywords: string[]) {
    return this.highlightService.highlightKeywords(text, keywords);
  }

  retry(): void {
    this.loadDiff();
  }
}
