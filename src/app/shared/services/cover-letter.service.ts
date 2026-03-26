import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_ROUTES } from '@core/constants/api.constant';
import { ApiResponse } from '@core/models/response/api-response.model';
import {
  CoverLetterResult,
  GenerateCoverLetterRequest,
} from '@features/resume-tailoring/models/cover-letter.model';

@Injectable({
  providedIn: 'root',
})
export class CoverLetterService {
  private readonly _http = inject(HttpClient);

  generateFromResumeGeneration(
    resumeGenerationId: string,
  ): Observable<CoverLetterResult> {
    const body: GenerateCoverLetterRequest = { resumeGenerationId };
    return this._http
      .post<ApiResponse<CoverLetterResult>>(
        API_ROUTES.createAPIRoute(API_ROUTES.RESUME.COVER_LETTER),
        body,
      )
      .pipe(map((res) => res.data as CoverLetterResult));
  }

  generateStandalone(
    jobPosition: string,
    companyName: string,
    jobDescription: string,
  ): Observable<CoverLetterResult> {
    const body: GenerateCoverLetterRequest = {
      jobPosition,
      companyName,
      jobDescription,
    };
    return this._http
      .post<ApiResponse<CoverLetterResult>>(
        API_ROUTES.createAPIRoute(API_ROUTES.RESUME.COVER_LETTER),
        body,
      )
      .pipe(map((res) => res.data as CoverLetterResult));
  }
}
