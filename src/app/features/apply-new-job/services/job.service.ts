import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
// Models
import { JobApplication } from "@features/apply-new-job/models/job-application.model";
import { AppliedJob } from "@features/apply-new-job/models/applied-job.model";
import { JobApplicationStats } from "@features/dashboard/models/job-stats.model";
import { ApiResponse } from "@core/models/response/api-response.model";
// Constants
import { API_ROUTES } from "@core/constants/api.constant";
// Others
import { Observable, map } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class JobService {

  private http = inject(HttpClient);

  applyNewJobs(job: any): Observable<JobApplication> {
    return this.http.post<ApiResponse<any>>(API_ROUTES.createAPIRoute(API_ROUTES.JOBS.APPLICATIONS), job)
    .pipe(
      map(response => new JobApplication(response?.data))
    );
  }

  editJob(jobId: string, payload: any): Observable<JobApplication> {
    return this.http.put<ApiResponse<JobApplication>>(API_ROUTES.createAPIRoute(`${API_ROUTES.JOBS.APPLICATIONS}/${jobId}`), payload)
      .pipe(
        map(response => new JobApplication(response?.data))
      );
  }

  getJobs(): Observable<AppliedJob> {
    return this.http.get<ApiResponse<any>>(API_ROUTES.createAPIRoute(API_ROUTES.JOBS.APPLICATIONS))
      .pipe(
        map(response => new AppliedJob(response?.data))
      );
  }

  getJobStats(): Observable<JobApplicationStats> {
    return this.http.get<ApiResponse<any>>(API_ROUTES.createAPIRoute(API_ROUTES.JOBS.STATS))
      .pipe(
        map(response => new JobApplicationStats(response?.data))
      );
  }

  getJobById(jobId: string, queryParams: any): Observable<any> {
    return this.http.get<ApiResponse<any>>(API_ROUTES.createAPIRoute(`${API_ROUTES.JOBS.APPLICATIONS}/${jobId}`), { params: queryParams });
  }


}
