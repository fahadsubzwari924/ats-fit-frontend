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
  public generateTailoredResume(payload: any): Observable<TailoredResume> {
    return this._http
      .post(API_ROUTES.createAPIRoute(API_ROUTES.RESUME.GENERATE), payload, {
        observe: 'response',
        responseType: 'blob',
      })
      .pipe(
        map((response) => {
          // Extract headers
          const data = {
            atsScore: response.headers.get('x-ats-score'),
            fileName: response.headers.get('x-filename'),
            resumeGenerationId: response.headers.get('x-resume-generation-id'),
            blob: response.body as Blob,
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
            (template: any) => new ResumeTemplate(template)
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

  public deleteResume(resumeId: string): Observable<ApiResponse<any>> {
    return this._http.delete<ApiResponse<any>>(
      API_ROUTES.createAPIRoute(`${API_ROUTES.USER.DELETE_RESUME}/${resumeId}`)
    );
  }

  public getFeatureUsage(): Observable<FeatureUsage[]> {
    return this._http
      .get<ApiResponse<any>>(
        API_ROUTES.createAPIRoute(API_ROUTES.USER.FEATURE_USAGE)
      )
      .pipe(
        map((response) =>
          (response.data || [])?.map((item: any) => new FeatureUsage(item))
        )
      );
  }
}
