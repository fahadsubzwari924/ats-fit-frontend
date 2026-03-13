import { Component, inject, OnInit, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { forkJoin } from 'rxjs';
// Components
import { JobHistoryCardComponent } from '@features/dashboard/components/ui/job-history-card/job-history-card.component';
import { PremiumBannerComponent } from '@features/dashboard/components/ui/premium-banner/premium-banner.component';
import { StatWidgetComponent } from '@features/dashboard/components/ui/stat-widget/stat-widget.component';
import { RecentActivityComponent } from '@features/dashboard/components/ui/recent-activity/recent-activity.component';
import { TailoreResumeUploadComponent } from '@features/dashboard/components/features/tailore-resume-upload/tailore-resume-upload.component';
import { AtsScoringModalComponent } from '@features/ats-scoring/ats-scoring-modal.component';
import { ResumeTailoringModalComponent } from '@features/resume-tailoring/resume-tailoring-modal.component';
import { ApplyNewJobModalComponent } from '@features/apply-new-job/apply-new-job-modal.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
// Services
import { JobService } from '@features/apply-new-job/services/job.service';
import { ResumeService } from '@shared/services/resume.service';
import { ModalService } from '@shared/services/modal.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ATSService } from '@features/ats-scoring/services/ats.service';
// States
import { UserState } from '@core/states/user.state';
// Models
import { AtsMatchHistory } from '@features/ats-scoring/models/ats-match-history.model';
import { AppliedJob } from '@features/apply-new-job/models/applied-job.model';
import { JobApplication } from '@features/apply-new-job/models/job-application.model';
import { FeatureUsage } from '@core/models/user/feature-usage.model';
// Enums
import { SubscriptionType } from '@core/enums/subscription-type.enum';
import { Messages } from '@core/enums/messages.enum';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RecentActivityComponent,
    StatWidgetComponent,
    PremiumBannerComponent,
    JobHistoryCardComponent,
    TailoreResumeUploadComponent,
    ButtonComponent,
    NgClass,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {

  // States
  private userState = inject(UserState);

  // Inject dependencies
  private modalService = inject(ModalService);
  private jobService = inject(JobService);
  private atsService = inject(ATSService);
  private resumeService = inject(ResumeService);
  private snackbarService = inject(SnackbarService);

  // Subscription plan
  public SubscriptionType = SubscriptionType;

  // Properties for data binding
  public atsHistory = signal<AtsMatchHistory[]>([]);
  public featureUsage = signal<FeatureUsage[]>([]);
  public jobHistory = signal<AppliedJob | null>(null);
  public user = this.userState.currentUser();
  public uploadedResume = this.userState.uploadedResumes();

  ngOnInit() {
    this.initializeContent();
    // Trigger templates loading (cached after first call)
    this.resumeService.getResumeTemplates().subscribe();
  }

  private initializeContent(): void {
    forkJoin([
      this.resumeService.getFeatureUsage(),
      this.jobService.getJobs(),
      this.atsService.getATSMatchHistory(this.user?.id),
    ]).subscribe(([feature, jobs, history]) => {
      this.jobHistory.set(jobs);
      this.featureUsage.set(feature?.length ? feature : []);
      this.atsHistory.set(history);
    });
  }

  public openResumeModal(): void {
    this.modalService
      .openModal(ResumeTailoringModalComponent)
      .afterClosed()
      .subscribe({
        next: () => {
          this.initializeContent();
        },
      });
  }

  public openAtsModal(): void {
    this.modalService
      .openModal(AtsScoringModalComponent)
      .afterClosed()
      .subscribe({
        next: () => {
          this.initializeContent();
        },
      });
  }

  public openApplyNewJobModal(): void {
    this.modalService
      .openModal(ApplyNewJobModalComponent)
      .afterClosed()
      .subscribe({
        next: () => {
          this.initializeContent();
        },
      });
  }

  public onJobStatusChange(job: JobApplication): void {
    const payload = {
      status: job.status,
    };
    this.jobService.editJob(job.id, payload).subscribe({
      next: (updatedJob) => {
        this.snackbarService.showSuccess(
          Messages.JOB_STATUS_UPDATED_SUCCESSFULLY
        );
      },
      error: (error) => {
        this.snackbarService.showError(error?.message || error?.error?.message);
      },
    });
  }
}
