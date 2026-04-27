import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { OnboardingStep } from './models/onboarding-step.type';
import { OnboardingService } from './services/onboarding.service';
import { UserState } from '@core/states/user.state';
import { ResumeProfileState } from '@core/states/resume-profile.state';
import { SnackbarService } from '@shared/services/snackbar.service';
import { AppRoutes } from '@core/constants/app-routes.contant';
import { OnboardingLeftPanelComponent } from './components/onboarding-left-panel/onboarding-left-panel.component';
import { OnboardingUploadPanelComponent } from './components/onboarding-upload-panel/onboarding-upload-panel.component';
import { OnboardingSubmittedScreenComponent } from './components/onboarding-submitted-screen/onboarding-submitted-screen.component';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [
    OnboardingLeftPanelComponent,
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
  private readonly snackbar = inject(SnackbarService);

  readonly step = signal<OnboardingStep>('upload');
  readonly uploadedFile = signal<File | null>(null);

  readonly uploadedFileName = computed(() => this.uploadedFile()?.name ?? null);
  readonly uploadedFileSizeKb = computed(() => {
    const file = this.uploadedFile();
    return file ? Math.round(file.size / 1024) : null;
  });

  onFileSelected(file: File): void {
    this.uploadedFile.set(file);

    this.onboardingService.uploadResume(file).subscribe({
      next: () => {
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
      error: (err) => {
        this.uploadedFile.set(null);
        this.snackbar.showError(err?.error?.message ?? 'Upload failed. Please try again.');
      },
    });
  }

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
        this.userState.markOnboardingComplete();
        this.router.navigateByUrl(AppRoutes.DASHBOARD);
      },
    });
  }
}
