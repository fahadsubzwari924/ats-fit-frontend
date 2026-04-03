import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-onboarding-left-panel',
  standalone: true,
  templateUrl: './onboarding-left-panel.component.html',
  styleUrls: ['./onboarding-left-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingLeftPanelComponent {
  @Input({ required: true }) screen: 'choice' | 'upload' = 'choice';
}

