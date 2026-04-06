import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { catchError, forkJoin, interval, of, switchMap, takeWhile } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DashboardUsageCardComponent } from '@features/dashboard/components/ui/dashboard-usage-card/dashboard-usage-card.component';
import { DashboardTipsCardComponent } from '@features/dashboard/components/ui/dashboard-tips-card/dashboard-tips-card.component';
import { TailoreResumeUploadComponent } from '@features/dashboard/components/features/tailore-resume-upload/tailore-resume-upload.component';
import { ResumeProfileCardComponent } from '@features/dashboard/components/resume-profile-card/resume-profile-card.component';
import { QuestionsDrawerComponent } from '@features/dashboard/components/questions-drawer/questions-drawer.component';
import { TailorApplyModalComponent } from '@features/tailor-apply/tailor-apply-modal.component';
import { BatchTailoringModalComponent } from '@features/tailor-apply/batch-tailoring-modal.component';
import { ResumeHistoryModalComponent } from '@features/dashboard/components/resume-history/resume-history-modal.component';
import { JobService } from '@features/apply-new-job/services/job.service';
import { ResumeService } from '@shared/services/resume.service';
import { ModalService } from '@shared/services/modal.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ProfileQuestionsService } from '@features/dashboard/services/profile-questions.service';
import { UserState } from '@core/states/user.state';
import { ResumeProfileState } from '@core/states/resume-profile.state';
import { AppliedJob } from '@features/apply-new-job/models/applied-job.model';
import { JobApplication } from '@features/apply-new-job/models/job-application.model';
import { FeatureUsage } from '@core/models/user/feature-usage.model';
import { ResumeProfileStatus } from '@features/dashboard/models/resume-profile.model';
import { ResumeHistoryItem } from '@features/dashboard/models/resume-history.model';
import { TailoringModalCloseResult } from '@features/tailor-apply/models/tailoring-modal-close-result.model';
import { Messages } from '@core/enums/messages.enum';
import { ApiResponse } from '@core/models/response/api-response.model';
import { ResponseStatus } from '@core/enums/response-status.enum';
import { saveAs } from 'file-saver';
import { DashboardHeroComponent } from '@shared/components/dashboard-hero/dashboard-hero.component';
import { QuestionsBannerComponent } from '@shared/components/questions-banner/questions-banner.component';
import { ResumeHistoryCardComponent } from '@shared/components/resume-history-card/resume-history-card.component';
import { JobApplicationsCardComponent } from '@shared/components/job-applications-card/job-applications-card.component';

const POLL_INTERVAL_MS = 5000;
const POLL_MAX_ATTEMPTS = 24;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    TailoreResumeUploadComponent,
    ResumeProfileCardComponent,
    QuestionsDrawerComponent,
    DashboardUsageCardComponent,
    DashboardTipsCardComponent,
    DashboardHeroComponent,
    QuestionsBannerComponent,
    ResumeHistoryCardComponent,
    JobApplicationsCardComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private userState = inject(UserState);
  private profileStateService = inject(ResumeProfileState);
  private destroyRef = inject(DestroyRef);
  private modalService = inject(ModalService);
  private jobService = inject(JobService);
  private resumeService = inject(ResumeService);
  private snackbarService = inject(SnackbarService);
  private profileQuestionsService = inject(ProfileQuestionsService);

  public featureUsage = signal<FeatureUsage[]>([]);
  public jobHistory = signal<AppliedJob | null>(null);
  public resumeHistory = signal<ResumeHistoryItem[]>([]);
  public resumeHistoryLoading = signal(false);
  public downloadingId = signal<string | null>(null);

  public user = this.userState.currentUser();

  drawerOpen = signal<boolean>(false);
  private enrichmentAutoTriggered = signal(false);
  private hasAutoOpenedDrawer = signal(false);

  get showQuestionsBanner(): boolean {
    const status = this.profileStateService.profileStatus();
    if (!status) return false;
    return status.questionsTotal > 0 && status.questionsAnswered < status.questionsTotal;
  }

  ngOnInit(): void {
    this.initializeContent();
    this.loadProfileStatus();
    this.resumeService.getResumeTemplates().subscribe();
  }

  private loadProfileStatus(): void {
    this.profileQuestionsService.getProfileStatus().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (status) => {
        this.profileStateService.setProfileStatus(status);
        if (status.processingStatus === 'queued' || status.processingStatus === 'processing') {
          this.startProfileStatusPolling();
        }
        this.autoTriggerEnrichmentIfNeeded(status);
      },
      error: () => this.profileStateService.setProfileStatus(null),
    });
  }

  private autoTriggerEnrichmentIfNeeded(status: ResumeProfileStatus): void {
    const needsEnrichment =
      status.questionsTotal > 0 &&
      status.questionsAnswered === status.questionsTotal &&
      !status.enrichedProfileId &&
      !this.enrichmentAutoTriggered();

    if (!needsEnrichment) return;

    this.enrichmentAutoTriggered.set(true);
    this.profileQuestionsService
      .markComplete()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.profileStateService.setEnrichedProfileId(res.enrichedProfileId),
        error: () => this.enrichmentAutoTriggered.set(false),
      });
  }

  private startProfileStatusPolling(): void {
    let attempts = 0;
    let prevProcessingStatus: string | null = null;

    this.profileStateService.setPollingTimedOut(false);

    interval(POLL_INTERVAL_MS)
      .pipe(
        switchMap(() => this.profileQuestionsService.getProfileStatus()),
        takeUntilDestroyed(this.destroyRef),
        takeWhile((status) => {
          attempts++;

          const justCompleted =
            prevProcessingStatus === 'processing' &&
            status.processingStatus === 'completed' &&
            status.questionsTotal > 0 &&
            !this.hasAutoOpenedDrawer();

          if (justCompleted) {
            this.hasAutoOpenedDrawer.set(true);
            setTimeout(() => this.drawerOpen.set(true), 1000);
          }

          prevProcessingStatus = status.processingStatus;
          this.profileStateService.setProfileStatus(status);

          const timedOut =
            attempts >= POLL_MAX_ATTEMPTS &&
            status.processingStatus !== 'completed' &&
            status.processingStatus !== 'failed';

          if (timedOut) {
            this.profileStateService.setPollingTimedOut(true);
          }

          const done =
            status.processingStatus === 'completed' ||
            status.processingStatus === 'failed' ||
            attempts >= POLL_MAX_ATTEMPTS;
          return !done;
        }, true)
      )
      .subscribe();
  }

  onRetryProcessing(): void {
    this.profileStateService.setPollingTimedOut(false);
    this.startProfileStatusPolling();
  }

  onProfileUploadRequested(file: File): void {
    const formData = new FormData();
    formData.append('resumeFile', file);
    this.resumeService.uploadResume(formData).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: ApiResponse<unknown>) => {
        if (res.status === ResponseStatus.SUCCESS) {
          this.profileStateService.setProfileStatus({
            hasResume: true,
            processingStatus: 'processing',
            questionsTotal: 0,
            questionsAnswered: 0,
            profileCompleteness: 0,
            enrichedProfileId: null,
            tailoringMode: 'none',
          });
          this.snackbarService.showSuccess(Messages.RESUME_UPLOADED_SUCCESSFULLY ?? 'Resume uploaded. Analyzing...');
          this.startProfileStatusPolling();
        }
      },
      error: (err) => {
        this.snackbarService.showError(err?.error?.message ?? err?.message ?? Messages.UPLOAD_FAILED_PLEASE_TRY_AGAIN);
      },
    });
  }

  onScrollToQuestions(): void {
    this.drawerOpen.set(true);
  }

  onDrawerClosed(): void {
    this.drawerOpen.set(false);
  }

  private initializeContent(): void {
    this.refreshDashboardData();
  }

  private refreshDashboardData(): void {
    forkJoin([
      this.resumeService.getFeatureUsage().pipe(catchError(() => of([]))),
      this.jobService.getJobs().pipe(catchError(() => of(null))),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([feature, jobs]) => {
        this.jobHistory.set(jobs as AppliedJob | null);
        this.featureUsage.set((feature as FeatureUsage[])?.length ? (feature as FeatureUsage[]) : []);
      });

    this.loadResumeHistory();
  }

  private handleTailoringModalClosed(result: unknown): void {
    if (result == null) return;

    if (typeof result === 'string') {
      if (result === 'scrollToQuestions') {
        this.drawerOpen.set(true);
      }
      return;
    }

    if (typeof result === 'object') {
      const r = result as TailoringModalCloseResult;
      if (r.scrollToQuestions) {
        this.drawerOpen.set(true);
      }
      if (r.refreshDashboard) {
        this.refreshDashboardData();
      }
    }
  }

  private loadResumeHistory(): void {
    this.resumeHistoryLoading.set(true);
    this.resumeService
      .getResumeHistory(5)
      .pipe(catchError(() => of([])), takeUntilDestroyed(this.destroyRef))
      .subscribe((history) => {
        this.resumeHistory.set(history);
        this.resumeHistoryLoading.set(false);
      });
  }

  public openTailorModal(): void {
    this.modalService
      .openModal(TailorApplyModalComponent, undefined, { width: '620px', maxWidth: '95vw', panelClass: 'tailor-modal-panel' })
      .afterClosed()
      .subscribe({
        next: (result) => this.handleTailoringModalClosed(result),
      });
  }

  public openBatchTailoringModal(): void {
    this.modalService
      .openModal(BatchTailoringModalComponent, undefined, {
        width: '640px',
        maxWidth: '95vw',
        panelClass: 'tailor-modal-panel',
      })
      .afterClosed()
      .subscribe({
        next: (result) => this.handleTailoringModalClosed(result),
      });
  }

  public openResumeHistoryModal(): void {
    this.modalService.openModal(ResumeHistoryModalComponent, undefined, {
      width: '680px',
      maxWidth: '95vw',
      panelClass: 'tailor-modal-panel',
    });
  }

  public downloadHistoryItem(item: ResumeHistoryItem): void {
    this.downloadingId.set(item.id);
    this.resumeService.downloadResumeById(item.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (blob) => {
        const filename = `${item.jobPosition ?? 'resume'}-${item.companyName ?? ''}.pdf`.replace(/\s+/g, '-').toLowerCase();
        saveAs(blob, filename);
        this.downloadingId.set(null);
      },
      error: () => {
        this.snackbarService.showError('Download failed. Please try again.');
        this.downloadingId.set(null);
      },
    });
  }

  public onJobStatusChange(job: JobApplication): void {
    this.jobService.editJob(job.id, { status: job.status }).subscribe({
      next: () => this.snackbarService.showSuccess(Messages.JOB_STATUS_UPDATED_SUCCESSFULLY),
      error: (error) => this.snackbarService.showError(error?.message || error?.error?.message),
    });
  }
}
