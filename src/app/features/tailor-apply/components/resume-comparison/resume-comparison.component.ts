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
  close = output<void>();

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
    const summaryKw = d.summary?.addedKeywords?.length ?? 0;
    const experienceKw = d.experience.reduce(
      (sum, exp) =>
        sum +
        exp.bulletChanges.reduce(
          (bs, b) => bs + (b.addedKeywords?.length ?? 0),
          0,
        ),
      0,
    );
    return summaryKw + experienceKw;
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

  readonly coverageImprovement = computed<number>(() => {
    const d = this.enhancedDiff();
    if (!d) return 0;
    return d.keywordAnalysis.coverageOptimized - d.keywordAnalysis.coverageOriginal;
  });

  readonly coverageBarWidthOrig = computed(() => {
    const d = this.enhancedDiff();
    return d ? `${d.keywordAnalysis.coverageOriginal}%` : '0%';
  });

  readonly coverageBarWidthOpt = computed(() => {
    const d = this.enhancedDiff();
    return d ? `${d.keywordAnalysis.coverageOptimized}%` : '0%';
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
    current.has(key) ? current.delete(key) : current.add(key);
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
