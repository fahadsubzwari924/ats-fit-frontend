import { AfterViewInit, Component, computed, input, signal } from '@angular/core';
import {
  JobRelevanceDimensionLabel,
  JobRelevanceResult,
  JobRelevanceVerdict,
} from '@features/resume-tailoring/models/job-relevance.model';

interface DimensionRow {
  name: string;
  score: number;
  label: JobRelevanceDimensionLabel;
  barClass: string;
  labelClass: string;
}

const VERDICT_CIRCLE_CLASS: Record<JobRelevanceVerdict, string> = {
  [JobRelevanceVerdict.LOW]: 'border-destructive bg-destructive/10 text-destructive',
  [JobRelevanceVerdict.MEDIUM]: 'border-amber-500 bg-amber-500/10 text-amber-700',
  [JobRelevanceVerdict.HIGH]: 'border-success bg-success/10 text-success-strong',
};

const VERDICT_HEADLINE_CLASS: Record<JobRelevanceVerdict, string> = {
  [JobRelevanceVerdict.LOW]: 'text-destructive',
  [JobRelevanceVerdict.MEDIUM]: 'text-amber-700',
  [JobRelevanceVerdict.HIGH]: 'text-success-strong',
};

const VERDICT_LABEL: Record<JobRelevanceVerdict, string> = {
  [JobRelevanceVerdict.LOW]: 'Low Job Fit',
  [JobRelevanceVerdict.MEDIUM]: 'Medium Job Fit',
  [JobRelevanceVerdict.HIGH]: 'High Job Fit',
};

const DIMENSION_LABEL_CLASS: Record<JobRelevanceDimensionLabel, string> = {
  [JobRelevanceDimensionLabel.MISMATCH]: 'text-destructive',
  [JobRelevanceDimensionLabel.PARTIAL]: 'text-amber-600',
  [JobRelevanceDimensionLabel.ALIGNED]: 'text-success-strong',
};

const DIMENSION_BAR_CLASS: Record<JobRelevanceDimensionLabel, string> = {
  [JobRelevanceDimensionLabel.MISMATCH]: 'bg-destructive',
  [JobRelevanceDimensionLabel.PARTIAL]: 'bg-amber-500',
  [JobRelevanceDimensionLabel.ALIGNED]: 'bg-success',
};

@Component({
  selector: 'app-step-job-fit-warning',
  standalone: true,
  templateUrl: './step-job-fit-warning.component.html',
})
export class StepJobFitWarningComponent implements AfterViewInit {
  relevance = input.required<JobRelevanceResult>();

  protected animated = signal(false);

  protected readonly circleClass = computed(
    () => VERDICT_CIRCLE_CLASS[this.relevance().verdict],
  );

  protected readonly headlineClass = computed(
    () => VERDICT_HEADLINE_CLASS[this.relevance().verdict],
  );

  protected readonly verdictLabel = computed(
    () => VERDICT_LABEL[this.relevance().verdict],
  );

  protected readonly dimensionRows = computed((): DimensionRow[] => {
    const d = this.relevance().dimensions;
    return [
      {
        name: 'Tech Stack',
        score: d.techStack.score,
        label: d.techStack.label,
        barClass: DIMENSION_BAR_CLASS[d.techStack.label],
        labelClass: DIMENSION_LABEL_CLASS[d.techStack.label],
      },
      {
        name: 'Role Type',
        score: d.roleType.score,
        label: d.roleType.label,
        barClass: DIMENSION_BAR_CLASS[d.roleType.label],
        labelClass: DIMENSION_LABEL_CLASS[d.roleType.label],
      },
      {
        name: 'Experience Level',
        score: d.experienceLevel.score,
        label: d.experienceLevel.label,
        barClass: DIMENSION_BAR_CLASS[d.experienceLevel.label],
        labelClass: DIMENSION_LABEL_CLASS[d.experienceLevel.label],
      },
    ];
  });

  ngAfterViewInit(): void {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      this.animated.set(true);
      return;
    }
    setTimeout(() => this.animated.set(true), 50);
  }
}
