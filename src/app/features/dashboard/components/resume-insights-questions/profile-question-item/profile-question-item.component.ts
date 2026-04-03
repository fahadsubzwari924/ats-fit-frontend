import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileQuestion } from '@features/dashboard/models/profile-question.model';

@Component({
  selector: 'app-profile-question-item',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-question-item.component.html',
  styleUrl: './profile-question-item.component.scss',
})
export class ProfileQuestionItemComponent {
  question = input.required<ProfileQuestion>();

  /** When true, parent has set this question into edit mode */
  isEditing = input<boolean>(false);

  /** Current draft text (for edit mode), initialized when entering edit mode */
  draftResponse = signal<string>('');

  saveAnswer = output<{ questionId: string; response: string }>();
  skipQuestion = output<string>();
  startEdit = output<void>();
  cancelEdit = output<void>();

  onToggle(): void {
    if (this.isEditing()) {
      this.draftResponse.set('');
      this.cancelEdit.emit();
    } else {
      this.draftResponse.set(this.question().userResponse ?? '');
      this.startEdit.emit();
    }
  }

  onSave(): void {
    const q = this.question();
    const draft = this.draftResponse().trim();
    if (!draft) return;
    this.saveAnswer.emit({ questionId: q.id, response: draft });
    this.draftResponse.set('');
  }

  onSkip(): void {
    this.skipQuestion.emit(this.question().id);
  }

  onStartEdit(): void {
    this.draftResponse.set(this.question().userResponse ?? '');
    this.startEdit.emit();
  }

  onCancelEdit(): void {
    this.draftResponse.set('');
    this.cancelEdit.emit();
  }

  getDraftValue(): string {
    return this.draftResponse();
  }
}
