import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  JobApplicationInterview,
  JobApplicationInterviewCreatePayload,
  JobApplicationInterviewUpdatePayload,
} from '../models/interview';
import { ApiResponse } from '@core/models/response/api-response.model';
import { API_ROUTES } from '@core/constants/api.constant';
import { Observable, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class JobApplicationInterviewService {
  private http = inject(HttpClient);

  list(jobApplicationId: string): Observable<JobApplicationInterview[]> {
    return this.http
      .get<ApiResponse<unknown[]>>(
        API_ROUTES.createAPIRoute(API_ROUTES.JOBS.INTERVIEWS(jobApplicationId)),
      )
      .pipe(
        map((response) => {
          const data = (response?.data ?? []) as unknown[];
          return data.map((item: unknown) => new JobApplicationInterview(item));
        }),
      );
  }

  create(
    jobApplicationId: string,
    payload: JobApplicationInterviewCreatePayload,
  ): Observable<JobApplicationInterview> {
    return this.http
      .post<ApiResponse<unknown>>(
        API_ROUTES.createAPIRoute(API_ROUTES.JOBS.INTERVIEWS(jobApplicationId)),
        payload,
      )
      .pipe(map((response) => new JobApplicationInterview(response?.data)));
  }

  update(
    jobApplicationId: string,
    interviewId: string,
    payload: JobApplicationInterviewUpdatePayload,
  ): Observable<JobApplicationInterview> {
    return this.http
      .put<ApiResponse<unknown>>(
        API_ROUTES.createAPIRoute(API_ROUTES.JOBS.INTERVIEW(jobApplicationId, interviewId)),
        payload,
      )
      .pipe(map((response) => new JobApplicationInterview(response?.data)));
  }

  delete(jobApplicationId: string, interviewId: string): Observable<void> {
    return this.http.delete<void>(
      API_ROUTES.createAPIRoute(API_ROUTES.JOBS.INTERVIEW(jobApplicationId, interviewId)),
    );
  }
}
