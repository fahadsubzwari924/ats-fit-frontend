import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, switchMap } from 'rxjs';
import { API_ROUTES } from '@core/constants/api.constant';
import { ApiResponse } from '@core/models/response/api-response.model';
import {
  CoverLetterResult,
  GenerateCoverLetterRequest,
} from '@features/resume-tailoring/models/cover-letter.model';
import {
  DownloadedResume,
  extractDownloadedResume,
} from '@core/utils/download-response.util';

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

  getByResumeGenerationId(
    resumeGenerationId: string,
  ): Observable<CoverLetterResult> {
    return this._http
      .get<ApiResponse<CoverLetterResult>>(
        API_ROUTES.createAPIRoute(
          `${API_ROUTES.RESUME.COVER_LETTER}/${resumeGenerationId}`,
        ),
      )
      .pipe(map((res) => res.data as CoverLetterResult));
  }

  /**
   * Stream the cover letter PDF for a given resume generation. The backend
   * renders it on demand from the structured cover-letter content stored at
   * generation time — no quota is consumed by the download itself.
   */
  downloadPdf(resumeGenerationId: string): Observable<DownloadedResume> {
    return this._http
      .get(
        API_ROUTES.createAPIRoute(
          API_ROUTES.RESUME.COVER_LETTER_DOWNLOAD(resumeGenerationId),
        ),
        { responseType: 'blob', observe: 'response' },
      )
      .pipe(map((response) => extractDownloadedResume(response)));
  }

  /**
   * Single-call API for the dashboard card and history modal:
   *   - If a cover letter already exists for this generation, just stream the PDF.
   *   - Otherwise generate the cover letter (consumes 1 quota unit on the server)
   *     and then stream the PDF in a single chained subscription.
   *
   * Callers use the returned `generated` flag to decide whether to notify the
   * local quota state and flip the row's `hasCoverLetter` to true.
   */
  ensureGeneratedAndDownload(
    resumeGenerationId: string,
    alreadyGenerated: boolean,
  ): Observable<{ blob: Blob; filename: string; generated: boolean }> {
    if (alreadyGenerated) {
      return this.downloadPdf(resumeGenerationId).pipe(
        map((d) => ({ ...d, generated: false })),
      );
    }
    return this.generateFromResumeGeneration(resumeGenerationId).pipe(
      switchMap(() => this.downloadPdf(resumeGenerationId)),
      map((d) => ({ ...d, generated: true })),
    );
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
