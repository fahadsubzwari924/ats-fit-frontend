import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_ROUTES } from '@core/constants/api.constant';
import { ApiResponse } from '@core/models/response/api-response.model';
import { User } from '@core/models/user/user.model';

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private _http = inject(HttpClient);

  public getCurrentUser(): Observable<User> {
    return this._http
      .get<ApiResponse<any>>(API_ROUTES.createAPIRoute(API_ROUTES.USER.ME))
      .pipe(map(response => new User(response?.data)));
  }
}
