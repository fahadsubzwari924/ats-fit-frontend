import { Component, computed, effect, ElementRef, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployerQuestionGroup, ProfileQuestion } from '@features/dashboard/models/profile-question.model';
import { ProfileQuestionItemComponent } from '../profile-question-item/profile-question-item.component';
import { DRAWER_COMPANY_COLORS } from '../../questions-drawer/questions-drawer.component';

@Component({
  selector: 'app-employer-question-group',
  standalone: true,
  imports: [CommonModule, ProfileQuestionItemComponent],
  templateUrl: './employer-question-group.component.html',
  styleUrl: './employer-question-group.component.scss',
})
export class EmployerQuestionGroupComponent {
  private readonly el = inject(ElementRef);

  group = input.required<EmployerQuestionGroup>();
  groupIndex = input<number>(0);
  expanded = input(false);
  editingQuestionId = input<string | null>(null);

  toggled = output<void>();
  saveAnswer = output<{ questionId: string; response: string }>();
  skipQuestion = output<string>();
  startEdit = output<string>();
  cancelEdit = output<void>();

  readonly isExpanded = computed(() => this.expanded());

  constructor() {
    effect(() => {
      if (this.expanded()) {
        setTimeout(() => {
          this.el.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
      }
    });
  }

  readonly companyColor = computed(
    () => DRAWER_COMPANY_COLORS[this.groupIndex() % DRAWER_COMPANY_COLORS.length]
  );

  readonly companyAnsweredCount = computed(() =>
    this.group().questions.filter((q) => q.isAnswered).length
  );

  readonly companyTotalCount = computed(() => this.group().questions.length);

  readonly isGroupComplete = computed(() => {
    const total = this.companyTotalCount();
    return total > 0 && this.companyAnsweredCount() === total;
  });

  readonly period = computed(() => {
    const g = this.group();
    if (g.startDate && g.endDate) return `${g.startDate} – ${g.endDate}`;
    if (g.startDate) return `${g.startDate} – Present`;
    return null;
  });

  companyAnswered(group: EmployerQuestionGroup): number {
    return group.questions.filter((q) => q.isAnswered).length;
  }

  companyTotal(group: EmployerQuestionGroup): number {
    return group.questions.length;
  }

  onSaveAnswer(payload: { questionId: string; response: string }): void {
    this.saveAnswer.emit(payload);
  }

  onSkipQuestion(questionId: string): void {
    this.skipQuestion.emit(questionId);
  }

  onStartEdit(questionId: string): void {
    this.startEdit.emit(questionId);
  }

  onCancelEdit(): void {
    this.cancelEdit.emit();
  }

  isEditing(q: ProfileQuestion): boolean {
    return this.editingQuestionId() === q.id;
  }

  toggleExpanded(): void {
    this.toggled.emit();
  }
}
