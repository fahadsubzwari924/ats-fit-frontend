import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  signal,
} from '@angular/core';

@Component({
  selector: 'app-onboarding-choice-panel',
  standalone: true,
  templateUrl: './onboarding-choice-panel.component.html',
  styleUrls: ['./onboarding-choice-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingChoicePanelComponent {
  @Output() readonly continueWithUpload = new EventEmitter<void>();
  @Output() readonly skipToDashboard = new EventEmitter<void>();

  readonly selected = signal<'a' | 'b'>('a');

  select(option: 'a' | 'b'): void {
    this.selected.set(option);
  }

  onContinue(): void {
    if (this.selected() === 'a') {
      this.continueWithUpload.emit();
    } else {
      this.skipToDashboard.emit();
    }
  }

  onSkip(): void {
    this.skipToDashboard.emit();
  }
}
