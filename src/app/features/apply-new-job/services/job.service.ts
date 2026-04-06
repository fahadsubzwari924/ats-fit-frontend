import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { JobApplicationListParams } from '@features/applications/models/job-application-list-params.model';
// Models
import { JobApplication } from '@features/apply-new-job/models/job-application.model';
import { JobApplicationCreatePayload } from '@features/apply-new-job/models/job-application-create-payload.model';
import { JobApplicationUpdatePayload } from '@features/apply-new-job/models/job-application-update-payload.model';
import { AppliedJob } from '@features/apply-new-job/models/applied-job.model';
import { JobApplicationStats } from '@features/dashboard/models/job-stats.model';
import { ApiResponse } from '@core/models/response/api-response.model';
// Constants
import { API_ROUTES } from '@core/constants/api.constant';
// Others
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class JobService {
  private http = inject(HttpClient);

  applyNewJobs(job: JobApplicationCreatePayload): Observable<JobApplication> {
    return this.http
      .post<ApiResponse<unknown>>(API_ROUTES.createAPIRoute(API_ROUTES.JOBS.APPLICATIONS), job)
      .pipe(map((response) => new JobApplication(response?.data)));
  }

  editJob(jobId: string, payload: JobApplicationUpdatePayload): Observable<JobApplication> {
    return this.http
      .put<ApiResponse<JobApplication>>(
        API_ROUTES.createAPIRoute(`${API_ROUTES.JOBS.APPLICATIONS}/${jobId}`),
        payload,
      )
      .pipe(map((response) => new JobApplication(response?.data)));
  }

  deleteJob(jobId: string): Observable<void> {
    return this.http.delete<void>(
      API_ROUTES.createAPIRoute(`${API_ROUTES.JOBS.APPLICATIONS}/${jobId}`),
    );
  }

  getJobs(params?: JobApplicationListParams): Observable<AppliedJob> {
    const httpParams = this.toListParams(params);
    return this.http
      .get<ApiResponse<any>>(API_ROUTES.createAPIRoute(API_ROUTES.JOBS.APPLICATIONS), {
        params: httpParams,
      })
      .pipe(map((response) => new AppliedJob(response?.data)));
  }

  getJobStats(): Observable<JobApplicationStats> {
    return this.http
      .get<ApiResponse<any>>(API_ROUTES.createAPIRoute(API_ROUTES.JOBS.STATS))
      .pipe(map((response) => new JobApplicationStats(response?.data)));
  }

  getJobById(
    jobId: string,
    options?: { params?: Record<string, string> },
  ): Observable<JobApplication> {
    let params = new HttpParams();
    const raw = options?.params;
    if (raw) {
      for (const [key, value] of Object.entries(raw)) {
        if (value != null && value !== '') {
          params = params.set(key, value);
        }
      }
    }
    return this.http
      .get<ApiResponse<unknown>>(API_ROUTES.createAPIRoute(`${API_ROUTES.JOBS.APPLICATIONS}/${jobId}`), {
        params,
      })
      .pipe(map((response) => new JobApplication(response?.data)));
  }

  private toListParams(p?: JobApplicationListParams): HttpParams {
    let params = new HttpParams();
    if (!p) {
      return params;
    }

    const setScalar = (key: string, value: string | number | undefined | null): void => {
      if (value === undefined || value === null) {
        return;
      }
      if (typeof value === 'string' && value.trim() === '') {
        return;
      }
      params = params.set(key, String(value));
    };

    setScalar('q', p.q);
    if (p.statuses?.length) {
      params = params.set('statuses', p.statuses.join(','));
    }
    setScalar('status', p.status);
    setScalar('company_name', p.company_name);
    setScalar('applied_at_from', p.applied_at_from);
    setScalar('applied_at_to', p.applied_at_to);
    setScalar('deadline_from', p.deadline_from);
    setScalar('deadline_to', p.deadline_to);
    setScalar('follow_up_from', p.follow_up_from);
    setScalar('follow_up_to', p.follow_up_to);
    setScalar('limit', p.limit);
    setScalar('offset', p.offset);
    setScalar('sort_by', p.sort_by);
    setScalar('sort_order', p.sort_order);
    if (p.fields?.length) {
      params = params.set('fields', p.fields.join(','));
    }

    return params;
  }
}
