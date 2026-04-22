import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { API_ROUTES } from '@core/constants/api.constant';
import { ApiResponse } from '@core/models/response/api-response.model';
import { User } from '@core/models/user/user.model';
import { LoginResponse } from '@features/authentication/models/login-response.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private _http = inject(HttpClient);

  public login(payload: Record<string, unknown>): Observable<LoginResponse> {
    return this._http
      .post<ApiResponse<unknown>>(API_ROUTES.createAPIRoute(API_ROUTES.AUTH.SIGNIN), payload)
      .pipe(
        map((response) =>
          new LoginResponse(
            response.data as { user: Record<string, unknown>; access_token: string },
          ),
        ),
      );
  }

  public signup(user: Record<string, unknown>): Observable<ApiResponse<User>> {
    return this._http.post<ApiResponse<User>>(API_ROUTES.createAPIRoute(API_ROUTES.AUTH.SIGNUP), user);
  }

  public googleAuth(payload: Record<string, unknown>): Observable<LoginResponse> {
    return this._http
      .post<ApiResponse<unknown>>(API_ROUTES.createAPIRoute(API_ROUTES.AUTH.GOOGLE_LOGIN), payload)
      .pipe(
        map((response) =>
          new LoginResponse(
            response.data as { user: Record<string, unknown>; access_token: string },
          ),
        ),
      );
  }

}
