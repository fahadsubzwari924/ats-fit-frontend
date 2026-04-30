import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { StorageService } from '@shared/services/storage.service';
import { StorageKeys } from '@core/enums/storage-keys.enum';
import { BetaState } from '@core/states/beta.state';
import { BetaExpiryModalComponent } from '@shared/components/beta-expiry-modal/beta-expiry-modal.component';
import { catchError, forkJoin, interval, of, switchMap, takeWhile, timer } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DashboardUsageCardComponent } from '@features/dashboard/components/ui/dashboard-usage-card/dashboard-usage-card.component';
import { DashboardTipsCardComponent } from '@features/dashboard/components/ui/dashboard-tips-card/dashboard-tips-card.component';
import { TailoreResumeUploadComponent } from '@features/dashboard/components/features/tailore-resume-upload/tailore-resume-upload.component';
import { ResumeProfileCardComponent } from '@features/dashboard/components/resume-profile-card/resume-profile-card.component';
import {
  QuestionsDrawerComponent,
  QUESTIONS_DRAWER_EXIT_MS,
} from '@features/dashboard/components/questions-drawer/questions-drawer.component';
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
import { UpgradeFeatureDialogComponent } from '@shared/components/upgrade-feature-dialog/upgrade-feature-dialog.component';
import { DashboardPostTailorUpgradeBannerComponent } from '@features/dashboard/components/dashboard-post-tailor-upgrade-banner/dashboard-post-tailor-upgrade-banner.component';

const POLL_INTERVAL_MS = 5000;
const POST_TAILOR_UPGRADE_SUPPRESS_MS = 7 * 24 * 60 * 60 * 1000;
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
    DashboardPostTailorUpgradeBannerComponent,
    BetaExpiryModalComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  readonly userState = inject(UserState);
  readonly hasResume = computed(() => (this.userState.uploadedResumes()?.length ?? 0) > 0);
  private profileStateService = inject(ResumeProfileState);
  private destroyRef = inject(DestroyRef);
  private modalService = inject(ModalService);
  private jobService = inject(JobService);
  private resumeService = inject(ResumeService);
  private snackbarService = inject(SnackbarService);
  private profileQuestionsService = inject(ProfileQuestionsService);
  private storageService = inject(StorageService);
  private readonly betaState = inject(BetaState);

  private readonly showExpiryModal = computed(() => this.betaState.isExpiredBeta() && this.betaState.hasPostExpiryOffer());
  readonly modalDismissed = signal(false);
  readonly displayModal = computed(() => this.showExpiryModal() && !this.modalDismissed());

  public featureUsage = signal<FeatureUsage[]>([]);
  public jobHistory = signal<AppliedJob | null>(null);
  public resumeHistory = signal<ResumeHistoryItem[]>([]);
  public resumeHistoryLoading = signal(false);
  public downloadingId = signal<string | null>(null);

  /** Shown after a successful tailor when user is not premium and has not dismissed recently. */
  showPostTailorUpgradeNudge = signal(false);

  drawerOpen = signal<boolean>(false);
  /** Keeps `QuestionsDrawerComponent` in the DOM while open or during exit animation. */
  drawerMounted = signal<boolean>(false);
  private pendingDrawerCloseToken = 0;
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
            setTimeout(() => this.openQuestionsDrawer(), 1000);
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
    this.openQuestionsDrawer();
  }

  onDrawerClosed(): void {
    this.drawerOpen.set(false);
    const token = ++this.pendingDrawerCloseToken;
    timer(QUESTIONS_DRAWER_EXIT_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.pendingDrawerCloseToken === token && !this.drawerOpen()) {
          this.drawerMounted.set(false);
        }
      });
  }

  private openQuestionsDrawer(): void {
    this.pendingDrawerCloseToken++;
    this.drawerMounted.set(true);
    this.drawerOpen.set(true);
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
        this.openQuestionsDrawer();
      }
      return;
    }

    if (typeof result === 'object') {
      const r = result as TailoringModalCloseResult;
      if (r.scrollToQuestions) {
        this.openQuestionsDrawer();
      }
      if (r.refreshDashboard) {
        this.refreshDashboardData();
      }
      if (r.tailoringCompleted && !this.userState.isPremiumUser() && !this.shouldSuppressPostTailorUpgrade()) {
        this.showPostTailorUpgradeNudge.set(true);
      }
    }
  }

  private shouldSuppressPostTailorUpgrade(): boolean {
    const raw = this.storageService.getItem(StorageKeys.POST_TAILOR_UPGRADE_DISMISSED_AT);
    if (!raw) return false;
    const t = Date.parse(raw);
    if (Number.isNaN(t)) return false;
    return Date.now() - t < POST_TAILOR_UPGRADE_SUPPRESS_MS;
  }

  onPostTailorUpgradeDismissed(): void {
    this.storageService.setItem(StorageKeys.POST_TAILOR_UPGRADE_DISMISSED_AT, new Date().toISOString());
    this.showPostTailorUpgradeNudge.set(false);
  }

  onModalClosed(): void {
    this.modalDismissed.set(true);
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

  scrollToResumeManager(): void {
    document.getElementById('resume-manager')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  public openTailorModal(): void {
    if (!this.hasResume()) {
      this.snackbarService.showError('Please upload your resume first to use Resume Tailoring.');
      this.scrollToResumeManager();
      return;
    }

    this.modalService
      .openModal(TailorApplyModalComponent, undefined, { width: '620px', maxWidth: '95vw', panelClass: 'tailor-modal-panel' })
      .afterClosed()
      .subscribe({
        next: (result) => this.handleTailoringModalClosed(result),
      });
  }

  public openBatchTailoringModal(): void {
    if (!this.hasResume()) {
      this.snackbarService.showError('Please upload your resume first to use Resume Tailoring.');
      this.scrollToResumeManager();
      return;
    }

    if (!this.userState.isPremiumUser()) {
      this.modalService
        .openModal(UpgradeFeatureDialogComponent, undefined, {
          width: '420px',
          maxWidth: '95vw',
          panelClass: 'upgrade-feature-dialog-panel',
        })
        .afterClosed()
        .subscribe();
      return;
    }

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
