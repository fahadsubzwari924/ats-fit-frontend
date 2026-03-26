import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TailoringMode } from '@features/dashboard/models/resume-profile.model';
import { ButtonComponent } from '@shared/components/ui/button/button.component';

@Component({
  selector: 'app-tailoring-mode-badge',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './tailoring-mode-badge.component.html',
  styleUrl: './tailoring-mode-badge.component.scss',
})
export class TailoringModeBadgeComponent {
  mode = input<TailoringMode>('standard');

  /** For enhanced mode: number of sections that used verified facts (e.g. 5 of 9) */
  enhancedSectionsUsed = input<number>(0);
  enhancedSectionsTotal = input<number>(0);

  /** Emitted when user clicks CTA to answer questions */
  answerQuestionsClick = output<void>();

  readonly completenessPercent = this.enhancedSectionsTotal() > 0
    ? Math.round((this.enhancedSectionsUsed() / this.enhancedSectionsTotal()) * 100)
    : 0;

  onAnswerQuestions(): void {
    this.answerQuestionsClick.emit();
  }
}
