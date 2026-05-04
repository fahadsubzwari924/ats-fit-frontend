import {
  Component,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ResumeTemplate } from '@features/resume-tailoring/models/resume-template.model';
import { BatchGenerateRequest } from '@features/tailor-apply/models/batch-tailoring.model';
import { QuotaGateDirective } from '@shared/directives/quota-gate.directive';
import { FeatureUsageChipComponent } from '@shared/components/feature-usage-chip/feature-usage-chip.component';
import { FeatureType } from '@core/enums/feature-type.enum';

const MAX_JOBS = 3;
const MIN_JOBS = 2;

@Component({
  selector: 'app-batch-job-input',
  standalone: true,
  imports: [ReactiveFormsModule, QuotaGateDirective, FeatureUsageChipComponent],
  templateUrl: './batch-job-input.component.html',
})
export class BatchJobInputComponent implements OnInit {
  private fb = inject(FormBuilder);

  protected readonly BATCH_FEATURE = FeatureType.RESUME_BATCH_GENERATION;

  templates = input.required<ResumeTemplate[]>();
  generate = output<BatchGenerateRequest>();

  form!: FormGroup;
  expandedIndex = signal<number | null>(0);

  get jobs(): FormArray {
    return this.form.get('jobs') as FormArray;
  }

  get canAddMore(): boolean {
    return this.jobs.length < MAX_JOBS;
  }

  get canRemove(): boolean {
    return this.jobs.length > MIN_JOBS;
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      templateId: ['', Validators.required],
      jobs: this.fb.array([this.newJobGroup(), this.newJobGroup()]),
    });
  }

  private newJobGroup(): FormGroup {
    return this.fb.group({
      jobPosition: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      companyName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      jobDescription: ['', [Validators.required, Validators.minLength(20)]],
    });
  }

  addJob(): void {
    if (!this.canAddMore) return;
    this.jobs.push(this.newJobGroup());
    this.expandedIndex.set(this.jobs.length - 1);
  }

  removeJob(index: number): void {
    if (!this.canRemove) return;
    this.jobs.removeAt(index);
    if (this.expandedIndex() === index) {
      this.expandedIndex.set(Math.max(0, index - 1));
    }
  }

  toggleExpand(index: number): void {
    this.expandedIndex.set(this.expandedIndex() === index ? null : index);
  }

  isJobValid(index: number): boolean {
    return this.jobs.at(index).valid;
  }

  jobLabel(index: number): string {
    const g = this.jobs.at(index) as FormGroup;
    const pos = g.get('jobPosition')?.value?.trim();
    const co = g.get('companyName')?.value?.trim();
    if (pos && co) return `${pos} @ ${co}`;
    if (pos) return pos;
    return `Job ${index + 1}`;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { templateId, jobs } = this.form.value;
    this.generate.emit({ templateId, jobs });
  }
}
