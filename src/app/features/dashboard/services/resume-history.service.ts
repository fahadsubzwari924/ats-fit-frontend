import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_ROUTES } from '@core/constants/api.constant';
import { ApiResponse } from '@core/models/response/api-response.model';
import {
  PaginatedHistoryResponse,
  ResumeHistoryDetail,
} from '@features/dashboard/models/resume-history.model';

export interface HistoryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortOrder?: 'ASC' | 'DESC';
}

@Injectable({ providedIn: 'root' })
export class ResumeHistoryService {
  private http = inject(HttpClient);

  getHistory(params: HistoryQueryParams = {}): Observable<PaginatedHistoryResponse> {
    const queryParams: Record<string, string | number> = {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
    };
    if (params.search) queryParams['search'] = params.search;
    if (params.sortOrder) queryParams['sortOrder'] = params.sortOrder;

    return this.http
      .get<ApiResponse<PaginatedHistoryResponse>>(
        API_ROUTES.createAPIRoute(API_ROUTES.RESUME.HISTORY),
        { params: queryParams as any },
      )
      .pipe(map((res) => res.data as PaginatedHistoryResponse));
  }

  getDetail(generationId: string): Observable<ResumeHistoryDetail> {
    return this.http
      .get<ApiResponse<ResumeHistoryDetail>>(
        API_ROUTES.createAPIRoute(`${API_ROUTES.RESUME.HISTORY}/${generationId}`),
      )
      .pipe(map((res) => res.data as ResumeHistoryDetail));
  }

  downloadResume(generationId: string): Observable<Blob> {
    return this.http.get(
      API_ROUTES.createAPIRoute(`${API_ROUTES.RESUME.DOWNLOAD}/${generationId}`),
      { responseType: 'blob' },
    );
  }
}
