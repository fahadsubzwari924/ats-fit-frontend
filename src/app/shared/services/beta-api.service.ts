import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_ROUTES } from '@core/constants/api.constant';
import { ApiResponse } from '@core/models/response/api-response.model';
import { BetaStatus } from '@core/models/beta/beta-status.model';

@Injectable({ providedIn: 'root' })
export class BetaApiService {
  private _http = inject(HttpClient);

  public getStatus(): Observable<BetaStatus> {
    return this._http
      .get<ApiResponse<unknown>>(API_ROUTES.createAPIRoute(API_ROUTES.BETA.STATUS))
      .pipe(map(response => new BetaStatus(response?.data)));
  }

  public redeemCode(code: string): Observable<{ betaAccessUntil: Date; foundingRateLocked: boolean }> {
    return this._http
      .post<ApiResponse<Record<string, unknown>>>(
        API_ROUTES.createAPIRoute(API_ROUTES.BETA.REDEEM),
        { code }
      )
      .pipe(
        map(response => {
          const d = response?.data as Record<string, unknown>;
          const rawUntil = d['beta_access_until'] ?? d['betaAccessUntil'];
          return {
            betaAccessUntil: new Date(rawUntil as string),
            foundingRateLocked: (d['founding_rate_locked'] ?? d['foundingRateLocked'] ?? false) as boolean,
          };
        })
      );
  }
}
