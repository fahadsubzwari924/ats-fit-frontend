import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, map, Observable, of, shareReplay, switchMap, tap } from 'rxjs';
//Constants
import { API_ROUTES } from '@core/constants/api.constant';
// Models
import { ApiResponse } from '@core/models/response/api-response.model';
import { FeatureUsage } from '@core/models/user/feature-usage.model';
import { TailoredResume } from '@features/resume-tailoring/models/tailored-resume.model';
import { GenerateResumeOutcome } from '@features/resume-tailoring/models/generate-resume-outcome.model';
import {
  JobRelevanceDimensionLabel,
  JobRelevanceResult,
  JobRelevanceVerdict,
} from '@features/resume-tailoring/models/job-relevance.model';
import { ResumeTemplate } from '@features/resume-tailoring/models/resume-template.model';
import { ResumeHistoryItem } from '@features/dashboard/models/resume-history.model';
import { ReplaceResumeResponse, RestoreArchivedResumeResponse } from '@core/models/resume-replacement.model';
// Interfaces
import { IResumeUpload } from '@features/dashboard/enums/resume-upload.interface';
import {
  DownloadedResume,
  extractDownloadedResume,
} from '@core/utils/download-response.util';
import type { MatchScoreBlock } from '@shared/types/match-score-block.model';
import { classifyMatchScoreBlock } from '@shared/utils/match-score-classifier.util';
import type {
  BatchJobError,
  BatchJobErrorCategory,
} from '@features/tailor-apply/models/batch-tailoring.model';

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
  public generateTailoredResume(payload: FormData | Record<string, unknown>): Observable<GenerateResumeOutcome> {
    return this._http
      .post(API_ROUTES.createAPIRoute(API_ROUTES.RESUME.GENERATE), payload, {
        observe: 'response',
        responseType: 'blob',
      })
      .pipe(
        switchMap(async (response): Promise<GenerateResumeOutcome> => {
          const contentType = response.headers.get('content-type') ?? '';
          if (contentType.includes('application/json')) {
            const text = await (response.body as Blob).text();
            const json = JSON.parse(text) as { relevance: JobRelevanceResult };
            return { kind: 'low_fit_warning', relevance: json.relevance };
          }
          return {
            kind: 'pdf',
            resume: new TailoredResume({
              blob: response.body as Blob,
              filename: response.headers.get('x-filename') ?? undefined,
              resumeGenerationId: response.headers.get('x-resume-generation-id') ?? undefined,
              tailoringMode: (() => {
                const h = response.headers.get('x-tailoring-mode') ?? 'standard';
                return (['standard', 'enhanced', 'precision', 'none'].includes(h) ? h : 'standard') as import('@features/dashboard/models/resume-profile.model').TailoringMode;
              })(),
              keywordsAdded: Number(response.headers.get('x-keywords-added') ?? 0),
              sectionsOptimized: Number(response.headers.get('x-sections-optimized') ?? 0),
              achievementsQuantified: Number(response.headers.get('x-achievements-quantified') ?? 0),
              optimizationConfidence: null,
              matchScore: this.parseMatchScoreFromHeaders(response.headers),
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
              preGenerationRelevance: this.parseRelevanceFromHeaders(response.headers),
            }),
          };
        }),
      );
  }

  /**
   * Extracts the canonical `MatchScoreBlock` from the resume generation
   * response headers.
   *
   * Preference order:
   *   1. `X-Match-Score` — JSON-encoded canonical block (preferred path).
   *   2. Per-field fallback (`x-match-score-before/after/delta`) +
   *      `classifyMatchScoreBlock` to synthesize the missing classifier
   *      fields locally. Used only while older BE instances are still in
   *      rotation. TODO: remove after BE v2.3 stable.
   */
  private parseMatchScoreFromHeaders(
    headers: { get(name: string): string | null },
  ): MatchScoreBlock | null {
    const unified = headers.get('x-match-score');
    if (unified) {
      try {
        const parsed = JSON.parse(unified) as MatchScoreBlock;
        // Trust the BE shape — the unified header is the canonical contract.
        return parsed;
      } catch {
        // Malformed header — fall through to the per-field path so the user
        // still sees a score rather than a missing card.
      }
    }

    const afterHeader = headers.get('x-match-score-after');
    if (afterHeader === null) return null;
    const before = Number(headers.get('x-match-score-before') ?? 0);
    const after = Number(afterHeader);
    const deltaHeader = headers.get('x-match-score-delta');
    const delta = deltaHeader !== null ? Number(deltaHeader) : undefined;
    return classifyMatchScoreBlock(before, after, delta);
  }

  /**
   * Lightweight job-fit pre-check. Calls the BE `POST /resume-tailoring/relevance`
   * endpoint which runs ONLY the relevance scoring pass — no tailoring, no
   * PDF, no quota consumed. Used by the multi-step tailor flow to preview
   * fit before the user commits to spending a generation credit.
   */
  public checkJobRelevance(
    payload: FormData | Record<string, unknown>,
  ): Observable<JobRelevanceResult> {
    return this._http
      .post<{ relevance: JobRelevanceResult } | ApiResponse<{ relevance: JobRelevanceResult }>>(
        API_ROUTES.createAPIRoute(API_ROUTES.RESUME.RELEVANCE),
        payload,
      )
      .pipe(
        map((response) => {
          // Tolerate both the bare `{ relevance }` and the
          // `{ status, data: { relevance } }` envelope shapes — the global
          // response interceptor wraps some routes but not others.
          const raw = response as unknown as
            | { relevance: JobRelevanceResult }
            | { data: { relevance: JobRelevanceResult } };
          if (raw && typeof raw === 'object' && 'data' in raw && raw.data) {
            return (raw.data as { relevance: JobRelevanceResult }).relevance;
          }
          return (raw as { relevance: JobRelevanceResult }).relevance;
        }),
      );
  }

  /**
   * Parses the full pre-generation relevance breakdown from response headers.
   *
   * Preference order:
   *   1. `X-Relevance-Block` — JSON-encoded full JobRelevanceResult (canonical).
   *   2. Per-field fallback (`x-relevance-score` + `x-relevance-verdict`) for
   *      legacy BE versions. The fallback fabricates zero-filled dimensions
   *      so the type contract holds; callers should check dimensions.techStack
   *      score before relying on the breakdown.
   */
  private parseRelevanceFromHeaders(
    headers: { get(name: string): string | null },
  ): JobRelevanceResult | null {
    const block = headers.get('x-relevance-block');
    if (block) {
      try {
        return JSON.parse(block) as JobRelevanceResult;
      } catch {
        // fall through to per-field fallback
      }
    }
    const score = headers.get('x-relevance-score');
    const verdict = headers.get('x-relevance-verdict');
    if (score === null || verdict === null || verdict === '') return null;
    return {
      score: Number(score),
      verdict: verdict as JobRelevanceVerdict,
      dimensions: {
        techStack: { score: 0, label: JobRelevanceDimensionLabel.PARTIAL },
        roleType: { score: 0, label: JobRelevanceDimensionLabel.PARTIAL },
        experienceLevel: { score: 0, label: JobRelevanceDimensionLabel.PARTIAL },
      },
      gaps: [],
      strengths: [],
    };
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

  public replaceResume(
    formData: FormData,
    idempotencyKey?: string,
  ): Observable<ReplaceResumeResponse> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['idempotency-key'] = idempotencyKey;
    }
    return this._http.post<ReplaceResumeResponse>(
      API_ROUTES.createAPIRoute(API_ROUTES.USER.REPLACE_RESUME),
      formData,
      { headers },
    );
  }

  public restoreArchivedResume(
    archivedExtractId: string,
  ): Observable<RestoreArchivedResumeResponse> {
    return this._http.post<RestoreArchivedResumeResponse>(
      API_ROUTES.createAPIRoute(API_ROUTES.USER.RESTORE_ARCHIVED_RESUME),
      { archivedExtractId },
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

  public downloadResumeById(generationId: string): Observable<DownloadedResume> {
    return this._http
      .get(
        API_ROUTES.createAPIRoute(`${API_ROUTES.RESUME.DOWNLOAD}/${generationId}`),
        { responseType: 'blob', observe: 'response' },
      )
      .pipe(map((response) => extractDownloadedResume(response)));
  }

  /**
   * POST the per-job batch retry endpoint. The BE re-enqueues the failed job
   * in place and the actual state transitions arrive via the existing SSE
   * channel for the batch — callers MUST NOT optimistically update row state
   * from this response. On error the observable rethrows so the caller can
   * surface a category-specific toast (e.g. 429 → "retry limit").
   *
   * Endpoint: `POST /resume-tailoring/batch/v2/:batchId/jobs/:jobId/retry`
   * Success: `{ ok: true, jobId, retryCount }`
   * Errors: 403 (different user) / 404 (missing) / 409 (not retryable) /
   *         429 (retry limit). The HTTP error body carries `code` ===
   *         `ERR_RETRY_LIMIT_EXCEEDED` or `ERR_JOB_NOT_RETRYABLE` for the
   *         conflict states.
   */
  public retryBatchJob(
    batchId: string,
    jobId: string,
  ): Observable<{ ok: true; jobId: string; retryCount: number }> {
    return this._http
      .post<ApiResponse<{ ok: true; jobId: string; retryCount: number }>>(
        API_ROUTES.createAPIRoute(API_ROUTES.RESUME.BATCH_V2_RETRY_JOB(batchId, jobId)),
        {},
      )
      .pipe(
        map((response) => {
          // Both `{ status, data: { ok, jobId, retryCount } }` and the bare
          // `{ ok, jobId, retryCount }` shape are tolerated — the controller
          // returns the bare DTO today, but the global response interceptor
          // wraps it on some routes. Either is fine; we just look for `ok`.
          const raw = response as unknown as
            | ApiResponse<{ ok: true; jobId: string; retryCount: number }>
            | { ok: true; jobId: string; retryCount: number };
          if (raw && typeof raw === 'object' && 'data' in raw && raw.data) {
            return raw.data as { ok: true; jobId: string; retryCount: number };
          }
          return raw as { ok: true; jobId: string; retryCount: number };
        }),
      );
  }
}

/**
 * Synthesize a `BatchJobError` envelope from a legacy plain-string
 * `error_message` row (or any other raw error string from a mid-deploy
 * response). Exported so SSE handlers and snapshot mappers can reuse the same
 * normalization in one place — the FE never invents the envelope shape ad-hoc.
 */
export function synthesizeLegacyBatchJobError(message: string): BatchJobError {
  return {
    category: 'UNKNOWN' as BatchJobErrorCategory,
    userMessage: message,
    technicalDetail: 'legacy-format',
    retryable: true,
    occurredAt: '',
  };
}

/**
 * Normalize a raw `error` field from a BE batch-result payload into the
 * canonical `BatchJobError` envelope.
 *
 *   - If the BE returned an object with a `category` field → trust it.
 *   - If the BE returned a non-empty string (legacy / mid-deploy) → synthesize.
 *   - Otherwise → undefined.
 */
export function normalizeBatchJobError(raw: unknown): BatchJobError | undefined {
  if (!raw) return undefined;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return undefined;
    // Some intermediary deploys may have JSON-encoded the envelope into the
    // string column. Try to parse first; fall back to legacy synthesis if the
    // string isn't JSON or isn't a recognized envelope.
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed) as Partial<BatchJobError>;
        if (parsed && typeof parsed.category === 'string' && typeof parsed.userMessage === 'string') {
          return {
            category: parsed.category as BatchJobErrorCategory,
            userMessage: parsed.userMessage,
            technicalDetail: typeof parsed.technicalDetail === 'string' ? parsed.technicalDetail : '',
            retryable: typeof parsed.retryable === 'boolean' ? parsed.retryable : true,
            occurredAt: typeof parsed.occurredAt === 'string' ? parsed.occurredAt : '',
          };
        }
      } catch {
        // Fall through to legacy synthesis.
      }
    }
    return synthesizeLegacyBatchJobError(trimmed);
  }
  if (typeof raw === 'object') {
    const obj = raw as Partial<BatchJobError>;
    if (typeof obj.category === 'string' && typeof obj.userMessage === 'string') {
      return {
        category: obj.category as BatchJobErrorCategory,
        userMessage: obj.userMessage,
        technicalDetail: typeof obj.technicalDetail === 'string' ? obj.technicalDetail : '',
        retryable: typeof obj.retryable === 'boolean' ? obj.retryable : true,
        occurredAt: typeof obj.occurredAt === 'string' ? obj.occurredAt : '',
      };
    }
  }
  return undefined;
}
