import { Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-step-job-details',
  standalone: true,
  imports: [ReactiveFormsModule, NgClass],
  templateUrl: './step-job-details.component.html',
})
export class StepJobDetailsComponent {
  form = input.required<FormGroup>();
  /** When true, the form is hidden and a "Checking job fit..." overlay is
   *  rendered (mirrors the StepTemplateSelectComponent processing pattern). */
  isProcessing = input<boolean>(false);
  progress = input<number>(0);
  next = output<void>();

  get jobPosition() { return this.form().get('jobPosition'); }
  get companyName() { return this.form().get('companyName'); }
  get jobDescription() { return this.form().get('jobDescription'); }

  get jdLength(): number {
    return (this.jobDescription?.value || '').length;
  }

  get isStepValid(): boolean {
    return !!(
      this.jobPosition?.valid &&
      this.companyName?.valid &&
      this.jdLength >= 20
    );
  }

  onNext(): void {
    this.jobPosition?.markAsTouched();
    this.companyName?.markAsTouched();
    this.jobDescription?.markAsTouched();
    if (this.isStepValid) {
      this.next.emit();
    }
  }
}
