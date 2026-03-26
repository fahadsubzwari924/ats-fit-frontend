import {
  Component,
  computed,
  inject,
  input,
  output,
  OnInit,
  signal,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { ResumeDiff, SectionDiff } from '@features/resume-tailoring/models/resume-diff.model';
import { ResumeDiffService } from '@shared/services/resume-diff.service';

@Component({
  selector: 'app-resume-comparison',
  standalone: true,
  imports: [NgClass],
  templateUrl: './resume-comparison.component.html',
})
export class ResumeComparisonComponent implements OnInit {
  private readonly diffService = inject(ResumeDiffService);

  resumeGenerationId = input.required<string>();
  close = output<void>();

  diff = signal<ResumeDiff | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  expandedSections = signal<Set<number>>(new Set([0]));

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
      },
      error: () => {
        this.error.set('Could not load comparison data. Please try again.');
        this.loading.set(false);
      },
    });
  }

  toggleSection(index: number): void {
    const current = new Set(this.expandedSections());
    if (current.has(index)) {
      current.delete(index);
    } else {
      current.add(index);
    }
    this.expandedSections.set(current);
  }

  isSectionExpanded(index: number): boolean {
    return this.expandedSections().has(index);
  }

  getChangeTypeLabel(type: SectionDiff['changeType']): string {
    const map: Record<string, string> = {
      modified: 'Updated',
      added: 'Added',
      removed: 'Removed',
      unchanged: 'No changes',
    };
    return map[type] ?? type;
  }

  getChangeBadgeClass(type: SectionDiff['changeType']): string {
    const map: Record<string, string> = {
      modified: 'bg-emerald-100 text-emerald-700',
      added: 'bg-blue-100 text-blue-700',
      removed: 'bg-red-100 text-red-700',
      unchanged: 'bg-slate-100 text-slate-500',
    };
    return map[type] ?? 'bg-slate-100 text-slate-500';
  }

  retry(): void {
    this.loadDiff();
  }
}
