import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, map, Observable, of, shareReplay, tap } from 'rxjs';
//Constants
import { API_ROUTES } from '@core/constants/api.constant';
// Models
import { ApiResponse } from '@core/models/response/api-response.model';
import { FeatureUsage } from '@core/models/user/feature-usage.model';
import { TailoredResume } from '@features/resume-tailoring/models/tailored-resume.model';
import { ResumeTemplate } from '@features/resume-tailoring/models/resume-template.model';
import { ResumeHistoryItem } from '@features/dashboard/models/resume-history.model';
// Interfaces
import { IResumeUpload } from '@features/dashboard/enums/resume-upload.interface';

@Injectable({
  providedIn: 'root',
})
export class ResumeService {
  private _http = inject(HttpClient);

  // Cache for resume templates
  private _templatesCache$ = new BehaviorSubject<ResumeTemplate[] | null>(null);

  /**
   * Observable stream of cached resume templates
   * Emits null initially, then the templates array once loaded
   */
  public readonly templates$ = this._templatesCache$.asObservable();

  /**
   * Available resume templates for selection
   * Returns empty array initially, then the templates array once loaded
   */
  public readonly availableTemplates = toSignal(this.templates$, {
    initialValue: [],
  });
  public generateTailoredResume(payload: FormData | Record<string, unknown>): Observable<TailoredResume> {
    return this._http
      .post(API_ROUTES.createAPIRoute(API_ROUTES.RESUME.GENERATE), payload, {
        observe: 'response',
        responseType: 'blob',
      })
      .pipe(
        map((response) => {
          const tailoringHeader = response.headers.get('x-tailoring-mode');
          const tailoringMode = (tailoringHeader ?? 'standard') as import('@features/dashboard/models/resume-profile.model').TailoringMode;
          const data = {
            filename: response.headers.get('x-filename') ?? undefined,
            resumeGenerationId: response.headers.get('x-resume-generation-id') ?? undefined,
            blob: response.body as Blob,
            tailoringMode: ['standard', 'enhanced', 'precision', 'none'].includes(tailoringHeader ?? '') ? tailoringMode : 'standard',
            keywordsAdded: Number(response.headers.get('x-keywords-added') ?? 0),
            sectionsOptimized: Number(response.headers.get('x-sections-optimized') ?? 0),
            achievementsQuantified: Number(response.headers.get('x-achievements-quantified') ?? 0),
            optimizationConfidence: null,
            matchScore: (() => {
              const after = response.headers.get('x-match-score-after');
              if (after === null) return null;
              return {
                before: Number(response.headers.get('x-match-score-before') ?? 0),
                after: Number(after),
                delta: Number(response.headers.get('x-match-score-delta') ?? 0),
              };
            })(),
            atsChecks: (() => {
              const passed = response.headers.get('x-ats-checks-passed');
              if (passed === null) return null;
              return {
                passed: Number(passed),
                total: Number(response.headers.get('x-ats-checks-total') ?? 10),
              };
            })(),
            bulletsQuantified: (() => {
              const before = response.headers.get('x-bullets-quantified-before');
              if (before === null) return null;
              return {
                before: Number(before),
                after: Number(response.headers.get('x-bullets-quantified-after') ?? 0),
                total: Number(response.headers.get('x-bullets-quantified-total') ?? 0),
              };
            })(),
          };
          return new TailoredResume(data);
        })
      );
  }

  public getResumeTemplates(): Observable<ResumeTemplate[]> {
    // Return cached templates if already loaded
    if (this._templatesCache$.value) {
      return of(this._templatesCache$.value);
    }

    // Fetch from API and cache the result
    return this._http
      .get<ApiResponse<ResumeTemplate[]>>(
        API_ROUTES.createAPIRoute(API_ROUTES.RESUME.TEMPLATE)
      )
      .pipe(
        map((response) =>
          ((response?.data || []) as ResumeTemplate[])?.map(
            (template: unknown) => new ResumeTemplate(template as Record<string, unknown>),
          )
        ),
        tap((templates) => this._templatesCache$.next(templates)),
        shareReplay(1)
      );
  }

  /**
   * Force refresh templates from the server
   * Clears cache and fetches fresh data
   */
  public refreshTemplates(): Observable<ResumeTemplate[]> {
    this._templatesCache$.next(null);
    return this.getResumeTemplates();
  }

  public uploadResume(
    formData: FormData
  ): Observable<ApiResponse<IResumeUpload>> {
    return this._http.post<ApiResponse<IResumeUpload>>(
      API_ROUTES.createAPIRoute(API_ROUTES.USER.UPLOAD_RESUME),
      formData
    );
  }

  public deleteResume(resumeId: string): Observable<ApiResponse<unknown>> {
    return this._http.delete<ApiResponse<unknown>>(
      API_ROUTES.createAPIRoute(`${API_ROUTES.USER.DELETE_RESUME}/${resumeId}`)
    );
  }

  public getFeatureUsage(): Observable<FeatureUsage[]> {
    return this._http
      .get<ApiResponse<unknown>>(
        API_ROUTES.createAPIRoute(API_ROUTES.USER.FEATURE_USAGE)
      )
      .pipe(
        map((response) =>
          ((response.data as unknown[]) || []).map(
            (item: unknown) => new FeatureUsage(item as Record<string, unknown>),
          ),
        )
      );
  }

  public getResumeHistory(limit = 10): Observable<ResumeHistoryItem[]> {
    return this._http
      .get<ApiResponse<ResumeHistoryItem[]>>(
        API_ROUTES.createAPIRoute(API_ROUTES.RESUME.HISTORY),
        { params: { limit } }
      )
      .pipe(map((res) => (Array.isArray(res?.data) ? res.data : [])));
  }

  public downloadResumeById(generationId: string): Observable<Blob> {
    return this._http.get(
      API_ROUTES.createAPIRoute(`${API_ROUTES.RESUME.DOWNLOAD}/${generationId}`),
      { responseType: 'blob' }
    );
  }
}
