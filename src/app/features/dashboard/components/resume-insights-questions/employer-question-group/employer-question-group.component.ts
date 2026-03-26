import { Component, computed, effect, input, output, signal } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { EmployerQuestionGroup, ProfileQuestion } from '@features/dashboard/models/profile-question.model';
import { ProfileQuestionItemComponent } from '../profile-question-item/profile-question-item.component';

@Component({
  selector: 'app-employer-question-group',
  standalone: true,
  imports: [CommonModule, NgClass, ProfileQuestionItemComponent],
  templateUrl: './employer-question-group.component.html',
  styleUrl: './employer-question-group.component.scss',
})
export class EmployerQuestionGroupComponent {
  group = input.required<EmployerQuestionGroup>();

  /** Which question id is currently in edit mode (single edit at a time across groups) */
  editingQuestionId = input<string | null>(null);

  saveAnswer = output<{ questionId: string; response: string }>();
  skipQuestion = output<string>();
  startEdit = output<string>();
  cancelEdit = output<void>();

  expanded = signal<boolean>(true);

  private readonly groupComplete = computed(() => this.isGroupComplete(this.group()));

  constructor() {
    // Auto-collapse when all questions in this group become answered.
    // Users can still manually re-open any collapsed group.
    effect(() => {
      if (this.groupComplete()) {
        this.expanded.set(false);
      }
    });
  }

  companyAnswered(group: EmployerQuestionGroup): number {
    return group.questions.filter((q) => q.isAnswered).length;
  }

  companyTotal(group: EmployerQuestionGroup): number {
    return group.questions.length;
  }

  isGroupComplete(group: EmployerQuestionGroup): boolean {
    const total = this.companyTotal(group);
    return total > 0 && this.companyAnswered(group) === total;
  }

  toggle(): void {
    this.expanded.update((v) => !v);
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
}
