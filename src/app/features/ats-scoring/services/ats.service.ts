import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
// Contants
import { API_ROUTES } from '@core/constants/api.constant';
// Models
import { ApiResponse } from '@core/models/response/api-response.model';
import { ATSMatchScore } from '@features/ats-scoring/models/ats-match-score.model';
import { AtsMatchHistory } from '@features/ats-scoring/models/ats-match-history.model';

@Injectable({
  providedIn: 'root',
})
export class ATSService {

  private _http = inject(HttpClient);

  public generateATSMatchScore(payload: any): Observable<ATSMatchScore> {
    return this._http.post<ApiResponse<ATSMatchScore>>(API_ROUTES.createAPIRoute(API_ROUTES.RESUME.ATS_MATCH_SCORE), payload)
      .pipe(
        map(response => new ATSMatchScore(response?.data))
      );
  }

  public getATSMatchHistory(userId: any): Observable<AtsMatchHistory[]> {
    return this._http.get<ApiResponse<any>>(API_ROUTES.createAPIRoute(`${API_ROUTES.RESUME.ATS_MATCH_HISTORY}/${userId}`))
      .pipe(
        map(response => (response?.data || [])?.map((item: any) => new AtsMatchHistory(item)))
      );
  }

}
