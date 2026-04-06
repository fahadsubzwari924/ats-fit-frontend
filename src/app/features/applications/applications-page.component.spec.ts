import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AppliedJob } from '@features/apply-new-job/models/applied-job.model';
import { JobService } from '@features/apply-new-job/services/job.service';
import { JobApplicationStats } from '@features/dashboard/models/job-stats.model';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ModalService } from '@shared/services/modal.service';
import { ApplicationsPageComponent } from './applications-page.component';

describe('ApplicationsPageComponent', () => {
  let fixture: ComponentFixture<ApplicationsPageComponent>;
  let component: ApplicationsPageComponent;

  const emptyList = new AppliedJob({ applications: [], total: 0 });
  const emptyStats = new JobApplicationStats({
    total_applications: 0,
    applications_by_status: {},
    average_ats_score: 0,
    response_rate: 0,
    interview_rate: 0,
    success_rate: 0,
    top_companies: [],
    monthly_trend: [],
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationsPageComponent],
      providers: [
        {
          provide: JobService,
          useValue: {
            getJobs: jasmine.createSpy('getJobs').and.returnValue(of(emptyList)),
            getJobStats: jasmine.createSpy('getJobStats').and.returnValue(of(emptyStats)),
            deleteJob: jasmine.createSpy('deleteJob').and.returnValue(of(undefined)),
          },
        },
        {
          provide: SnackbarService,
          useValue: {
            showError: jasmine.createSpy('showError'),
          },
        },
        {
          provide: ModalService,
          useValue: {
            openModal: () => ({
              afterClosed: () => of(false),
            }),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load stats and list on init', () => {
    const jobService = TestBed.inject(JobService);
    expect(jobService.getJobStats).toHaveBeenCalled();
    expect(jobService.getJobs).toHaveBeenCalled();
    expect(component.stats()).toEqual(emptyStats);
    expect(component.listResult()).toEqual(emptyList);
    expect(component.loading()).toBe(false);
  });
});
