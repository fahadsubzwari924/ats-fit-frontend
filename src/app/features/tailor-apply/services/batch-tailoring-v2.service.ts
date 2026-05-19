import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '@core/models/response/api-response.model';
import type { BatchGenerateRequest } from '../models/batch-tailoring.model';
import type {
  BatchSnapshot,
  EnqueueBatchV2ApiResponse,
} from '../models/batch-tailoring-v2.model';

@Injectable({ providedIn: 'root' })
export class BatchTailoringV2Service {
  private readonly http = inject(HttpClient);

  /**
   * Two possible response shapes — caller MUST narrow via `'type' in res`
   * before reading fields (see `EnqueueBatchV2ApiResponse`):
   *   - 202 ACCEPTED — `{ batchId, totalJobs }` (normal path, opens SSE)
   *   - 200 OK     — `{ type: 'batch_low_fit_warning', jobs }` (one or more
   *                   jobs scored verdict=low; FE shows warning + ack-retry)
   */
  enqueueBatch(payload: BatchGenerateRequest): Observable<EnqueueBatchV2ApiResponse> {
    const baseUrl = environment.baseUrl.replace(/\/$/, '');
    return this.http.post<EnqueueBatchV2ApiResponse>(
      `${baseUrl}/resume-tailoring/batch/v2/generate`,
      payload,
    );
  }

  getStatus(batchId: string): Observable<BatchSnapshot> {
    const baseUrl = environment.baseUrl.replace(/\/$/, '');
    return this.http
      .get<ApiResponse<BatchSnapshot>>(
        `${baseUrl}/resume-tailoring/batch/v2/${batchId}/status`,
      )
      .pipe(map((res) => res.data as BatchSnapshot));
  }
}
