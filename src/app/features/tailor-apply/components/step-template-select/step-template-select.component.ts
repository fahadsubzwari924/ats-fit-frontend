import { Component, computed, inject, input, output } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormGroup } from '@angular/forms';
import { ResumeState } from '@core/states/resume.state';
import { TailoringNudgeBannerComponent } from '@features/resume-tailoring/components/tailoring-nudge-banner/tailoring-nudge-banner.component';
import { TemplateKey } from '@core/enums/template-key.enum';

@Component({
  selector: 'app-step-template-select',
  standalone: true,
  imports: [NgClass, TailoringNudgeBannerComponent],
  templateUrl: './step-template-select.component.html',
})
export class StepTemplateSelectComponent {
  private readonly resumeState = inject(ResumeState);

  form = input.required<FormGroup>();
  isProcessing = input<boolean>(false);
  progress = input<number>(0);

  generate = output<void>();
  answerQuestionsFirst = output<void>();
  minimize = output<void>();

  readonly templates = this.resumeState.templates;
  readonly TemplateKey = TemplateKey;

  readonly processingPhase = computed(() => {
    const p = this.progress();
    if (p < 35) return 0;
    if (p < 70) return 1;
    return 2;
  });

  get selectedTemplate() {
    return this.form().get('selectedTemplate');
  }

  get canGenerate(): boolean {
    return !!(this.selectedTemplate?.value);
  }

  selectTemplate(templateId: string): void {
    this.selectedTemplate?.setValue(templateId);
  }

  onGenerate(): void {
    if (this.canGenerate) {
      this.generate.emit();
    } else {
      this.selectedTemplate?.markAsTouched();
    }
  }
}
