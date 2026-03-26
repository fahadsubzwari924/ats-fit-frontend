import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_ROUTES } from '@core/constants/api.constant';
import { ApiResponse } from '@core/models/response/api-response.model';
import {
  ResumeDiff,
  ResumeDiffResponse,
} from '@features/resume-tailoring/models/resume-diff.model';

@Injectable({
  providedIn: 'root',
})
export class ResumeDiffService {
  private readonly _http = inject(HttpClient);

  getDiff(generationId: string): Observable<ResumeDiff | null> {
    return this._http
      .get<ApiResponse<ResumeDiffResponse>>(
        API_ROUTES.createAPIRoute(
          `${API_ROUTES.RESUME.DIFF}/${generationId}`,
        ),
      )
      .pipe(
        map((res) => {
          const data = res?.data as ResumeDiffResponse;
          return data?.changesDiff ?? null;
        }),
      );
  }
}
