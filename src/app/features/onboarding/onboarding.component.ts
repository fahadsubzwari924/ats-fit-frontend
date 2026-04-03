import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { OnboardingStep } from './models/onboarding-step.type';
import { OnboardingService } from './services/onboarding.service';
import { UserState } from '@core/states/user.state';
import { ResumeProfileState } from '@core/states/resume-profile.state';
import { AppRoutes } from '@core/constants/app-routes.contant';
import { OnboardingLeftPanelComponent } from './components/onboarding-left-panel/onboarding-left-panel.component';
import { OnboardingChoicePanelComponent } from './components/onboarding-choice-panel/onboarding-choice-panel.component';
import { OnboardingUploadPanelComponent } from './components/onboarding-upload-panel/onboarding-upload-panel.component';
import { OnboardingSubmittedScreenComponent } from './components/onboarding-submitted-screen/onboarding-submitted-screen.component';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [
    OnboardingLeftPanelComponent,
    OnboardingChoicePanelComponent,
    OnboardingUploadPanelComponent,
    OnboardingSubmittedScreenComponent,
  ],
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingComponent {
  private readonly router = inject(Router);
  private readonly onboardingService = inject(OnboardingService);
  private readonly userState = inject(UserState);
  private readonly profileState = inject(ResumeProfileState);

  readonly step = signal<OnboardingStep>('choice');
  readonly uploadedFile = signal<File | null>(null);

  get uploadedFileName(): string | null {
    return this.uploadedFile()?.name ?? null;
  }

  get uploadedFileSizeKb(): number | null {
    const file = this.uploadedFile();
    return file ? Math.round(file.size / 1024) : null;
  }

  /** Called when user picks "Upload resume first" in the choice step. */
  onContinueWithUpload(): void {
    this.step.set('upload');
  }

  /** Called when user skips to dashboard at the choice step or upload step. */
  onSkipToDashboard(): void {
    this.completeThenNavigate();
  }

  /** Called when user selects a valid file in the upload step. */
  onFileSelected(file: File): void {
    this.uploadedFile.set(file);

    this.onboardingService.uploadResume(file).subscribe({
      next: () => {
        // Pre-seed the shared state so the dashboard card renders "Processing"
        // immediately on navigation, without waiting for the first API poll.
        this.profileState.setProfileStatus({
          hasResume: true,
          processingStatus: 'processing',
          questionsTotal: 0,
          questionsAnswered: 0,
          profileCompleteness: 0,
          enrichedProfileId: null,
          tailoringMode: 'none',
        });
        this.step.set('submitted');
      },
      error: () => {
        // Even if upload fails, show the submitted screen and
        // let onboarding complete so the user isn't stuck.
        this.step.set('submitted');
      },
    });
  }

  /** Called when user presses back from upload step. */
  onBackToChoice(): void {
    this.step.set('choice');
  }

  /** Called when submitted screen auto-redirects or user clicks "Go to Dashboard". */
  onGoToDashboard(): void {
    this.completeThenNavigate();
  }

  private completeThenNavigate(): void {
    this.onboardingService.completeOnboarding().subscribe({
      next: (updatedUser) => {
        this.userState.setUser(updatedUser);
        this.router.navigateByUrl(AppRoutes.DASHBOARD);
      },
      error: () => {
        // Even on API failure, update local state so the guard doesn't loop.
        this.userState.markOnboardingComplete();
        this.router.navigateByUrl(AppRoutes.DASHBOARD);
      },
    });
  }
}
