import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { API_ROUTES } from '@core/constants/api.constant';
import { ApiResponse } from '@core/models/response/api-response.model';
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

  public signup(user: Record<string, unknown>): Observable<LoginResponse> {
    return this._http
      .post<ApiResponse<unknown>>(API_ROUTES.createAPIRoute(API_ROUTES.AUTH.SIGNUP), user)
      .pipe(
        map((response) =>
          new LoginResponse(
            response.data as { user: Record<string, unknown>; access_token: string },
          ),
        ),
      );
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

  public forgotPassword(email: string): Observable<{ message: string }> {
    return this._http
      .post<ApiResponse<{ message: string }>>(
        API_ROUTES.createAPIRoute(API_ROUTES.AUTH.FORGOT_PASSWORD),
        { email },
      )
      .pipe(map((response) => response.data as { message: string }));
  }

  public validateResetToken(
    token: string,
  ): Observable<{ valid: boolean; emailHint?: string; reason?: string }> {
    return this._http
      .get<ApiResponse<{ valid: boolean; emailHint?: string; reason?: string }>>(
        `${API_ROUTES.createAPIRoute(API_ROUTES.AUTH.VALIDATE_RESET_TOKEN)}?token=${encodeURIComponent(token)}`,
      )
      .pipe(
        map(
          (response) =>
            response.data as { valid: boolean; emailHint?: string; reason?: string },
        ),
      );
  }

  public resetPassword(
    token: string,
    newPassword: string,
  ): Observable<{ message: string }> {
    return this._http
      .post<ApiResponse<{ message: string }>>(
        API_ROUTES.createAPIRoute(API_ROUTES.AUTH.RESET_PASSWORD),
        { token, newPassword },
      )
      .pipe(map((response) => response.data as { message: string }));
  }
}
