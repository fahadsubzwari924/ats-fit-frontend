import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_ROUTES } from '@core/constants/api.constant';
import { ApiResponse } from '@core/models/response/api-response.model';
import {
  BatchGenerateRequest,
  BatchGenerateResponse,
  BatchJobResult,
} from '@features/tailor-apply/models/batch-tailoring.model';

@Injectable({ providedIn: 'root' })
export class BatchTailoringService {
  private http = inject(HttpClient);

  generateBatch(payload: BatchGenerateRequest): Observable<BatchGenerateResponse> {
    return this.http
      .post<ApiResponse<BatchGenerateResponse>>(
        API_ROUTES.createAPIRoute(API_ROUTES.RESUME.BATCH_GENERATE),
        payload,
      )
      .pipe(map((res) => res.data as BatchGenerateResponse));
  }

  buildBlob(result: BatchJobResult): Blob | null {
    if (!result.pdfContent) return null;
    const binary = atob(result.pdfContent);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: 'application/pdf' });
  }
}
