import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '@core/models/response/api-response.model';
import type { BatchGenerateRequest } from '../models/batch-tailoring.model';
import type {
  BatchSnapshot,
  EnqueueBatchV2Response,
} from '../models/batch-tailoring-v2.model';

@Injectable({ providedIn: 'root' })
export class BatchTailoringV2Service {
  private readonly http = inject(HttpClient);

  enqueueBatch(payload: BatchGenerateRequest): Observable<EnqueueBatchV2Response> {
    const baseUrl = environment.baseUrl.replace(/\/$/, '');
    return this.http
      .post<ApiResponse<EnqueueBatchV2Response>>(
        `${baseUrl}/resume-tailoring/batch/v2/generate`,
        payload,
      )
      .pipe(map((res) => res.data as EnqueueBatchV2Response));
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
